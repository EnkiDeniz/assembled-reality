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
  projectKey = "box_alpha",
  title = "Fix drop-off",
  subtitle = "Beta onboarding failure",
  sessionId = "session_alpha_1",
  sessionTitle = "Conversation One",
  handoffSummary = "",
  threadDocumentKey = "",
  roomSource = "GND box @room_box_alpha",
  recentSources = [],
  messages = [],
  sessions = null,
  runtimeWindow = null,
  focusedWitness = null,
  adjacent = { operate: null },
} = {}) {
  const session = {
    id: sessionId,
    title: sessionTitle,
    handoffSummary,
    threadDocumentKey: threadDocumentKey || `thread_${sessionId}`,
    isActive: true,
    isArchived: false,
  };

  return {
    project: {
      projectKey,
      title,
      subtitle,
    },
    session,
    sessions:
      sessions ||
      [
        {
          ...session,
          messageCount: Array.isArray(messages) ? messages.length : 0,
          updatedAt: "2026-04-11T00:00:00.000Z",
        },
      ],
    roomDocument: {
      documentKey: `room_${projectKey}`,
      title: `${title} Room`,
    },
    roomSource,
    runtimeWindow,
    recentSources,
    receiptDrafts: [],
    latestReceiptKit: null,
    messages,
    focusedWitness,
    adjacent,
  };
}

function buildStoredUserMessage({ id, content }) {
  return {
    id,
    role: "user",
    content,
    citations: [],
    roomPayload: null,
  };
}

function buildStoredAssistantProposalMessage({
  id,
  content,
  proposalId,
  segments,
  nextBestAction = "Apply the preview if it still fits.",
}) {
  return {
    id,
    role: "assistant",
    content,
    citations: [],
    roomPayload: {
      assistantText: content,
      turnMode: "proposal",
      proposalId,
      segments,
      receiptKit: null,
      gatePreview: {
        accepted: true,
        nextBestAction,
      },
    },
  };
}

const CONCRETE_PROBLEM_TURN = {
  userMessage: "We observed beta users fail after permissions.",
  rawModelPayload: buildResponsesPayload({
    assistantText:
      "Name the exact drop-off step. Pull one beta trace. A concrete drop-off step appears.",
    turnMode: "proposal",
    segments: [
      {
        text: "Name the exact drop-off step.",
        domain: "aim",
        mirrorRegion: "aim",
        suggestedClause: 'DIR aim "Name the exact drop-off step."',
        intent: "declare",
      },
      {
        text: "Pull one beta trace.",
        domain: "move",
        mirrorRegion: "moves",
        suggestedClause: 'MOV move "Pull one beta trace." via manual',
        intent: "move",
      },
      {
        text: "A concrete drop-off step appears.",
        domain: "test",
        mirrorRegion: "moves",
        suggestedClause: 'TST test "A concrete drop-off step appears."',
        intent: "test",
      },
    ],
    receiptKit: null,
  }),
};

export const ROOM_JOURNEY_FIXTURES = {
  empty_box_aspiration: {
    id: "empty_box_aspiration",
    description: "Aspiration alone should remain conversational and non-canonical.",
    initialState: buildBaseState({
      projectKey: "box_app_idea",
      title: "New app idea",
      subtitle: "",
      sessionId: "session_app_idea_1",
      roomSource: "GND box @room_box_app_idea",
      recentSources: [],
    }),
    turn: {
      userMessage: "I want to develop an app.",
      rawModelPayload: buildResponsesPayload({
        assistantText: "What app, for whom, right now?",
        turnMode: "conversation",
        segments: [],
        receiptKit: null,
      }),
    },
  },
  concrete_problem_emerges: {
    id: "concrete_problem_emerges",
    description: "Concrete witness can produce a lawful preview without mutating canon.",
    initialState: buildBaseState({
      recentSources: [
        {
          id: "source_1",
          documentKey: "doc_dropoff",
          title: "Drop-off dashboard",
          metaLine: "Live product witness",
          operateSummary: "Dashboard export",
        },
      ],
    }),
    turn: CONCRETE_PROBLEM_TURN,
  },
  invalid_ping_rejected: {
    id: "invalid_ping_rejected",
    description: "A move without a matching test should block before canon changes.",
    initialState: buildBaseState({
      roomSource: 'GND box @room_box_alpha\nDIR aim "Locate the exact drop-off step."\n',
      recentSources: [
        {
          id: "source_1",
          documentKey: "doc_dropoff",
          title: "Drop-off dashboard",
          metaLine: "Live product witness",
          operateSummary: "Dashboard export",
        },
      ],
    }),
    turn: {
      userMessage: "Give me one concrete move for this box.",
      rawModelPayload: buildResponsesPayload({
        assistantText: "Pull one beta trace.",
        turnMode: "proposal",
        segments: [
          {
            text: "Pull one beta trace.",
            domain: "move",
            mirrorRegion: "moves",
            suggestedClause: 'MOV move "Pull one beta trace." via manual',
            intent: "move",
          },
        ],
        receiptKit: null,
      }),
    },
  },
  preview_then_apply: {
    id: "preview_then_apply",
    description: "A lawful preview should mutate canon only after explicit apply.",
    initialState: buildBaseState({
      recentSources: [
        {
          id: "source_1",
          documentKey: "doc_dropoff",
          title: "Drop-off dashboard",
          metaLine: "Live product witness",
          operateSummary: "Dashboard export",
        },
      ],
    }),
    turn: CONCRETE_PROBLEM_TURN,
    applyPreview: true,
  },
  report_return: {
    id: "report_return",
    description: "A return-bearing report should change runtime and canon only through apply.",
    initialState: buildBaseState({
      roomSource: [
        "GND box @room_box_alpha",
        'DIR aim "Locate the exact drop-off step."',
        'MOV move "Pull one beta trace." via manual',
        'TST test "A concrete drop-off step appears."',
      ].join("\n"),
      recentSources: [
        {
          id: "source_1",
          documentKey: "doc_trace",
          title: "Beta session trace",
          metaLine: "Observed session replay",
          operateSummary: "Trace export",
        },
      ],
    }),
    turn: {
      userMessage: "The trace shows a drop at permissions.",
      rawModelPayload: buildResponsesPayload({
        assistantText: "The trace shows a drop at permissions.",
        turnMode: "proposal",
        segments: [
          {
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
    applyPreview: true,
  },
  same_box_new_conversation: {
    id: "same_box_new_conversation",
    description: "A second conversation changes continuity, not canonical box truth.",
    initialState: buildBaseState({
      roomSource: [
        "GND box @room_box_alpha",
        'DIR aim "Locate the exact drop-off step."',
        'MOV move "Pull one beta trace." via manual',
        'TST test "A concrete drop-off step appears."',
      ].join("\n"),
      sessionId: "session_alpha_2",
      sessionTitle: "Conversation Two",
      handoffSummary: "Compare onboarding traces next.",
      sessions: [
        {
          id: "session_alpha_1",
          title: "Conversation One",
          handoffSummary: "Need the exact drop-off step.",
          threadDocumentKey: "thread_session_alpha_1",
          isActive: false,
          isArchived: false,
          messageCount: 2,
          updatedAt: "2026-04-11T00:00:00.000Z",
        },
        {
          id: "session_alpha_2",
          title: "Conversation Two",
          handoffSummary: "Compare onboarding traces next.",
          threadDocumentKey: "thread_session_alpha_2",
          isActive: true,
          isArchived: false,
          messageCount: 0,
          updatedAt: "2026-04-11T00:01:00.000Z",
        },
      ],
      recentSources: [
        {
          id: "source_1",
          documentKey: "doc_dropoff",
          title: "Drop-off dashboard",
          metaLine: "Live product witness",
          operateSummary: "Dashboard export",
        },
      ],
    }),
    turn: {
      userMessage: "What is the current aim?",
      rawModelPayload: buildResponsesPayload({
        assistantText: "The aim stayed stable. What feels unresolved?",
        turnMode: "conversation",
        segments: [],
        receiptKit: null,
      }),
    },
  },
  handoff_affects_prompt_not_canon: {
    id: "handoff_affects_prompt_not_canon",
    description: "Session handoff should shape prompt context without mutating box canon.",
    initialState: buildBaseState({
      roomSource: [
        "GND box @room_box_alpha",
        'DIR aim "Locate the exact drop-off step."',
      ].join("\n"),
      sessionId: "session_alpha_handoff",
      sessionTitle: "Conversation Handoff",
      handoffSummary: "Review permissions traces before proposing fixes.",
      recentSources: [
        {
          id: "source_1",
          documentKey: "doc_trace",
          title: "Permissions trace",
          metaLine: "Observed session replay",
          operateSummary: "Trace export",
        },
      ],
    }),
    turn: {
      userMessage: "What should we focus on next?",
      rawModelPayload: buildResponsesPayload({
        assistantText: "Start with the permissions trace.",
        turnMode: "conversation",
        segments: [],
        receiptKit: null,
      }),
    },
  },
  contradicting_return_blocks_seal: {
    id: "contradicting_return_blocks_seal",
    description: "A contradiction on the active path must be mediated before a seal can become canonical.",
    initialState: buildBaseState({
      projectKey: "box_deck_review",
      title: "Deck review",
      subtitle: "Pipeline claim disputed",
      roomSource: [
        'DIR aim "Confirm the deck matches current state."',
        'GND witness @pitch_deck from "pitch_deck_v3.pdf" with hash_a83f19',
        'MOV move "Send the deck to Melih." via manual',
        'TST test "Melih confirms the numbers are accurate."',
        'RTN contradict "Slide seven overstates pipeline." via third_party as text',
      ].join("\n"),
      recentSources: [
        {
          id: "source_1",
          documentKey: "doc_pitch_deck",
          title: "Pitch deck v3",
          metaLine: "Current deck draft",
          operateSummary: "Document witness",
        },
      ],
    }),
    turn: {
      userMessage: "Turn this into a lawful proposal to seal now.",
      rawModelPayload: buildResponsesPayload({
        assistantText: "Seal the deck now.",
        turnMode: "proposal",
        segments: [
          {
            id: "segment-seal-1",
            text: "Seal the deck now.",
            domain: "field",
            mirrorRegion: "returns",
            suggestedClause: 'CLS seal "Deck is ready."',
            intent: "clarify",
          },
        ],
        receiptKit: null,
      }),
    },
  },
  proposal_superseded_by_later_turn: {
    id: "proposal_superseded_by_later_turn",
    description: "A later accepted preview should supersede an earlier accepted preview without mutating canon.",
    initialState: buildBaseState({
      roomSource: "GND box @room_box_alpha",
      messages: [
        buildStoredUserMessage({
          id: "prior-user-1",
          content: "We observed beta users fail on onboarding.",
        }),
        buildStoredAssistantProposalMessage({
          id: "prior-assistant-1",
          content: "Name the failing step. Pull one session replay. The failing step becomes visible.",
          proposalId: "proposal_prior_1",
          segments: [
            {
              id: "prior-segment-1",
              text: "Name the failing step.",
              domain: "aim",
              mirrorRegion: "aim",
              suggestedClause: 'DIR aim "Name the failing step."',
            },
            {
              id: "prior-segment-2",
              text: "Pull one session replay.",
              domain: "move",
              mirrorRegion: "moves",
              suggestedClause: 'MOV move "Pull one session replay." via manual',
            },
            {
              id: "prior-segment-3",
              text: "The failing step becomes visible.",
              domain: "test",
              mirrorRegion: "moves",
              suggestedClause: 'TST test "The failing step becomes visible."',
            },
          ],
        }),
      ],
      recentSources: [
        {
          id: "source_1",
          documentKey: "doc_dropoff",
          title: "Drop-off dashboard",
          metaLine: "Live product witness",
          operateSummary: "Dashboard export",
        },
      ],
    }),
    turn: {
      userMessage: "We observed beta users fail after permissions.",
      rawModelPayload: buildResponsesPayload({
        assistantText:
          "Name the exact drop-off step. Pull one beta trace. A concrete drop-off step appears.",
        turnMode: "proposal",
        segments: [
          {
            id: "segment-current-1",
            text: "Name the exact drop-off step.",
            domain: "aim",
            mirrorRegion: "aim",
            suggestedClause: 'DIR aim "Name the exact drop-off step."',
            intent: "declare",
          },
          {
            id: "segment-current-2",
            text: "Pull one beta trace.",
            domain: "move",
            mirrorRegion: "moves",
            suggestedClause: 'MOV move "Pull one beta trace." via manual',
            intent: "move",
          },
          {
            id: "segment-current-3",
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
  },
  authority_context_consistency: {
    id: "authority_context_consistency",
    description: "Authority context should stay internally consistent with canon, runtime, and adjacent state.",
    initialState: buildBaseState({
      roomSource: "GND box @room_box_alpha",
      recentSources: [
        {
          id: "source_1",
          documentKey: "doc_dropoff",
          title: "Drop-off dashboard",
          metaLine: "Live product witness",
          operateSummary: "Dashboard export",
        },
      ],
      focusedWitness: {
        documentKey: "doc_dropoff",
        title: "Drop-off dashboard",
        sourceSummary: "Live product witness",
        provenanceLabel: "Dashboard export",
        excerptBlocks: [
          {
            id: "excerpt-1",
            kind: "paragraph",
            text: "The dashboard shows a permissions drop-off.",
          },
        ],
        openHref: "/workspace?project=box_alpha&sessionId=session_alpha_1&document=doc_dropoff&adjacent=witness",
      },
      adjacent: {
        operate: {
          available: true,
          hasRun: true,
          lastRunAt: "2026-04-11T00:00:00.000Z",
          nextMove: "Pull one beta trace.",
          includedSourceCount: 1,
          documentKey: "doc_dropoff",
          openHref: "/workspace?project=box_alpha&sessionId=session_alpha_1&adjacent=operate",
        },
      },
    }),
    turn: CONCRETE_PROBLEM_TURN,
    applyPreview: true,
  },
  preview_reload_without_apply: {
    id: "preview_reload_without_apply",
    description: "Preview should survive reload as preview/session truth without leaking into canon.",
    initialState: buildBaseState({
      recentSources: [
        {
          id: "source_1",
          documentKey: "doc_dropoff",
          title: "Drop-off dashboard",
          metaLine: "Live product witness",
          operateSummary: "Dashboard export",
        },
      ],
    }),
    turn: CONCRETE_PROBLEM_TURN,
    reloadAfterTurn: true,
  },
};
