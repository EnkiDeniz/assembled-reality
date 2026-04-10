import { NextResponse } from "next/server";
import {
  createReaderProjectForUser,
  deleteReaderProjectForUser,
  getReaderProjectForUser,
  updateReaderProjectForUser,
} from "@/lib/reader-projects";
import { validateRootText } from "@/lib/assembly-architecture";
import {
  deleteLoegosOriginExampleForUser,
  dismissLoegosOriginExampleUpdateForUser,
  refreshLoegosOriginExampleForUser,
} from "@/lib/loegos-origin-example";
import { ensureCompilerFirstWorkspaceResetForUser } from "@/lib/room-sessions";
import { getRequiredSession } from "@/lib/server-session";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const title = String(body?.title || "").trim();
  const subtitle = String(body?.subtitle || "").trim();
  const rootText = String(body?.rootText || "").trim();
  const rootGloss = String(body?.rootGloss || "").trim();

  if (!title) {
    return NextResponse.json({ error: "Box title is required." }, { status: 400 });
  }

  await ensureCompilerFirstWorkspaceResetForUser(session.user.id);

  if (rootText) {
    const rootError = validateRootText(rootText);
    if (rootError) {
      return NextResponse.json({ error: rootError }, { status: 400 });
    }
  }

  try {
    const project = await createReaderProjectForUser(session.user.id, {
      title,
      subtitle,
      rootText,
      rootGloss,
      includeDefaultSource: false,
    });

    return NextResponse.json({
      ok: true,
      project: {
        id: project.id,
        projectKey: project.projectKey,
        title: project.title,
        subtitle: project.subtitle,
        isPinned: Boolean(project.isPinned),
        isArchived: Boolean(project.isArchived),
        metadataJson: project.metadataJson || null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create the box." },
      { status: 400 },
    );
  }
}

export async function PUT(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const projectKey = String(body?.projectKey || "").trim();
  const hasTitle = Boolean(body) && Object.prototype.hasOwnProperty.call(body, "title");
  const hasSubtitle = Boolean(body) && Object.prototype.hasOwnProperty.call(body, "subtitle");
  const hasPinned = Boolean(body) && Object.prototype.hasOwnProperty.call(body, "isPinned");
  const hasArchived = Boolean(body) && Object.prototype.hasOwnProperty.call(body, "isArchived");
  const hasRootText = Boolean(body) && Object.prototype.hasOwnProperty.call(body, "rootText");
  const hasRootGloss = Boolean(body) && Object.prototype.hasOwnProperty.call(body, "rootGloss");
  const hasApplicableDomains =
    Boolean(body) && Object.prototype.hasOwnProperty.call(body, "applicableDomains");
  const hasDomainRationales =
    Boolean(body) && Object.prototype.hasOwnProperty.call(body, "domainRationales");
  const hasAssemblyState =
    Boolean(body) && Object.prototype.hasOwnProperty.call(body, "assemblyState");
  const exampleAction = String(body?.exampleAction || "").trim().toLowerCase();
  const title = String(body?.title || "").trim();
  const subtitle = hasSubtitle ? body?.subtitle : undefined;
  const isPinned = hasPinned ? Boolean(body?.isPinned) : undefined;
  const isArchived = hasArchived ? Boolean(body?.isArchived) : undefined;
  const rootText = hasRootText ? String(body?.rootText || "").trim() : undefined;
  const rootGloss = hasRootGloss ? String(body?.rootGloss || "").trim() : undefined;
  const applicableDomains = hasApplicableDomains ? body?.applicableDomains : undefined;
  const domainRationales = hasDomainRationales ? body?.domainRationales : undefined;
  const assemblyState = hasAssemblyState ? body?.assemblyState : undefined;

  if (!projectKey) {
    return NextResponse.json({ error: "Box key is required." }, { status: 400 });
  }

  if (exampleAction) {
    try {
      const result =
        exampleAction === "create-updated-copy"
          ? await refreshLoegosOriginExampleForUser(session.user.id, projectKey, {
              createUpdatedCopy: true,
            })
          : exampleAction === "refresh"
            ? await refreshLoegosOriginExampleForUser(session.user.id, projectKey)
            : exampleAction === "dismiss-update"
              ? await dismissLoegosOriginExampleUpdateForUser(session.user.id, projectKey)
              : null;

      if (!result) {
        return NextResponse.json({ error: "Unknown example action." }, { status: 400 });
      }

      const project =
        result.projectKey
          ? await getReaderProjectForUser(session.user.id, result.projectKey)
          : null;

      return NextResponse.json({
        ok: true,
        exampleAction: result.action,
        projectKey: result.projectKey,
        project: project
          ? {
              id: project.id,
              projectKey: project.projectKey,
              title: project.title,
              subtitle: project.subtitle,
              currentAssemblyDocumentKey: project.currentAssemblyDocumentKey || null,
              isPinned: Boolean(project.isPinned),
              isArchived: Boolean(project.isArchived),
              metadataJson: project.metadataJson || null,
            }
          : null,
      });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Could not update the example box." },
        { status: 400 },
      );
    }
  }

  if (hasTitle && !title) {
    return NextResponse.json({ error: "Box title is required." }, { status: 400 });
  }

  if (hasRootText && rootText) {
    const rootError = validateRootText(rootText);
    if (rootError) {
      return NextResponse.json({ error: rootError }, { status: 400 });
    }
  }

  if (
    !hasTitle &&
    !hasSubtitle &&
    !hasPinned &&
    !hasArchived &&
    !hasRootText &&
    !hasRootGloss &&
    !hasApplicableDomains &&
    !hasDomainRationales &&
    !hasAssemblyState
  ) {
    return NextResponse.json({ error: "No box changes were provided." }, { status: 400 });
  }

  try {
    const project = await updateReaderProjectForUser(session.user.id, projectKey, {
      ...(hasTitle ? { title } : {}),
      ...(hasSubtitle ? { subtitle } : {}),
      ...(hasPinned ? { isPinned } : {}),
      ...(hasArchived ? { isArchived } : {}),
      ...(hasRootText ? { rootText } : {}),
      ...(hasRootGloss ? { rootGloss } : {}),
      ...(hasApplicableDomains ? { applicableDomains } : {}),
      ...(hasDomainRationales ? { domainRationales } : {}),
      ...(hasAssemblyState ? { assemblyState } : {}),
    });

    return NextResponse.json({
      ok: true,
      project: {
        id: project.id,
        projectKey: project.projectKey,
        title: project.title,
        subtitle: project.subtitle,
        currentAssemblyDocumentKey: project.currentAssemblyDocumentKey || null,
        isPinned: Boolean(project.isPinned),
        isArchived: Boolean(project.isArchived),
        metadataJson: project.metadataJson || null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not rename the box." },
      { status: 400 },
    );
  }
}

export async function DELETE(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const projectKey = String(body?.projectKey || "").trim();

  if (!projectKey) {
    return NextResponse.json({ error: "Box key is required." }, { status: 400 });
  }

  try {
    const exampleResult = await deleteLoegosOriginExampleForUser(session.user.id, projectKey);
    const result =
      exampleResult ||
      (await deleteReaderProjectForUser(session.user.id, projectKey));

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete the box." },
      { status: 400 },
    );
  }
}
