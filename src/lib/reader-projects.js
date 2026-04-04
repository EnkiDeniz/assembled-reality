import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PROJECT_KEY,
  DEFAULT_PROJECT_SUBTITLE,
  DEFAULT_PROJECT_TITLE,
  PRIMARY_WORKSPACE_DOCUMENT_KEY,
  buildDefaultProjectFromDocuments,
  buildProjectsFromDocuments,
} from "@/lib/project-model";
import { slugify } from "@/lib/text";

function getReaderProjectModel() {
  return prisma.readerProject || null;
}

function getReaderProjectDocumentModel() {
  return prisma.readerProjectDocument || null;
}

function isMissingProjectTableError(error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2021";
  }

  return false;
}

function isMissingReceiptProjectIdColumnError(error) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== "P2022") {
    return false;
  }

  return String(error.meta?.column || "")
    .toLowerCase()
    .includes("projectid");
}

function toProjectDocumentRole(document) {
  return document?.isAssembly || document?.documentType === "assembly" ? "ASSEMBLY" : "SOURCE";
}

function getDocumentTimestamp(document) {
  const parsed = Date.parse(document?.updatedAt || document?.createdAt || "");
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getDefaultProjectSeed(currentAssemblyDocumentKey = null) {
  return {
    title: DEFAULT_PROJECT_TITLE,
    subtitle: DEFAULT_PROJECT_SUBTITLE,
    currentAssemblyDocumentKey: currentAssemblyDocumentKey || null,
  };
}

async function ensureUniqueProjectKey(userId, baseKey) {
  const readerProjectModel = getReaderProjectModel();
  if (!readerProjectModel) {
    return baseKey;
  }

  const normalizedBaseKey = String(baseKey || "").trim() || "box";
  const existingKeys = new Set(
    (
      await readerProjectModel.findMany({
        where: { userId },
        select: { projectKey: true },
      })
    ).map((entry) => entry.projectKey),
  );

  if (!existingKeys.has(normalizedBaseKey)) {
    return normalizedBaseKey;
  }

  let index = 2;
  while (existingKeys.has(`${normalizedBaseKey}-${index}`)) {
    index += 1;
  }

  return `${normalizedBaseKey}-${index}`;
}

function sortProjectDocumentsForPersistence(documents = []) {
  return [...documents].sort((left, right) => {
    const roleWeight =
      (toProjectDocumentRole(left) === "ASSEMBLY" ? 1 : 0) -
      (toProjectDocumentRole(right) === "ASSEMBLY" ? 1 : 0);

    if (roleWeight !== 0) {
      return roleWeight;
    }

    return getDocumentTimestamp(left) - getDocumentTimestamp(right);
  });
}

function sortMembershipsForMove(memberships = []) {
  return [...memberships].sort((left, right) => {
    const roleWeight = (left?.role === "ASSEMBLY" ? 1 : 0) - (right?.role === "ASSEMBLY" ? 1 : 0);
    if (roleWeight !== 0) {
      return roleWeight;
    }

    return (left?.position || 0) - (right?.position || 0);
  });
}

function serializePersistedProject(projectRecord, allDocuments = []) {
  const documentMap = new Map(
    (Array.isArray(allDocuments) ? allDocuments : []).map((document) => [document.documentKey, document]),
  );
  const memberships = Array.isArray(projectRecord?.documents) ? projectRecord.documents : [];
  const memberDocuments = memberships
    .map((membership) => documentMap.get(membership.documentKey))
    .filter(Boolean);
  const fallbackProject = buildDefaultProjectFromDocuments(memberDocuments);
  const sourceDocumentKeys = memberships
    .filter((membership) => membership.role === "SOURCE")
    .map((membership) => membership.documentKey);
  const assemblyDocumentKeys = memberships
    .filter((membership) => membership.role === "ASSEMBLY")
    .map((membership) => membership.documentKey);

  return {
    ...fallbackProject,
    id: projectRecord.id,
    projectKey: projectRecord.projectKey,
    title: projectRecord.title,
    subtitle: projectRecord.subtitle || fallbackProject.subtitle,
    documentKeys: memberships.map((membership) => membership.documentKey),
    sourceDocumentKeys,
    assemblyDocumentKeys,
    currentAssemblyDocumentKey:
      projectRecord.currentAssemblyDocumentKey || fallbackProject.currentAssemblyDocumentKey || null,
    defaultDocumentKey:
      projectRecord.currentAssemblyDocumentKey ||
      fallbackProject.defaultDocumentKey,
    createdAt: projectRecord.createdAt?.toISOString?.() || fallbackProject.createdAt || null,
    updatedAt: projectRecord.updatedAt?.toISOString?.() || fallbackProject.updatedAt || null,
  };
}

async function ensureDefaultProjectRecord(userId, documents = []) {
  const readerProjectModel = getReaderProjectModel();
  const readerProjectDocumentModel = getReaderProjectDocumentModel();

  if (!readerProjectModel || !readerProjectDocumentModel) {
    return null;
  }

  const fallbackProject = buildDefaultProjectFromDocuments(documents);
  const sortedDocuments = sortProjectDocumentsForPersistence(documents);

  try {
    const existingProject = await readerProjectModel.findFirst({
      where: {
        userId,
        projectKey: DEFAULT_PROJECT_KEY,
      },
      include: {
        documents: {
          orderBy: [{ role: "asc" }, { position: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    const project =
      existingProject ||
      (await readerProjectModel.create({
        data: {
          userId,
          projectKey: DEFAULT_PROJECT_KEY,
          title: fallbackProject.title,
          subtitle: fallbackProject.subtitle,
          currentAssemblyDocumentKey: fallbackProject.currentAssemblyDocumentKey,
        },
        include: {
          documents: {
            orderBy: [{ role: "asc" }, { position: "asc" }, { createdAt: "asc" }],
          },
        },
      }));

    const existingMemberships = new Set(project.documents.map((membership) => membership.documentKey));
    const missingDocuments = sortedDocuments.filter(
      (document) => !existingMemberships.has(document.documentKey),
    );

    if (missingDocuments.length > 0) {
      await prisma.$transaction(
        missingDocuments.map((document, index) =>
          readerProjectDocumentModel.create({
            data: {
              projectId: project.id,
              documentKey: document.documentKey,
              role: toProjectDocumentRole(document),
              position: project.documents.length + index,
            },
          }),
        ),
      );
    }

    const nextProjectData = {
      title: fallbackProject.title,
      subtitle: fallbackProject.subtitle,
      currentAssemblyDocumentKey: fallbackProject.currentAssemblyDocumentKey || null,
    };

    if (
      nextProjectData.title !== project.title ||
      nextProjectData.subtitle !== project.subtitle ||
      nextProjectData.currentAssemblyDocumentKey !== project.currentAssemblyDocumentKey
    ) {
      await readerProjectModel.update({
        where: {
          id: project.id,
        },
        data: nextProjectData,
      });
    }

    return readerProjectModel.findFirst({
      where: {
        id: project.id,
      },
      include: {
        documents: {
          orderBy: [{ role: "asc" }, { position: "asc" }, { createdAt: "asc" }],
        },
      },
    });
  } catch (error) {
    if (isMissingProjectTableError(error)) {
      return null;
    }

    throw error;
  }
}

async function findOrCreateProjectRecordForUser(
  userId,
  projectKey = DEFAULT_PROJECT_KEY,
  { createIfMissing = false, currentAssemblyDocumentKey = null } = {},
) {
  const readerProjectModel = getReaderProjectModel();
  if (!readerProjectModel) {
    return null;
  }

  try {
    const existingProject = await readerProjectModel.findFirst({
      where: {
        userId,
        projectKey,
      },
    });
    if (existingProject || !createIfMissing || projectKey !== DEFAULT_PROJECT_KEY) {
      return existingProject;
    }

    return readerProjectModel.create({
      data: {
        userId,
        projectKey,
        ...getDefaultProjectSeed(currentAssemblyDocumentKey),
      },
    });
  } catch (error) {
    if (isMissingProjectTableError(error)) {
      return null;
    }

    throw error;
  }
}

export async function listReaderProjectsForUser(userId, documents = []) {
  const readerProjectModel = getReaderProjectModel();
  if (!readerProjectModel) {
    return buildProjectsFromDocuments(documents);
  }

  try {
    const defaultProject = await ensureDefaultProjectRecord(userId, documents);
    if (!defaultProject) {
      return buildProjectsFromDocuments(documents);
    }

    const projectRecords = await readerProjectModel.findMany({
      where: { userId },
      include: {
        documents: {
          orderBy: [{ role: "asc" }, { position: "asc" }, { createdAt: "asc" }],
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });

    return projectRecords.map((projectRecord) =>
      serializePersistedProject(projectRecord, documents),
    );
  } catch (error) {
    if (isMissingProjectTableError(error)) {
      return buildProjectsFromDocuments(documents);
    }

    throw error;
  }
}

export async function getReaderProjectForUser(
  userId,
  projectKey = DEFAULT_PROJECT_KEY,
  options = {},
) {
  return findOrCreateProjectRecordForUser(userId, projectKey, options);
}

export async function createReaderProjectForUser(
  userId,
  {
    title,
    subtitle = "",
    sourceDocumentKeys = [PRIMARY_WORKSPACE_DOCUMENT_KEY],
    includeDefaultSource = true,
  } = {},
) {
  const readerProjectModel = getReaderProjectModel();
  const readerProjectDocumentModel = getReaderProjectDocumentModel();

  if (!readerProjectModel || !readerProjectDocumentModel) {
    throw new Error("Boxes are temporarily unavailable.");
  }

  const normalizedTitle = String(title || "").trim() || DEFAULT_PROJECT_TITLE;
  const normalizedSubtitle = String(subtitle || "").trim() || DEFAULT_PROJECT_SUBTITLE;
  const projectKey = await ensureUniqueProjectKey(userId, slugify(normalizedTitle) || "box");
  const normalizedSourceKeys = [
    ...new Set(
      (Array.isArray(sourceDocumentKeys) ? sourceDocumentKeys : [PRIMARY_WORKSPACE_DOCUMENT_KEY])
        .map((documentKey) => String(documentKey || "").trim())
        .filter(Boolean),
    ),
  ];
  const initialSourceKeys = normalizedSourceKeys.length
    ? normalizedSourceKeys
    : includeDefaultSource
      ? [PRIMARY_WORKSPACE_DOCUMENT_KEY]
      : [];

  try {
    const project = await readerProjectModel.create({
      data: {
        userId,
        projectKey,
        title: normalizedTitle,
        subtitle: normalizedSubtitle,
        currentAssemblyDocumentKey: null,
        ...(initialSourceKeys.length
          ? {
              documents: {
                create: initialSourceKeys.map((documentKey, index) => ({
                  documentKey,
                  role: "SOURCE",
                  position: index,
                })),
              },
            }
          : {}),
      },
      include: {
        documents: {
          orderBy: [{ role: "asc" }, { position: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    return project;
  } catch (error) {
    if (isMissingProjectTableError(error)) {
      throw new Error("Boxes are temporarily unavailable.");
    }

    throw error;
  }
}

export async function updateReaderProjectForUser(
  userId,
  projectKey,
  {
    title,
    subtitle,
  } = {},
) {
  const readerProjectModel = getReaderProjectModel();

  if (!readerProjectModel) {
    throw new Error("Boxes are temporarily unavailable.");
  }

  const normalizedProjectKey = String(projectKey || "").trim() || DEFAULT_PROJECT_KEY;
  const normalizedTitle = String(title || "").trim();

  if (!normalizedTitle) {
    throw new Error("Box title is required.");
  }

  try {
    const project = await readerProjectModel.findFirst({
      where: {
        userId,
        projectKey: normalizedProjectKey,
      },
    });

    if (!project) {
      throw new Error("Box not found.");
    }

    return await readerProjectModel.update({
      where: {
        id: project.id,
      },
      data: {
        title: normalizedTitle,
        ...(subtitle === undefined
          ? {}
          : {
              subtitle: String(subtitle || "").trim() || null,
            }),
      },
      include: {
        documents: {
          orderBy: [{ role: "asc" }, { position: "asc" }, { createdAt: "asc" }],
        },
      },
    });
  } catch (error) {
    if (isMissingProjectTableError(error)) {
      throw new Error("Boxes are temporarily unavailable.");
    }

    throw error;
  }
}

export async function deleteReaderProjectForUser(userId, projectKey) {
  const readerProjectModel = getReaderProjectModel();
  const readerProjectDocumentModel = getReaderProjectDocumentModel();

  if (!readerProjectModel || !readerProjectDocumentModel) {
    throw new Error("Boxes are temporarily unavailable.");
  }

  const normalizedProjectKey = String(projectKey || "").trim() || DEFAULT_PROJECT_KEY;

  if (normalizedProjectKey === DEFAULT_PROJECT_KEY) {
    throw new Error("The default box cannot be deleted.");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const project = await tx.readerProject.findFirst({
        where: {
          userId,
          projectKey: normalizedProjectKey,
        },
        include: {
          documents: {
            orderBy: [{ role: "asc" }, { position: "asc" }, { createdAt: "asc" }],
          },
        },
      });

      if (!project) {
        throw new Error("Box not found.");
      }

      let defaultProject = await tx.readerProject.findFirst({
        where: {
          userId,
          projectKey: DEFAULT_PROJECT_KEY,
        },
        include: {
          documents: {
            orderBy: [{ role: "asc" }, { position: "asc" }, { createdAt: "asc" }],
          },
        },
      });

      if (!defaultProject) {
        defaultProject = await tx.readerProject.create({
          data: {
            userId,
            projectKey: DEFAULT_PROJECT_KEY,
            ...getDefaultProjectSeed(null),
          },
          include: {
            documents: {
              orderBy: [{ role: "asc" }, { position: "asc" }, { createdAt: "asc" }],
            },
          },
        });
      }

      const existingMemberships = new Map(
        defaultProject.documents.map((membership) => [membership.documentKey, membership]),
      );
      const membershipsToCreate = [];
      const membershipsToPromote = [];
      const orderedMemberships = sortMembershipsForMove(project.documents);

      orderedMemberships.forEach((membership) => {
        const existingMembership = existingMemberships.get(membership.documentKey);

        if (!existingMembership) {
          membershipsToCreate.push(membership);
          return;
        }

        if (membership.role === "ASSEMBLY" && existingMembership.role !== "ASSEMBLY") {
          membershipsToPromote.push(existingMembership.id);
        }
      });

      const startingPosition = defaultProject.documents.length;

      for (const [index, membership] of membershipsToCreate.entries()) {
        await tx.readerProjectDocument.create({
          data: {
            projectId: defaultProject.id,
            documentKey: membership.documentKey,
            role: membership.role,
            position: startingPosition + index,
          },
        });
      }

      for (const membershipId of membershipsToPromote) {
        await tx.readerProjectDocument.update({
          where: {
            id: membershipId,
          },
          data: {
            role: "ASSEMBLY",
          },
        });
      }

      const nextDefaultAssemblyDocumentKey =
        defaultProject.currentAssemblyDocumentKey || project.currentAssemblyDocumentKey || null;

      if (nextDefaultAssemblyDocumentKey !== defaultProject.currentAssemblyDocumentKey) {
        await tx.readerProject.update({
          where: {
            id: defaultProject.id,
          },
          data: {
            currentAssemblyDocumentKey: nextDefaultAssemblyDocumentKey,
          },
        });
      }

      let movedDraftCount = 0;
      try {
        const draftMove = await tx.readingReceiptDraft.updateMany({
          where: {
            userId,
            projectId: project.id,
          },
          data: {
            projectId: defaultProject.id,
          },
        });
        movedDraftCount = draftMove?.count || 0;
      } catch (error) {
        if (!isMissingReceiptProjectIdColumnError(error)) {
          throw error;
        }
      }

      await tx.readerProject.delete({
        where: {
          id: project.id,
        },
      });

      return {
        deletedProjectKey: project.projectKey,
        deletedProjectTitle: project.title,
        fallbackProjectKey: defaultProject.projectKey,
        fallbackProjectTitle: defaultProject.title,
        movedDocumentCount: orderedMemberships.length,
        movedDraftCount,
      };
    });
  } catch (error) {
    if (isMissingProjectTableError(error)) {
      throw new Error("Boxes are temporarily unavailable.");
    }

    throw error;
  }
}

export async function attachDocumentToProjectForUser(
  userId,
  {
    projectKey = DEFAULT_PROJECT_KEY,
    documentKey,
    role = "SOURCE",
    setAsCurrentAssembly = false,
  },
) {
  const readerProjectModel = getReaderProjectModel();
  const readerProjectDocumentModel = getReaderProjectDocumentModel();

  if (!readerProjectModel || !readerProjectDocumentModel || !documentKey) {
    return;
  }

  try {
    const project = await findOrCreateProjectRecordForUser(userId, projectKey, {
      createIfMissing: true,
      currentAssemblyDocumentKey: setAsCurrentAssembly ? documentKey : null,
    });
    if (!project) {
      return;
    }

    const existingMembership = await readerProjectDocumentModel.findFirst({
      where: {
        projectId: project.id,
        documentKey,
      },
    });

    if (!existingMembership) {
      const count = await readerProjectDocumentModel.count({
        where: {
          projectId: project.id,
        },
      });

      await readerProjectDocumentModel.create({
        data: {
          projectId: project.id,
          documentKey,
          role,
          position: count,
        },
      });
    }

    if (setAsCurrentAssembly) {
      await readerProjectModel.update({
        where: {
          id: project.id,
        },
        data: {
          currentAssemblyDocumentKey: documentKey,
        },
      });
    }
  } catch (error) {
    if (isMissingProjectTableError(error)) {
      return;
    }

    throw error;
  }
}

export async function attachDocumentToDefaultProjectForUser(userId, options = {}) {
  return attachDocumentToProjectForUser(userId, {
    projectKey: DEFAULT_PROJECT_KEY,
    ...options,
  });
}
