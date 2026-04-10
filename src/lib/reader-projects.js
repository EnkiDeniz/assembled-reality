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
import {
  buildAssemblyIndexEvent,
  mergeProjectArchitectureMeta,
  normalizeProjectArchitectureMeta,
} from "@/lib/assembly-architecture";
import {
  LOEGOS_ORIGIN_TEMPLATE_VERSION,
  normalizeProjectSystemMeta,
} from "@/lib/loegos-origin-template";
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

function isMissingProjectMetadataColumnError(error) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== "P2022") {
    return false;
  }

  return String(error.meta?.column || "")
    .toLowerCase()
    .includes("metadatajson");
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

function buildTouchedSystemExamplePatch(currentMeta = null) {
  const normalizedMeta = normalizeProjectArchitectureMeta(currentMeta);
  const systemMeta = normalizeProjectSystemMeta(normalizedMeta.system);
  if (!String(systemMeta?.templateId || "").trim()) {
    return null;
  }

  return {
    ...systemMeta,
    userModifiedExample: true,
    userModifiedAt: systemMeta.userModifiedAt || new Date().toISOString(),
    dismissedTemplateVersion: 0,
  };
}

function buildSystemVersionInfo(systemMeta = null) {
  const normalizedSystemMeta = normalizeProjectSystemMeta(systemMeta);
  const isSystemExample = Boolean(normalizedSystemMeta?.templateId);
  const templateVersionApplied =
    Number(normalizedSystemMeta.templateVersionApplied ?? normalizedSystemMeta.templateVersion) || 0;
  const templateVersionLatest = isSystemExample ? LOEGOS_ORIGIN_TEMPLATE_VERSION : 0;
  const dismissedTemplateVersion = Number(normalizedSystemMeta.dismissedTemplateVersion) || 0;
  const updateAvailable =
    isSystemExample &&
    templateVersionLatest > 0 &&
    templateVersionApplied < templateVersionLatest &&
    dismissedTemplateVersion < templateVersionLatest;

  return {
    isSystemExample,
    templateVersionApplied,
    templateVersionLatest,
    updateAvailable,
    userModifiedExample: Boolean(normalizedSystemMeta.userModifiedExample),
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

function getProjectSystemMeta(metadataJson = null) {
  const normalized = normalizeProjectArchitectureMeta(metadataJson);
  return normalized.system && typeof normalized.system === "object"
    ? normalized.system
    : {};
}

function getProjectTimestamp(project = null) {
  const parsed = Date.parse(String(project?.updatedAt || project?.createdAt || ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sortSerializedProjects(projects = []) {
  return [...projects].sort((left, right) => {
    const rightSystemPriority = Number(right?.systemSortPriority) || 0;
    const leftSystemPriority = Number(left?.systemSortPriority) || 0;
    if (rightSystemPriority !== leftSystemPriority) {
      return rightSystemPriority - leftSystemPriority;
    }

    const pinWeight = Number(Boolean(right?.isPinned)) - Number(Boolean(left?.isPinned));
    if (pinWeight !== 0) {
      return pinWeight;
    }

    return getProjectTimestamp(right) - getProjectTimestamp(left);
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
  const normalizedMeta = normalizeProjectArchitectureMeta(projectRecord?.metadataJson);
  const systemMeta = getProjectSystemMeta(normalizedMeta);
  const systemVersionInfo = buildSystemVersionInfo(systemMeta);
  const isSystemExample = systemVersionInfo.isSystemExample;
  const serializedCreatedAt =
    (isSystemExample
      ? normalizedMeta?.root?.createdAt
      : "") ||
    projectRecord.createdAt?.toISOString?.() ||
    fallbackProject.createdAt ||
    null;
  const serializedUpdatedAt =
    (isSystemExample
      ? normalizedMeta?.assemblyState?.updatedAt
      : "") ||
    projectRecord.updatedAt?.toISOString?.() ||
    fallbackProject.updatedAt ||
    null;

  return {
    ...fallbackProject,
    id: projectRecord.id,
    projectKey: projectRecord.projectKey,
    title: projectRecord.title,
    subtitle: projectRecord.subtitle || fallbackProject.subtitle,
    isPinned: Boolean(projectRecord.isPinned),
    isArchived: Boolean(projectRecord.isArchived),
    documentKeys: memberships.map((membership) => membership.documentKey),
    sourceDocumentKeys,
    assemblyDocumentKeys,
    currentAssemblyDocumentKey:
      projectRecord.currentAssemblyDocumentKey || fallbackProject.currentAssemblyDocumentKey || null,
    defaultDocumentKey:
      projectRecord.currentAssemblyDocumentKey ||
      fallbackProject.defaultDocumentKey,
    createdAt: serializedCreatedAt,
    updatedAt: serializedUpdatedAt,
    receiptDraftCount: Number(projectRecord?._count?.readingReceiptDrafts) || 0,
    latestReceiptUpdatedAt:
      projectRecord?.readingReceiptDrafts?.[0]?.updatedAt?.toISOString?.() || null,
    metadataJson: normalizedMeta,
    architectureMeta: normalizedMeta,
    isSystemExample,
    systemTemplateId: String(systemMeta?.templateId || "").trim(),
    systemTemplateVersion:
      systemVersionInfo.templateVersionLatest || Number(systemMeta?.templateVersion) || 0,
    systemTemplateVersionApplied: systemVersionInfo.templateVersionApplied,
    systemExampleUpdateAvailable: systemVersionInfo.updateAvailable,
    systemExampleUserModified: systemVersionInfo.userModifiedExample,
    systemExampleLabel: isSystemExample
      ? String(systemMeta?.exampleLabel || "Example").trim() || "Example"
      : "",
    systemSortPriority: Number(systemMeta?.sortPriority) || 0,
    boxIntroLine: String(systemMeta?.introLine || "").trim(),
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
          metadataJson: null,
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
    if (isMissingProjectTableError(error) || isMissingProjectMetadataColumnError(error)) {
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
    if (isMissingProjectTableError(error) || isMissingProjectMetadataColumnError(error)) {
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
        readingReceiptDrafts: {
          orderBy: [{ updatedAt: "desc" }],
          take: 1,
          select: {
            updatedAt: true,
          },
        },
        _count: {
          select: {
            readingReceiptDrafts: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });

    return sortSerializedProjects(
      projectRecords.map((projectRecord) => serializePersistedProject(projectRecord, documents)),
    );
  } catch (error) {
    if (isMissingProjectTableError(error) || isMissingProjectMetadataColumnError(error)) {
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
    rootText = "",
    rootGloss = "",
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
  const rootMeta =
    String(rootText || "").trim() || String(rootGloss || "").trim()
      ? mergeProjectArchitectureMeta(null, {
          root: {
            text: String(rootText || "").trim(),
            gloss: String(rootGloss || "").trim(),
            createdAt: new Date().toISOString(),
            locked: Boolean(String(rootText || "").trim()),
          },
          events: String(rootText || "").trim()
            ? [
                buildAssemblyIndexEvent("root_declared", {
                  declaration: String(rootText || "").trim(),
                  move: "Declared the Root for this box.",
                  return: "The box now has a declared line.",
                  echo: "declare-root -> rooted",
                  context: {
                    rootText: String(rootText || "").trim(),
                  },
                }),
              ]
            : [],
        })
      : null;
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
        metadataJson: rootMeta,
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
    if (isMissingProjectTableError(error) || isMissingProjectMetadataColumnError(error)) {
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
    isPinned,
    isArchived,
    rootText,
    rootGloss,
    applicableDomains,
    domainRationales,
    assemblyState,
    stateHistory,
    appendEvents = [],
    touchSystemExample = false,
    skipExampleTouch = false,
    systemPatch = undefined,
    roomState = undefined,
  } = {},
) {
  const readerProjectModel = getReaderProjectModel();

  if (!readerProjectModel) {
    throw new Error("Boxes are temporarily unavailable.");
  }

  const normalizedProjectKey = String(projectKey || "").trim() || DEFAULT_PROJECT_KEY;
  const hasTitle = title !== undefined;
  const hasSubtitle = subtitle !== undefined;
  const hasPinned = isPinned !== undefined;
  const hasArchived = isArchived !== undefined;
  const hasRootText = rootText !== undefined;
  const hasRootGloss = rootGloss !== undefined;
  const hasApplicableDomains = applicableDomains !== undefined;
  const hasDomainRationales = domainRationales !== undefined;
  const hasAssemblyState = assemblyState !== undefined;
  const hasStateHistory = stateHistory !== undefined;
  const hasRoomState = roomState !== undefined;
  const normalizedTitle = String(title || "").trim();

  if (
    !hasTitle &&
    !hasSubtitle &&
    !hasPinned &&
    !hasArchived &&
    !hasRootText &&
    !hasRootGloss &&
    !hasApplicableDomains &&
    !hasDomainRationales &&
    !hasAssemblyState &&
    !hasStateHistory &&
    !hasRoomState &&
    !touchSystemExample &&
    systemPatch === undefined &&
    !(Array.isArray(appendEvents) && appendEvents.length)
  ) {
    throw new Error("No box changes were provided.");
  }

  if (hasTitle && !normalizedTitle) {
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

    if (project.projectKey === DEFAULT_PROJECT_KEY && isArchived === true) {
      throw new Error("The default box cannot be archived.");
    }

    const currentMeta = normalizeProjectArchitectureMeta(project.metadataJson);
    const nextRootDraft = {
      ...currentMeta.root,
      ...(hasRootText ? { text: String(rootText || "").trim() } : {}),
      ...(hasRootGloss ? { gloss: String(rootGloss || "").trim() } : {}),
      ...(hasRootText && String(rootText || "").trim()
        ? {
            createdAt: currentMeta.root.createdAt || new Date().toISOString(),
            locked: currentMeta.root.locked || true,
          }
        : {}),
    };
    if (currentMeta.root.locked && hasRootText && String(rootText || "").trim() !== currentMeta.root.text) {
      throw new Error("The root text is immutable after declaration.");
    }
    const derivedAppendEvents = Array.isArray(appendEvents) ? [...appendEvents] : [];
    if (!currentMeta.root.text && nextRootDraft.text) {
      derivedAppendEvents.push(
        buildAssemblyIndexEvent("root_declared", {
          declaration: nextRootDraft.text,
          move: "Declared the Root for this box.",
          return: "The box now has a declared line.",
          echo: "declare-root -> rooted",
          context: {
            rootText: nextRootDraft.text,
          },
        }),
      );
    }

    const nextArchived = hasArchived ? Boolean(isArchived) : Boolean(project.isArchived);
    const nextPinned =
      nextArchived
        ? false
        : hasPinned
          ? Boolean(isPinned)
          : Boolean(project.isPinned);
    const shouldTouchSystemExample =
      !skipExampleTouch &&
      (Boolean(touchSystemExample) || hasTitle || hasSubtitle || hasRootText || hasRootGloss);
    const nextSystemPatch = shouldTouchSystemExample
      ? buildTouchedSystemExamplePatch(currentMeta)
      : systemPatch === undefined
        ? null
        : {
            ...normalizeProjectSystemMeta(currentMeta.system),
            ...(systemPatch || {}),
          };

    return await readerProjectModel.update({
      where: {
        id: project.id,
      },
      data: {
        ...(hasTitle
          ? {
              title: normalizedTitle,
            }
          : {}),
        ...(hasSubtitle
          ? {
              subtitle: String(subtitle || "").trim() || null,
            }
          : {}),
        ...(hasPinned || hasArchived
          ? {
              isPinned: nextPinned,
              isArchived: nextArchived,
            }
          : {}),
        ...((hasRootText ||
          hasRootGloss ||
          hasApplicableDomains ||
          hasDomainRationales ||
          hasAssemblyState ||
          hasStateHistory ||
          hasRoomState ||
          derivedAppendEvents.length > 0 ||
          nextSystemPatch)
          ? {
              metadataJson: mergeProjectArchitectureMeta(currentMeta, {
                ...(hasRootText || hasRootGloss ? { root: nextRootDraft } : {}),
                ...(hasApplicableDomains ? { applicableDomains } : {}),
                ...(hasDomainRationales ? { domainRationales } : {}),
                ...(hasAssemblyState ? { assemblyState } : {}),
                ...(hasStateHistory ? { stateHistory } : {}),
                ...(hasRoomState ? { room: roomState } : {}),
                ...(nextSystemPatch ? { system: nextSystemPatch } : {}),
                ...(derivedAppendEvents.length > 0
                  ? { events: derivedAppendEvents }
                  : {}),
              }),
            }
          : {}),
      },
      include: {
        documents: {
          orderBy: [{ role: "asc" }, { position: "asc" }, { createdAt: "asc" }],
        },
        readingReceiptDrafts: {
          orderBy: [{ updatedAt: "desc" }],
          take: 1,
          select: {
            updatedAt: true,
          },
        },
        _count: {
          select: {
            readingReceiptDrafts: true,
          },
        },
      },
    });
  } catch (error) {
    if (isMissingProjectTableError(error) || isMissingProjectMetadataColumnError(error)) {
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
    if (isMissingProjectTableError(error) || isMissingProjectMetadataColumnError(error)) {
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
    appendEvents = [],
    touchSystemExample = true,
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

    const normalizedAppendEvents = Array.isArray(appendEvents) ? appendEvents.filter(Boolean) : [];
    const nextProjectData = {};

    if (setAsCurrentAssembly) {
      nextProjectData.currentAssemblyDocumentKey = documentKey;
    }

    const nextSystemPatch =
      touchSystemExample ? buildTouchedSystemExamplePatch(project.metadataJson) : null;

    if (normalizedAppendEvents.length > 0 || nextSystemPatch) {
      nextProjectData.metadataJson = mergeProjectArchitectureMeta(project.metadataJson, {
        ...(nextSystemPatch ? { system: nextSystemPatch } : {}),
        events: normalizedAppendEvents,
      });
    }

    if (Object.keys(nextProjectData).length > 0) {
      await readerProjectModel.update({
        where: {
          id: project.id,
        },
        data: nextProjectData,
      });
    }
  } catch (error) {
    if (isMissingProjectTableError(error) || isMissingProjectMetadataColumnError(error)) {
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

export async function appendReaderProjectAssemblyEventForUser(
  userId,
  projectKey,
  event,
) {
  if (!event || !projectKey) return null;

  return updateReaderProjectForUser(userId, projectKey, {
    appendEvents: [event],
  });
}

export async function recordReaderProjectSessionCheckpointForUser(
  userId,
  projectKey,
  {
    seedDocumentKey = "",
    reason = "activity",
  } = {},
) {
  const normalizedProjectKey = String(projectKey || "").trim();
  if (!normalizedProjectKey) return { created: false };

  const project = await prisma.readerProject.findFirst({
    where: {
      userId,
      projectKey: normalizedProjectKey,
    },
    select: {
      projectKey: true,
      currentAssemblyDocumentKey: true,
      metadataJson: true,
    },
  });

  if (!project?.projectKey) {
    return { created: false };
  }

  const meta = normalizeProjectArchitectureMeta(project.metadataJson);
  const events = Array.isArray(meta.assemblyIndexMeta?.events) ? meta.assemblyIndexMeta.events : [];
  const meaningfulTypes = new Set([
    "source_added",
    "source_derived",
    "history_export_imported",
    "root_declared",
    "block_confirmed",
    "block_discarded",
    "seed_created",
    "seed_updated",
    "operate_ran",
    "receipt_drafted",
    "receipt_sealed",
    "state_advanced",
  ]);
  const lastCheckpoint = [...events]
    .reverse()
    .find((event) => String(event?.type || "").trim().toLowerCase() === "session_checkpoint");
  const lastCheckpointAt = Date.parse(String(lastCheckpoint?.at || ""));
  const meaningfulEvents = events.filter((event) =>
    meaningfulTypes.has(String(event?.type || "").trim().toLowerCase()),
  );
  const recentMeaningfulEvents = meaningfulEvents.filter((event) => {
    const eventAt = Date.parse(String(event?.at || ""));
    if (Number.isNaN(eventAt)) return false;
    if (Number.isNaN(lastCheckpointAt)) return true;
    return eventAt > lastCheckpointAt;
  });

  if (!recentMeaningfulEvents.length) {
    return { created: false };
  }

  const latestMeaningfulEvent = recentMeaningfulEvents[recentMeaningfulEvents.length - 1];
  const latestMeaningfulAt = Date.parse(String(latestMeaningfulEvent?.at || ""));
  const now = Date.now();
  const withinCheckpointWindow =
    Number.isFinite(lastCheckpointAt) && now - lastCheckpointAt < 30 * 60 * 1000;
  const latestMeaningfulType = String(latestMeaningfulEvent?.type || "").trim().toLowerCase();

  if (withinCheckpointWindow && latestMeaningfulType !== "receipt_sealed") {
    return { created: false };
  }

  const checkpointEvent = buildAssemblyIndexEvent("session_checkpoint", {
    at: new Date().toISOString(),
    move: "Recorded a session checkpoint.",
    return:
      recentMeaningfulEvents.length === 1
        ? `The box recorded ${latestMeaningfulType.replace(/_/g, " ")} since the last checkpoint.`
        : `The box recorded ${recentMeaningfulEvents.length} meaningful changes since the last checkpoint.`,
    echo: reason,
    context: {
      reason,
      seedDocumentKey:
        String(seedDocumentKey || "").trim() ||
        String(project.currentAssemblyDocumentKey || "").trim() ||
        "",
      latestMeaningfulType,
      latestMeaningfulAt: Number.isFinite(latestMeaningfulAt)
        ? new Date(latestMeaningfulAt).toISOString()
        : "",
      meaningfulEventCount: recentMeaningfulEvents.length,
    },
  });

  await updateReaderProjectForUser(userId, normalizedProjectKey, {
    appendEvents: [checkpointEvent],
  });

  return {
    created: true,
    event: checkpointEvent,
  };
}

export async function markSystemExampleProjectTouchedForUser(userId, projectKey) {
  const normalizedProjectKey = String(projectKey || "").trim();
  if (!normalizedProjectKey) return null;

  return updateReaderProjectForUser(userId, normalizedProjectKey, {
    touchSystemExample: true,
  });
}

export async function markSystemExampleProjectTouchedByDocumentForUser(userId, documentKey) {
  const normalizedDocumentKey = String(documentKey || "").trim();
  if (!normalizedDocumentKey) return null;

  const project = await prisma.readerProject.findFirst({
    where: {
      userId,
      documents: {
        some: {
          documentKey: normalizedDocumentKey,
        },
      },
    },
    select: {
      projectKey: true,
      metadataJson: true,
    },
  });

  if (!project?.projectKey) {
    return null;
  }

  const normalizedMeta = normalizeProjectArchitectureMeta(project.metadataJson);
  const systemMeta = normalizeProjectSystemMeta(normalizedMeta.system);
  if (!String(systemMeta?.templateId || "").trim()) {
    return null;
  }

  return updateReaderProjectForUser(userId, project.projectKey, {
    touchSystemExample: true,
  });
}
