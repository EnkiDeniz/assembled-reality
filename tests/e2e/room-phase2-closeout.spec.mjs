import { expect, test } from "@playwright/test";

test.setTimeout(300_000);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildOperateSummary() {
  return {
    aim: {
      sentence: "Locate the exact abandonment step.",
      level: "L2",
      rationale: "The box already points at a concrete product failure.",
    },
    ground: {
      sentence: "Beta users abandon somewhere in onboarding.",
      level: "L2",
      rationale: "That witness is present in the box.",
    },
    bridge: {
      sentence: "The step is still unnamed.",
      level: "L1",
      rationale: "The gap is specific but unresolved.",
    },
    gradient: 3,
    convergence: "divergent",
    trustFloor: "L1",
    trustCeiling: "L2",
    nextMove: "Compare the two onboarding sessions.",
  };
}

function buildRoomView({
  project,
  projects,
  session,
  sessions,
  messages,
  fieldState,
  mirror,
  activePreview,
  focusedWitness = null,
  overlayIntent = "",
  operate = null,
  recentSources = [],
  hasStructure = true,
  starter = null,
}) {
  const roomIdentity = {
    boxTitle: project.title,
    conversationTitle: session.title,
    canonScopeLabel: "Canon stays box-level across conversations.",
  };
  const adjacentOperate =
    operate ||
    {
      available: true,
      hasRun: true,
      lastRunAt: "2026-04-10T11:45:00.000Z",
      nextMove: "Compare the two onboarding sessions.",
      includedSourceCount: 1,
      documentKey: "doc_dropoff",
      openHref: `/workspace?project=${project.projectKey}&sessionId=${session.id}&adjacent=operate`,
    };

  return {
    project: {
      projectKey: project.projectKey,
      title: project.title,
      subtitle: project.subtitle || "",
      sourceCount: project.sourceCount ?? 1,
      receiptDraftCount: project.receiptDraftCount ?? 0,
      hasSeed: true,
      connectionStatus: "DISCONNECTED",
    },
    projects,
    roomIdentity,
    session: {
      id: session.id,
      title: session.title,
      handoffSummary: session.handoffSummary || "",
      isActive: true,
      isArchived: false,
    },
    sessions,
    messages,
    focusedWitness,
    adjacent: {
      operate: adjacentOperate,
    },
    overlayIntent,
    authorityContext: {
      project: {
        projectKey: project.projectKey,
        title: project.title,
        subtitle: project.subtitle || "",
      },
      session: {
        id: session.id,
        title: session.title,
        handoffSummary: session.handoffSummary || "",
        isActive: true,
        isArchived: false,
      },
      canonSource: {
        documentKey: `room_${project.projectKey}`,
        title: "Hidden Room source",
      },
      sources: recentSources,
      assembly: {
        documentKey: `room_${project.projectKey}`,
        title: "Hidden Room source",
      },
      focusedWitness,
      adjacent: {
        operate: adjacentOperate,
      },
      artifact: {
        clauseCount: hasStructure ? 3 : 0,
        compileState: hasStructure ? "actionable" : "pristine",
        runtimeState: fieldState?.key || "open",
        mergedWindowState: fieldState?.key || "open",
      },
      runtime: {
        state: fieldState?.key || "open",
        waiting: fieldState?.key === "awaiting",
        nextBestAction: activePreview?.nextBestAction || "",
      },
      mirror,
      diagnostics: [],
      resetAt: "2026-04-10T11:00:00.000Z",
    },
    roomDocument: {
      documentKey: `room_${project.projectKey}`,
      title: "Hidden Room source",
    },
    roomSourceSummary: {
      clauseCount: hasStructure ? 3 : 0,
      compileState: hasStructure ? "actionable" : "pristine",
      runtimeState: fieldState?.key || "open",
      mergedWindowState: fieldState?.key || "open",
    },
    hasStructure,
    fieldState,
    interaction: {
      stateChip: null,
      paneContract: null,
      nextBestAction: activePreview?.nextBestAction || "",
    },
    mirror,
    pendingMove: null,
    activePreview,
    recentReturns: [],
    recentSources,
    receiptSummary: {
      draftCount: 0,
      recentDrafts: [],
    },
    latestReceiptKit: null,
    deepLinks: {
      room: `/workspace?project=${project.projectKey}&sessionId=${session.id}`,
      reader: `/workspace?project=${project.projectKey}&sessionId=${session.id}&document=doc_dropoff&adjacent=witness`,
      compare: "",
      operate: `/workspace?project=${project.projectKey}&sessionId=${session.id}&adjacent=operate`,
      receipts: "",
    },
    starter:
      starter ||
      {
        show: !hasStructure,
        firstLine: "What's on your mind?",
        secondLine: "Create a box when you're ready. The Room will start fresh.",
      },
    diagnostics: [],
    resetAt: "2026-04-10T11:00:00.000Z",
  };
}

function makeFixtures() {
  const projects = [
    {
      projectKey: "box_alpha",
      title: "Fix drop-off",
      subtitle: "Beta onboarding failure",
      sourceCount: 1,
      receiptDraftCount: 0,
      hasSeed: true,
      updatedAt: "2026-04-10T12:00:00.000Z",
      isSystemExample: false,
    },
    {
      projectKey: "box_beta",
      title: "Fresh room",
      subtitle: "",
      sourceCount: 0,
      receiptDraftCount: 0,
      hasSeed: false,
      updatedAt: "2026-04-10T12:00:00.000Z",
      isSystemExample: false,
    },
  ];
  const alphaSessionsBase = [
    {
      id: "session_alpha_1",
      title: "Conversation One",
      handoffSummary: "Need the exact drop-off step.",
      messageCount: 2,
      updatedAt: "2026-04-10T12:01:00.000Z",
      isArchived: false,
      isActive: true,
    },
    {
      id: "session_alpha_2",
      title: "Conversation Two",
      handoffSummary: "Compare onboarding traces next.",
      messageCount: 2,
      updatedAt: "2026-04-10T12:02:00.000Z",
      isArchived: false,
      isActive: false,
    },
  ];
  const alphaMessagesPreview = [
    {
      id: "msg_user_1",
      role: "user",
      content: "Users are getting lost and abandoning.",
      createdAt: "2026-04-10T12:00:00.000Z",
      previewStatus: "none",
      roomPayload: null,
    },
    {
      id: "msg_assistant_1",
      role: "assistant",
      content: "Name the exact abandonment step. Pull one beta trace.",
      createdAt: "2026-04-10T12:00:10.000Z",
      previewStatus: "active",
      roomPayload: {
        proposalId: "proposal_alpha_1",
        turnMode: "proposal",
        gatePreview: {
          accepted: true,
          nextBestAction: "Apply this preview to make it canonical.",
          diagnostics: [],
        },
        segments: [
          {
            id: "seg_1",
            text: "Name the exact abandonment step.",
            domain: "aim",
            mirrorRegion: "aim",
            suggestedClause: 'DIR aim "Name the exact abandonment step."',
          },
          {
            id: "seg_2",
            text: "Pull one beta trace.",
            domain: "move",
            mirrorRegion: "moves",
            suggestedClause: 'MOV move "Pull one beta trace." via manual',
          },
        ],
        receiptKit: null,
      },
    },
  ];
  const alphaMirrorPreview = {
    aim: {
      text: "Fix drop-off: users abandon, trigger unknown.",
      gloss: "",
    },
    evidence: [
      {
        id: "ev_1",
        title: "Code is live with beta users",
        detail: "Observed this week.",
        documentKey: "doc_dropoff",
      },
    ],
    story: [
      {
        id: "story_1",
        text: "The exact failing step is still unnamed.",
        detail: "",
      },
    ],
    moves: [
      {
        id: "move_1",
        text: "Pull one beta session trace.",
        detail: "One precise ping.",
        status: "suggested",
      },
    ],
    returns: [],
  };
  const alphaMirrorApplied = {
    ...alphaMirrorPreview,
    aim: {
      text: "Locate the exact abandonment step.",
      gloss: "",
    },
  };
  const recentSources = [
    {
      id: "source_1",
      documentKey: "doc_dropoff",
      title: "Drop-off dashboard",
      metaLine: "Live product witness",
      operateSummary: "Dashboard export",
    },
  ];
  const activePreview = {
    previewId: "preview_alpha_1",
    proposalId: "proposal_alpha_1",
    assistantMessageId: "msg_assistant_1",
    status: "active",
    sourceLayer: "conversation",
    assistantText: "Name the exact abandonment step. Pull one beta trace.",
    segments: alphaMessagesPreview[1].roomPayload.segments,
    gatePreview: alphaMessagesPreview[1].roomPayload.gatePreview,
    receiptKit: null,
    nextBestAction: "Apply this preview to make it canonical.",
  };

  const alphaBase = buildRoomView({
    project: projects[0],
    projects,
    session: alphaSessionsBase[0],
    sessions: alphaSessionsBase,
    messages: alphaMessagesPreview,
    fieldState: { key: "awaiting", label: "Awaiting" },
    mirror: alphaMirrorPreview,
    activePreview,
    recentSources,
  });

  const alphaApplied = buildRoomView({
    project: projects[0],
    projects,
    session: alphaSessionsBase[0],
    sessions: alphaSessionsBase,
    messages: [
      alphaMessagesPreview[0],
      {
        ...alphaMessagesPreview[1],
        previewStatus: "applied",
      },
    ],
    fieldState: { key: "awaiting", label: "Awaiting" },
    mirror: alphaMirrorApplied,
    activePreview: null,
    recentSources,
  });

  const alphaSessionTwoSessions = [
    {
      ...alphaSessionsBase[0],
      isActive: false,
    },
    {
      ...alphaSessionsBase[1],
      isActive: true,
    },
  ];
  const alphaSessionTwo = buildRoomView({
    project: projects[0],
    projects,
    session: alphaSessionTwoSessions[1],
    sessions: alphaSessionTwoSessions,
    messages: [
      {
        id: "msg_user_2",
        role: "user",
        content: "We mostly see it after onboarding.",
        createdAt: "2026-04-10T12:03:00.000Z",
        previewStatus: "none",
        roomPayload: null,
      },
      {
        id: "msg_assistant_2",
        role: "assistant",
        content: "Compare two onboarding traces.",
        createdAt: "2026-04-10T12:03:10.000Z",
        previewStatus: "none",
        roomPayload: {
          turnMode: "conversation",
          segments: [],
          receiptKit: null,
        },
      },
    ],
    fieldState: { key: "awaiting", label: "Awaiting" },
    mirror: alphaMirrorApplied,
    activePreview: null,
    recentSources,
  });

  const alphaWitness = {
    ...clone(alphaBase),
    focusedWitness: {
      documentKey: "doc_dropoff",
      title: "Drop-off dashboard",
      sourceSummary: "Live product witness",
      provenanceLabel: "Dashboard export",
      excerptBlocks: [
        {
          id: "block_1",
          kind: "paragraph",
          text: "Users cluster in onboarding and leave before the final step.",
        },
      ],
      openHref: "/workspace?project=box_alpha&sessionId=session_alpha_1&document=doc_dropoff&adjacent=witness",
    },
    overlayIntent: "witness",
  };
  alphaWitness.authorityContext.focusedWitness = alphaWitness.focusedWitness;

  const operateSummary = buildOperateSummary();
  const alphaOperate = {
    ...clone(alphaApplied),
    overlayIntent: "operate",
    adjacent: {
      operate: {
        available: true,
        hasRun: true,
        lastRunAt: "2026-04-10T11:45:00.000Z",
        nextMove: operateSummary.nextMove,
        includedSourceCount: 1,
        documentKey: "doc_dropoff",
        openHref: "/workspace?project=box_alpha&sessionId=session_alpha_1&adjacent=operate",
      },
    },
  };
  alphaOperate.authorityContext.adjacent = alphaOperate.adjacent;

  const betaStarter = buildRoomView({
    project: projects[1],
    projects,
    session: {
      id: "session_beta_1",
      title: "Conversation Fresh",
      handoffSummary: "",
    },
    sessions: [
      {
        id: "session_beta_1",
        title: "Conversation Fresh",
        handoffSummary: "",
        messageCount: 0,
        updatedAt: "2026-04-10T12:04:00.000Z",
        isArchived: false,
        isActive: true,
      },
    ],
    messages: [],
    fieldState: { key: "fog", label: "Fog" },
    mirror: {
      aim: { text: "", gloss: "" },
      evidence: [],
      story: [],
      moves: [],
      returns: [],
    },
    activePreview: null,
    recentSources: [],
    hasStructure: false,
    starter: {
      show: true,
      firstLine: "What's on your mind?",
      secondLine: "Create a box when you're ready. The Room will start fresh.",
    },
    operate: {
      available: false,
      hasRun: false,
      lastRunAt: "",
      nextMove: "",
      includedSourceCount: 0,
      documentKey: "",
      openHref: "/workspace?project=box_beta&sessionId=session_beta_1&adjacent=operate",
    },
  });

  return {
    alphaBase,
    alphaApplied,
    alphaSessionTwo,
    alphaWitness,
    alphaOperate,
    betaStarter,
    operateSummary,
  };
}

async function openCreateBox(page) {
  await page.getByTestId("room-open-context").click();
  const createInput = page.getByTestId("room-create-box-name");
  if (!(await createInput.isVisible().catch(() => false))) {
    await page.getByTestId("room-open-create-box").click();
  }
  await expect(createInput).toBeVisible();
}

async function bootstrapRoom(page, context, baseURL) {
  const bootstrapResponse = await context.request.get(`${baseURL}/api/auth/dev-guardian`);
  expect(bootstrapResponse.ok()).toBeTruthy();

  const fixtures = makeFixtures();
  const state = {
    alphaVariant: "base",
  };

  function getAlphaView() {
    if (state.alphaVariant === "applied") return fixtures.alphaApplied;
    if (state.alphaVariant === "session_two") return fixtures.alphaSessionTwo;
    return fixtures.alphaBase;
  }

  function buildRoomResponse(url) {
    const projectKey = url.searchParams.get("projectKey") || url.searchParams.get("project") || "";
    const sessionId = url.searchParams.get("sessionId") || url.searchParams.get("session") || "";
    const documentKey = url.searchParams.get("documentKey") || url.searchParams.get("document") || "";
    const adjacent = url.searchParams.get("adjacent") || "";

    if (projectKey === "box_beta") {
      return fixtures.betaStarter;
    }

    if (projectKey === "box_alpha") {
      if (adjacent === "witness" && documentKey === "doc_dropoff") {
        return fixtures.alphaWitness;
      }
      if (adjacent === "operate") {
        return fixtures.alphaOperate;
      }
      if (sessionId === "session_alpha_2") {
        return fixtures.alphaSessionTwo;
      }
      return getAlphaView();
    }

    return fixtures.betaStarter;
  }

  await page.route("**/api/workspace/project", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        project: {
          id: "project_alpha",
          projectKey: "box_alpha",
          title: "Fix drop-off",
          subtitle: "Beta onboarding failure",
          isPinned: false,
          isArchived: false,
          metadataJson: null,
        },
      }),
    });
  });

  await page.route("**/api/workspace/room/apply", async (route) => {
    state.alphaVariant = "applied";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        view: clone(fixtures.alphaApplied),
      }),
    });
  });

  await page.route("**/api/workspace/room/sessions", async (route) => {
    const body = route.request().postDataJSON();
    if (body?.action === "activate" && body?.sessionId === "session_alpha_2") {
      state.alphaVariant = "session_two";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          view: clone(fixtures.alphaSessionTwo),
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        view: clone(getAlphaView()),
      }),
    });
  });

  await page.route("**/api/workspace/operate*", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          mode: "summary",
          runId: "operate_run_1",
          documentKey: "doc_dropoff",
          lastRunAt: "2026-04-10T11:45:00.000Z",
          available: true,
          includedSourceCount: 1,
          includesAssembly: false,
          hasRun: true,
          result: fixtures.operateSummary,
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        mode: "summary",
        runId: "operate_run_1",
        documentKey: "doc_dropoff",
        lastRunAt: "2026-04-10T11:45:00.000Z",
        available: true,
        includedSourceCount: 1,
        includesAssembly: false,
        hasRun: true,
        result: fixtures.operateSummary,
      }),
    });
  });

  await page.route("**/api/workspace/room*", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/turn") || url.pathname.endsWith("/apply") || url.pathname.endsWith("/sessions")) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        view: clone(buildRoomResponse(url)),
      }),
    });
  });

  await page.goto("/workspace", { waitUntil: "domcontentloaded" });

  const disclaimerGate = page.getByTestId("workspace-disclaimer-gate");
  if (await disclaimerGate.isVisible().catch(() => false)) {
    await page.getByTestId("workspace-disclaimer-input").fill("understand");
    await page.getByTestId("workspace-disclaimer-submit").click();
  }

  await expect(page.getByTestId("room-workspace")).toBeVisible();
  await openCreateBox(page);
  await page.getByTestId("room-create-box-name").fill("Fix drop-off");
  await page.getByTestId("room-create-box-submit").click();
  await expect(page.getByTestId("room-active-preview")).toBeVisible();

  return { fixtures, state };
}

test("room closeout keeps preview non-canonical and adjacent lanes honest", async ({
  page,
  context,
  baseURL,
}) => {
  await bootstrapRoom(page, context, baseURL);

  await expect(page.getByTestId("room-field-chip")).toContainText("Awaiting");
  await expect(page.getByTestId("room-active-preview")).toContainText("Canon unchanged");
  await expect(page.getByTestId("room-mirror-aim")).toContainText(
    "Fix drop-off: users abandon, trigger unknown.",
  );

  await page.getByTestId("room-apply-preview").click();
  await expect(page.getByTestId("room-active-preview")).toBeHidden();
  await expect(page.getByTestId("room-mirror-aim")).toContainText(
    "Locate the exact abandonment step.",
  );
  await expect(page.getByTestId("room-field-chip")).toContainText("Awaiting");

  await page.getByTestId("room-open-context").click();
  await page.getByTestId("room-session-session_alpha_2").click();
  await expect(page.getByText("Compare two onboarding traces.")).toBeVisible();
  await expect(page.getByTestId("room-mirror-aim")).toContainText(
    "Locate the exact abandonment step.",
  );

  await page.getByTestId("room-mirror-witness-doc_dropoff").click();
  await expect(page.getByTestId("room-focused-witness")).toBeVisible();
  await expect(page.getByTestId("room-focused-witness")).toContainText("Drop-off dashboard");
  await expect(page.getByTestId("room-focused-witness-block")).toContainText(
    "Users cluster in onboarding and leave before the final step.",
  );
  await page.getByTestId("room-close-witness").click();
  await expect(page.getByTestId("room-focused-witness")).toBeHidden();

  await page.getByTestId("room-open-context").click();
  await page.getByTestId("room-open-operate").click();
  await expect(page.getByTestId("room-operate-panel")).toBeVisible();
  await expect(page.getByTestId("room-operate-next-move")).toContainText(
    "Compare the two onboarding sessions.",
  );
  await page.getByTestId("room-run-operate").click();
  await expect(page.getByTestId("room-mirror-aim")).toContainText(
    "Locate the exact abandonment step.",
  );
  await page.getByTestId("room-ask-seven-operate-audit").click();
  await expect(page.getByTestId("room-composer-input")).toHaveValue(/Audit this Operate read/i);

  await page.getByTestId("room-open-context").click();
  await page.getByTestId("room-project-box_beta").click();
  await expect(page.getByTestId("room-starter")).toBeVisible();
  await expect(page.getByTestId("room-field-chip")).toBeHidden();
  await expect(page.getByTestId("room-active-preview")).toBeHidden();
  await expect(page.getByText("Compare two onboarding traces.")).toBeHidden();
});

test.describe("mobile", () => {
  test.use({
    viewport: {
      width: 390,
      height: 844,
    },
  });

  test("mobile room keeps witness and operate in one cognitive lane", async ({
    page,
    context,
    baseURL,
  }) => {
    await bootstrapRoom(page, context, baseURL);

    await expect(page.getByTestId("room-active-preview")).toBeVisible();
    await page.getByTestId("room-mirror-witness-doc_dropoff").click();
    await expect(page.getByTestId("room-focused-witness")).toBeVisible();
    await page.getByTestId("room-close-witness").click();
    await expect(page.getByTestId("room-focused-witness")).toBeHidden();

    await page.getByTestId("room-open-context").click();
    await page.getByTestId("room-open-operate").click();
    await expect(page.getByTestId("room-operate-panel")).toBeVisible();
    await expect(page.getByTestId("room-run-operate")).toBeVisible();
  });
});
