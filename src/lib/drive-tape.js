export const DRIVE_TAPE_LANE_ORDER = [
  "spoken",
  "proposed",
  "surfaced echo",
  "returned",
  "canonical",
  "receipted",
];

export function normalizeDriveTapeText(value = "") {
  return String(value || "")
    .replace(/\\n/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueStrings(values = []) {
  return [
    ...new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => normalizeDriveTapeText(value))
        .filter(Boolean),
    ),
  ];
}

function classifyRef(ref = "") {
  const prefix = normalizeDriveTapeText(ref).split(":")[0].toLowerCase();
  if (["interaction", "mirror", "pending_move", "field_state"].includes(prefix)) {
    return "lawful artifact";
  }
  if (["segment", "preview", "assistant"].includes(prefix)) {
    return "bounded provisional state";
  }
  if (["source", "witness", "block", "return"].includes(prefix)) {
    return "runtime return";
  }
  return "";
}

export function classifySourceRefs(sourceRefs = [], fallback = "heuristic bridge logic") {
  const classes = uniqueStrings(
    (Array.isArray(sourceRefs) ? sourceRefs : []).map((ref) => classifyRef(ref)),
  );
  return classes.length ? classes : [fallback];
}

function buildSourceSnapshot({
  label = "",
  sourceRefs = [],
  fallback = "heuristic bridge logic",
} = {}) {
  const refs = uniqueStrings(sourceRefs);
  return {
    label: normalizeDriveTapeText(label),
    sourceRefs: refs,
    classes: classifySourceRefs(refs, fallback),
  };
}

function pushEvent(events, event = {}) {
  const text = normalizeDriveTapeText(event?.text);
  const lane = normalizeDriveTapeText(event?.lane).toLowerCase();
  if (!lane || !text) return;

  events.push({
    lane,
    authority: normalizeDriveTapeText(event?.authority) || "surface",
    text,
    sourceRefs: uniqueStrings(event?.sourceRefs),
    survivalWeight: normalizeDriveTapeText(event?.survivalWeight) || "speech",
    derivedFrom: uniqueStrings(event?.derivedFrom),
    ...(Array.isArray(event?.weakenedBy) && event.weakenedBy.length
      ? { weakenedBy: uniqueStrings(event.weakenedBy) }
      : {}),
    ...(event?.shiftedByReturn ? { shiftedByReturn: true } : {}),
  });
}

function hasSealedCue(surface = null) {
  const fieldState = normalizeDriveTapeText(surface?.fieldStateLabel).toLowerCase();
  const previewStatus = normalizeDriveTapeText(
    surface?.previewSurface?.previewStatusLabel,
  ).toLowerCase();
  return /applied|sealed|canonical/.test(`${fieldState} ${previewStatus}`);
}

function buildCanonicalWeight(surface = null) {
  return hasSealedCue(surface) ? "receipted / sealed" : "proposal-shaped";
}

function formatEvidenceText(item = null) {
  const title = normalizeDriveTapeText(item?.title);
  const detail = normalizeDriveTapeText(item?.detail);
  return [title, detail].filter(Boolean).join(" — ");
}

export function buildWorkingEchoSourceClassification(surface = null) {
  const workingEcho = surface?.workingEchoSurface;
  if (!workingEcho) return null;

  const classifyEvidenceList = (items = [], fallback = "heuristic bridge logic") =>
    (Array.isArray(items) ? items : [])
      .map((item) =>
        buildSourceSnapshot({
          label: formatEvidenceText(item),
          sourceRefs: item?.sourceRefs,
          fallback,
        }),
      )
      .filter((item) => item.label);

  const changedRead = Array.isArray(workingEcho?.returnDelta?.changedRead)
    ? workingEcho.returnDelta.changedRead
    : [];
  const weakenedRead = Array.isArray(workingEcho?.returnDelta?.weakenedRead)
    ? workingEcho.returnDelta.weakenedRead
    : [];
  const nextMoveShift = workingEcho?.returnDelta?.nextMoveShift || null;

  return {
    aim: buildSourceSnapshot({
      label: workingEcho?.aim,
      sourceRefs: workingEcho?.aimRefs,
    }),
    whatWouldDecideIt: buildSourceSnapshot({
      label: workingEcho?.whatWouldDecideIt?.text,
      sourceRefs: workingEcho?.whatWouldDecideIt?.sourceRefs,
    }),
    evidenceBuckets: {
      supports: classifyEvidenceList(workingEcho?.evidenceBuckets?.supports),
      weakens: classifyEvidenceList(workingEcho?.evidenceBuckets?.weakens),
      missing: classifyEvidenceList(workingEcho?.evidenceBuckets?.missing),
    },
    returnDelta: workingEcho?.returnDelta
      ? {
          summary: buildSourceSnapshot({
            label: workingEcho.returnDelta?.summary,
            sourceRefs: [
              ...changedRead.flatMap((item) => item?.sourceRefs || []),
              ...weakenedRead.flatMap((item) => item?.sourceRefs || []),
              ...(Array.isArray(nextMoveShift?.sourceRefs)
                ? nextMoveShift.sourceRefs
                : []),
            ],
          }),
          changedRead: changedRead.map((item) =>
            buildSourceSnapshot({
              label: item?.text,
              sourceRefs: item?.sourceRefs,
            }),
          ),
          weakenedRead: weakenedRead.map((item) =>
            buildSourceSnapshot({
              label: item?.text,
              sourceRefs: item?.sourceRefs,
            }),
          ),
          nextMoveShift: nextMoveShift
            ? buildSourceSnapshot({
                label: nextMoveShift?.text,
                sourceRefs: nextMoveShift?.sourceRefs,
              })
            : null,
        }
      : null,
  };
}

export function buildDriveTapeEvents({ surfacedState = null } = {}) {
  const surface = surfacedState || {};
  const events = [];

  pushEvent(events, {
    lane: "spoken",
    authority: "assistant_answer",
    text: surface?.assistantAnswer?.text,
    sourceRefs: ["assistant:visible_answer"],
    survivalWeight: "speech",
    derivedFrom: ["assistantAnswer.text"],
  });

  pushEvent(events, {
    lane: "proposed",
    authority: "preview_surface",
    text: surface?.previewSurface?.bannerSummary,
    sourceRefs: ["preview:banner"],
    survivalWeight: "structured speech",
    derivedFrom: ["previewSurface.bannerSummary"],
  });

  (
    Array.isArray(surface?.previewSurface?.visibleSegments)
      ? surface.previewSurface.visibleSegments
      : []
  ).forEach((segment, index) => {
    pushEvent(events, {
      lane: "proposed",
      authority: "preview_segment",
      text: [
        normalizeDriveTapeText(segment?.mirrorRegion),
        normalizeDriveTapeText(segment?.text),
      ]
        .filter(Boolean)
        .join(": "),
      sourceRefs: [`segment:preview_${index + 1}`],
      survivalWeight: "structured speech",
      derivedFrom: [`previewSurface.visibleSegments[${index}]`],
    });
  });

  pushEvent(events, {
    lane: "surfaced echo",
    authority: "working_echo",
    text: surface?.workingEchoSurface?.aim,
    sourceRefs: surface?.workingEchoSurface?.aimRefs,
    survivalWeight: "surfaced echo",
    derivedFrom: ["workingEchoSurface.aim"],
  });

  (
    Array.isArray(surface?.workingEchoSurface?.evidenceBuckets?.supports)
      ? surface.workingEchoSurface.evidenceBuckets.supports
      : []
  ).forEach((item, index) => {
    pushEvent(events, {
      lane: "surfaced echo",
      authority: "working_echo_support",
      text: formatEvidenceText(item),
      sourceRefs: item?.sourceRefs,
      survivalWeight: "surfaced echo",
      derivedFrom: [`workingEchoSurface.evidenceBuckets.supports[${index}]`],
    });
  });

  (
    Array.isArray(surface?.workingEchoSurface?.openTension)
      ? surface.workingEchoSurface.openTension
      : []
  ).forEach((item, index) => {
    pushEvent(events, {
      lane: "surfaced echo",
      authority: "working_echo_tension",
      text:
        [normalizeDriveTapeText(item?.text), normalizeDriveTapeText(item?.kind)]
          .filter(Boolean)
          .join(" [") +
        (normalizeDriveTapeText(item?.kind) ? "]" : ""),
      sourceRefs: item?.sourceRefs,
      survivalWeight: "surfaced echo",
      derivedFrom: [`workingEchoSurface.openTension[${index}]`],
    });
  });

  (
    Array.isArray(surface?.workingEchoSurface?.evidenceBuckets?.weakens)
      ? surface.workingEchoSurface.evidenceBuckets.weakens
      : []
  ).forEach((item, index) => {
    pushEvent(events, {
      lane: "surfaced echo",
      authority: "working_echo_weaken",
      text: formatEvidenceText(item),
      sourceRefs: item?.sourceRefs,
      survivalWeight: "surfaced echo",
      derivedFrom: [`workingEchoSurface.evidenceBuckets.weakens[${index}]`],
    });
  });

  (
    Array.isArray(surface?.workingEchoSurface?.evidenceBuckets?.missing)
      ? surface.workingEchoSurface.evidenceBuckets.missing
      : []
  ).forEach((item, index) => {
    pushEvent(events, {
      lane: "surfaced echo",
      authority: "working_echo_missing",
      text: formatEvidenceText(item),
      sourceRefs: item?.sourceRefs,
      survivalWeight: "surfaced echo",
      derivedFrom: [`workingEchoSurface.evidenceBuckets.missing[${index}]`],
    });
  });

  pushEvent(events, {
    lane: "surfaced echo",
    authority: "working_echo_deciding_split",
    text: surface?.workingEchoSurface?.whatWouldDecideIt?.text,
    sourceRefs: surface?.workingEchoSurface?.whatWouldDecideIt?.sourceRefs,
    survivalWeight: "surfaced echo",
    derivedFrom: ["workingEchoSurface.whatWouldDecideIt.text"],
  });

  pushEvent(events, {
    lane: "surfaced echo",
    authority: "working_echo_candidate_move",
    text: surface?.workingEchoSurface?.candidateMove?.text,
    sourceRefs: surface?.workingEchoSurface?.candidateMove?.sourceRefs,
    survivalWeight: "proposal-shaped",
    derivedFrom: ["workingEchoSurface.candidateMove.text"],
  });

  pushEvent(events, {
    lane: "surfaced echo",
    authority: "working_echo_uncertainty",
    text: surface?.workingEchoSurface?.uncertainty?.detail,
    sourceRefs: [],
    survivalWeight: "surfaced echo",
    derivedFrom: ["workingEchoSurface.uncertainty.detail"],
  });

  pushEvent(events, {
    lane: "returned",
    authority: "return_delta",
    text: surface?.workingEchoSurface?.returnDelta?.summary,
    sourceRefs: [
      ...(surface?.workingEchoSurface?.returnDelta?.changedRead || []).flatMap(
        (item) => item?.sourceRefs || [],
      ),
      ...(surface?.workingEchoSurface?.returnDelta?.weakenedRead || []).flatMap(
        (item) => item?.sourceRefs || [],
      ),
    ],
    survivalWeight: "return-bent",
    derivedFrom: ["workingEchoSurface.returnDelta.summary"],
    shiftedByReturn: true,
  });

  (
    Array.isArray(surface?.workingEchoSurface?.returnDelta?.changedRead)
      ? surface.workingEchoSurface.returnDelta.changedRead
      : []
  ).forEach((item, index) => {
    pushEvent(events, {
      lane: "returned",
      authority: "return_delta_changed_read",
      text: item?.text,
      sourceRefs: item?.sourceRefs,
      survivalWeight: "return-bent",
      derivedFrom: [`workingEchoSurface.returnDelta.changedRead[${index}]`],
      shiftedByReturn: true,
    });
  });

  (
    Array.isArray(surface?.workingEchoSurface?.returnDelta?.weakenedRead)
      ? surface.workingEchoSurface.returnDelta.weakenedRead
      : []
  ).forEach((item, index) => {
    pushEvent(events, {
      lane: "returned",
      authority: "return_delta_weakened_read",
      text: item?.text,
      sourceRefs: item?.sourceRefs,
      survivalWeight: "return-bent",
      derivedFrom: [`workingEchoSurface.returnDelta.weakenedRead[${index}]`],
      shiftedByReturn: true,
    });
  });

  pushEvent(events, {
    lane: "returned",
    authority: "return_delta_next_move_shift",
    text: surface?.workingEchoSurface?.returnDelta?.nextMoveShift?.text,
    sourceRefs: surface?.workingEchoSurface?.returnDelta?.nextMoveShift?.sourceRefs,
    survivalWeight: "return-bent",
    derivedFrom: ["workingEchoSurface.returnDelta.nextMoveShift.text"],
    shiftedByReturn: true,
  });

  pushEvent(events, {
    lane: "canonical",
    authority: "field_state",
    text: surface?.fieldStateLabel,
    sourceRefs: ["field_state:visible_label"],
    survivalWeight: buildCanonicalWeight(surface),
    derivedFrom: ["fieldStateLabel"],
  });

  pushEvent(events, {
    lane: "canonical",
    authority: "mirror_surface_aim",
    text: surface?.mirrorSurface?.aim,
    sourceRefs: ["mirror:aim"],
    survivalWeight: buildCanonicalWeight(surface),
    derivedFrom: ["mirrorSurface.aim"],
  });

  (Array.isArray(surface?.mirrorSurface?.evidence) ? surface.mirrorSurface.evidence : []).forEach(
    (item, index) => {
      pushEvent(events, {
        lane: "canonical",
        authority: "mirror_surface_evidence",
        text: formatEvidenceText(item),
        sourceRefs: ["mirror:evidence"],
        survivalWeight: buildCanonicalWeight(surface),
        derivedFrom: [`mirrorSurface.evidence[${index}]`],
      });
    },
  );

  (Array.isArray(surface?.mirrorSurface?.story) ? surface.mirrorSurface.story : []).forEach(
    (item, index) => {
      pushEvent(events, {
        lane: "canonical",
        authority: "mirror_surface_story",
        text: [
          normalizeDriveTapeText(item?.text),
          normalizeDriveTapeText(item?.detail),
        ]
          .filter(Boolean)
          .join(" — "),
        sourceRefs: ["mirror:story"],
        survivalWeight: buildCanonicalWeight(surface),
        derivedFrom: [`mirrorSurface.story[${index}]`],
      });
    },
  );

  (Array.isArray(surface?.mirrorSurface?.moves) ? surface.mirrorSurface.moves : []).forEach(
    (item, index) => {
      pushEvent(events, {
        lane: "canonical",
        authority: "mirror_surface_move",
        text: [
          normalizeDriveTapeText(item?.text),
          normalizeDriveTapeText(item?.detail),
          normalizeDriveTapeText(item?.status),
        ]
          .filter(Boolean)
          .join(" — "),
        sourceRefs: ["mirror:moves"],
        survivalWeight: buildCanonicalWeight(surface),
        derivedFrom: [`mirrorSurface.moves[${index}]`],
      });
    },
  );

  (
    Array.isArray(surface?.mirrorSurface?.returns) ? surface.mirrorSurface.returns : []
  ).forEach((item, index) => {
    pushEvent(events, {
      lane: "canonical",
      authority: "mirror_surface_return",
      text: [
        normalizeDriveTapeText(item?.label),
        normalizeDriveTapeText(item?.actual),
        normalizeDriveTapeText(item?.result),
      ]
        .filter(Boolean)
        .join(" — "),
      sourceRefs: ["mirror:returns"],
      survivalWeight: buildCanonicalWeight(surface),
      derivedFrom: [`mirrorSurface.returns[${index}]`],
    });
  });

  return events;
}

export function buildDriveTapeReplay({
  scenarioId = "",
  arm = "",
  surfacedState = null,
  secondTurnOutput = "",
  secondTurnScore = null,
} = {}) {
  const events = buildDriveTapeEvents({ surfacedState });
  const sourceClassification = buildWorkingEchoSourceClassification(surfacedState);
  const workingEcho = surfacedState?.workingEchoSurface || null;

  return {
    scenarioId: normalizeDriveTapeText(scenarioId),
    arm: normalizeDriveTapeText(arm),
    lanes: DRIVE_TAPE_LANE_ORDER.map((lane) => {
      const laneEvents = events.filter((event) => event.lane === lane);
      return {
        lane,
        available: lane !== "receipted" || laneEvents.length > 0,
        note:
          lane === "receipted" && !laneEvents.length
            ? "No receipt-backed signal is visible on this replay."
            : "",
        events: laneEvents,
      };
    }),
    sourceClassification,
    replayRead: {
      status: normalizeDriveTapeText(workingEcho?.status),
      whyStillOpen: normalizeDriveTapeText(workingEcho?.uncertainty?.detail),
      returnBendVisible: Boolean(
        normalizeDriveTapeText(workingEcho?.returnDelta?.summary) ||
          (Array.isArray(workingEcho?.returnDelta?.changedRead) &&
            workingEcho.returnDelta.changedRead.length) ||
          (Array.isArray(workingEcho?.returnDelta?.weakenedRead) &&
            workingEcho.returnDelta.weakenedRead.length),
      ),
      reAimVisible: Boolean(
        normalizeDriveTapeText(workingEcho?.returnDelta?.nextMoveShift?.text) ||
          normalizeDriveTapeText(workingEcho?.whatWouldDecideIt?.text),
      ),
      secondTurnOutput: normalizeDriveTapeText(secondTurnOutput),
      secondTurnScore: Number(secondTurnScore?.total || 0),
    },
  };
}

export function renderDriveTapeReplay(replay = null) {
  const sections = [];
  const lanes = Array.isArray(replay?.lanes) ? replay.lanes : [];

  sections.push(`Scenario: ${normalizeDriveTapeText(replay?.scenarioId) || "(unknown)"}`);
  sections.push(`Arm: ${normalizeDriveTapeText(replay?.arm) || "(unknown)"}`);

  lanes.forEach((lane) => {
    sections.push("");
    sections.push(`${lane.lane.toUpperCase()}:`);
    if (!lane.available && normalizeDriveTapeText(lane?.note)) {
      sections.push(`- ${lane.note}`);
      return;
    }
    if (!Array.isArray(lane?.events) || !lane.events.length) {
      sections.push("- none");
      return;
    }
    lane.events.forEach((event) => {
      const flags = [
        normalizeDriveTapeText(event?.survivalWeight),
        event?.shiftedByReturn ? "shifted-by-return" : "",
      ]
        .filter(Boolean)
        .join(", ");
      sections.push(`- ${event.text}${flags ? ` [${flags}]` : ""}`);
    });
  });

  if (normalizeDriveTapeText(replay?.replayRead?.whyStillOpen)) {
    sections.push("");
    sections.push(`WHY OPEN: ${replay.replayRead.whyStillOpen}`);
  }

  return sections.join("\n");
}
