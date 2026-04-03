import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PROJECT_KEY,
  buildDefaultProjectFromDocuments,
  buildProjectsFromDocuments,
} from "@/lib/project-model";

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

function toProjectDocumentRole(document) {
  return document?.isAssembly || document?.documentType === "assembly" ? "ASSEMBLY" : "SOURCE";
}

function getDocumentTimestamp(document) {
  const parsed = Date.parse(document?.updatedAt || document?.createdAt || "");
  return Number.isNaN(parsed) ? 0 : parsed;
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

    const currentAssemblyDocumentKey =
      project.currentAssemblyDocumentKey ||
      fallbackProject.currentAssemblyDocumentKey ||
      null;

    if (currentAssemblyDocumentKey !== project.currentAssemblyDocumentKey) {
      await readerProjectModel.update({
        where: {
          id: project.id,
        },
        data: {
          currentAssemblyDocumentKey,
        },
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

export async function attachDocumentToDefaultProjectForUser(
  userId,
  {
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
    const project =
      (await readerProjectModel.findFirst({
        where: {
          userId,
          projectKey: DEFAULT_PROJECT_KEY,
        },
      })) ||
      (await readerProjectModel.create({
        data: {
          userId,
          projectKey: DEFAULT_PROJECT_KEY,
          title: "Main Project",
          subtitle: "Start from a source and build toward a working assembly.",
          currentAssemblyDocumentKey: setAsCurrentAssembly ? documentKey : null,
        },
      }));

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
