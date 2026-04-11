function buildResponsesPayload(roomTurn) {
  return {
    output: [
      {
        content: [
          {
            type: "output_text",
            text: JSON.stringify(roomTurn),
          },
        ],
      },
    ],
  };
}

function buildBaseState({
  projectKey = "box_onboarding_loop",
  title = "Onboarding drop-off",
  subtitle = "Permissions failure investigation",
  roomSource = "GND box @room_box_onboarding_loop",
} = {}) {
  return {
    project: {
      projectKey,
      title,
      subtitle,
    },
    session: {
      id: "session_alpha_1",
      title: "Conversation One",
      handoffSummary: "",
      threadDocumentKey: "thread_session_alpha_1",
      isActive: true,
      isArchived: false,
    },
    sessions: [
      {
        id: "session_alpha_1",
        title: "Conversation One",
        handoffSummary: "",
        threadDocumentKey: "thread_session_alpha_1",
        isActive: true,
        isArchived: false,
        messageCount: 0,
        updatedAt: "2026-04-11T00:00:00.000Z",
      },
      {
        id: "session_alpha_2",
        title: "Conversation Two",
        handoffSummary: "Re-enter and inspect the current truth.",
        threadDocumentKey: "thread_session_alpha_2",
        isActive: false,
        isArchived: false,
        messageCount: 0,
        updatedAt: "2026-04-11T00:05:00.000Z",
      },
    ],
    roomDocument: {
      documentKey: `room_${projectKey}`,
      title: `${title} Room`,
    },
    roomSource,
    runtimeWindow: null,
    recentSources: [
      {
        id: "source_1",
        documentKey: "doc_dropoff_dashboard",
        title: "Drop-off dashboard",
        metaLine: "Live product witness",
        operateSummary: "Dashboard export",
      },
      {
        id: "source_2",
        documentKey: "doc_trace",
        title: "Session trace",
        metaLine: "Observed replay",
        operateSummary: "Trace export",
      },
    ],
    receiptDrafts: [],
    latestReceiptKit: null,
    messages: [],
    focusedWitness: null,
    adjacent: { operate: null },
  };
}

export const END_TO_END_APP_JOURNEY = {
  id: "end_to_end_app_journey",
  description:
    "Compares Loegos, plain chat, and schema-only handling across aspiration, plan, return, contradiction, closure attempt, and fresh-session handoff.",
  initialState: buildBaseState(),
  steps: [
    {
      id: "aspiration",
      type: "turn",
      sessionId: "session_alpha_1",
      userMessage: "I want to develop an app.",
      rawModelPayload: buildResponsesPayload({
        assistantText: "What app, for whom, right now?",
        turnMode: "conversation",
        segments: [],
        receiptKit: null,
      }),
    },
    {
      id: "observation",
      type: "turn",
      sessionId: "session_alpha_1",
      userMessage: "We observed beta users fail after permissions.",
      rawModelPayload: buildResponsesPayload({
        assistantText:
          "Name the exact drop-off step. Pull one beta trace. A concrete drop-off step appears.",
        turnMode: "proposal",
        segments: [
          {
            id: "segment-observation-1",
            text: "Name the exact drop-off step.",
            domain: "aim",
            mirrorRegion: "aim",
            suggestedClause: 'DIR aim "Name the exact drop-off step."',
            intent: "declare",
          },
          {
            id: "segment-observation-2",
            text: "Pull one beta trace.",
            domain: "move",
            mirrorRegion: "moves",
            suggestedClause: 'MOV move "Pull one beta trace." via manual',
            intent: "move",
          },
          {
            id: "segment-observation-3",
            text: "A concrete drop-off step appears.",
            domain: "test",
            mirrorRegion: "moves",
            suggestedClause: 'TST test "A concrete drop-off step appears."',
            intent: "test",
          },
        ],
        receiptKit: null,
      }),
    },
    {
      id: "apply_observation",
      type: "apply",
      sessionId: "session_alpha_1",
    },
    {
      id: "report_return",
      type: "turn",
      sessionId: "session_alpha_1",
      userMessage: "The trace shows a drop at permissions.",
      rawModelPayload: buildResponsesPayload({
        assistantText: "The trace shows a drop at permissions.",
        turnMode: "proposal",
        segments: [
          {
            id: "segment-return-1",
            text: "The trace shows a drop at permissions.",
            domain: "return",
            mirrorRegion: "returns",
            suggestedClause: 'RTN observe "The trace shows a drop at permissions." via user as text',
            intent: "observe",
          },
        ],
        receiptKit: null,
      }),
    },
    {
      id: "apply_return",
      type: "apply",
      sessionId: "session_alpha_1",
    },
    {
      id: "contradiction",
      type: "turn",
      sessionId: "session_alpha_1",
      userMessage: "A second trace showed permissions were not the real blocker.",
      rawModelPayload: buildResponsesPayload({
        assistantText: "A second trace contradicted the permissions hypothesis.",
        turnMode: "proposal",
        segments: [
          {
            id: "segment-contradiction-1",
            text: "A second trace contradicted the permissions hypothesis.",
            domain: "return",
            mirrorRegion: "returns",
            suggestedClause:
              'RTN contradict "Permissions were not the real blocker." via user as text',
            intent: "observe",
          },
        ],
        receiptKit: null,
      }),
    },
    {
      id: "apply_contradiction",
      type: "apply",
      sessionId: "session_alpha_1",
    },
    {
      id: "seal_attempt",
      type: "turn",
      sessionId: "session_alpha_1",
      userMessage: "Seal this now.",
      rawModelPayload: buildResponsesPayload({
        assistantText: "Seal the loop now.",
        turnMode: "proposal",
        segments: [
          {
            id: "segment-seal-1",
            text: "Seal the loop now.",
            domain: "field",
            mirrorRegion: "returns",
            suggestedClause: 'CLS seal "Permissions blocker resolved."',
            intent: "clarify",
          },
        ],
        receiptKit: null,
      }),
    },
    {
      id: "apply_seal_attempt",
      type: "apply",
      sessionId: "session_alpha_1",
    },
    {
      id: "session_two_check",
      type: "turn",
      sessionId: "session_alpha_2",
      userMessage: "What is the current aim?",
      rawModelPayload: buildResponsesPayload({
        assistantText: "The aim stayed stable. What still needs resolution?",
        turnMode: "conversation",
        segments: [],
        receiptKit: null,
      }),
    },
  ],
};
