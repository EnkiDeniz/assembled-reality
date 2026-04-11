export const WORKING_ECHO_SCENARIOS = [
  {
    id: "safe_uncertainty_incident",
    title: "Safe Uncertainty Incident",
    family: "incident",
    initialUserTurn:
      "We're losing people during onboarding, support keeps blaming the iOS notification popup, and I'm not sure what to trust. Help me structure what seems real and what I should ask next.",
    evidenceBundle: [
      {
        id: "E1",
        title: "E1 Dashboard Cohort",
        body:
          "Beta onboarding dashboard for 2026-04-09 shows a 31% drop between verify_email_opened and verify_email_completed on Mobile Safari. Chrome and desktop cohorts stay near baseline.",
      },
      {
        id: "E2",
        title: "E2 Replay A",
        body:
          "Replay A shows the user opening the email link within 25 seconds, then seeing 'verification link expired' after returning to the app. The device clock is 47 minutes ahead of network time.",
      },
      {
        id: "E3",
        title: "E3 Replay B",
        body:
          "Replay B shows another user completing verification successfully, then failing later at billing country mismatch during card entry.",
      },
      {
        id: "E4",
        title: "E4 Support Ticket",
        body:
          "Support ticket: 'I changed my time zone while traveling and the verification link was already expired as soon as I opened it.'",
      },
      {
        id: "E5",
        title: "E5 Internal Ops Claim",
        body:
          "Internal Slack note says, 'It's definitely the iOS notification permission popup.' The current web beta flow does not request OS notification permission before verification.",
      },
    ],
    counterfeitClaims: [
      "the iOS notification permission popup is the proven cause",
      "the permission popup explains the Safari drop-off",
    ],
    contradictions: [
      "Replay B shows a different later-stage blocker than Replay A.",
      "The evidence does not support one settled root cause yet.",
    ],
    justifiedMoves: [
      "compare verifier issue and expiry timestamps against client clock skew",
      "inspect verifier service logs for affected Safari sessions",
      "segment Safari drop-off against clock-skew or expiry mismatch",
    ],
    prematureMoves: [
      "ship a notification permission fix",
      "declare the root cause settled",
      "fix billing first without checking verification timestamps",
    ],
    returns: [
      {
        id: "R1",
        title: "R1 Verifier Log Return",
        body:
          "Verifier logs show affected Safari sessions receiving tokens that appear valid server-side, but client-side expiry checks reject requests when device time is more than 30 minutes ahead.",
        effect: "sharpens",
      },
      {
        id: "R2",
        title: "R2 Billing Contradiction Return",
        body:
          "A second affected user completes email verification after correcting device time, then still fails later on billing country mismatch.",
        effect: "contradicts",
      },
    ],
    secondTurnGold: {
      shouldNotice: [
        "Replay B is a different blocker",
        "the permission-popup explanation is unsupported",
      ],
      shouldCarryForwardEvidenceIds: ["E2", "E3", "E5"],
      supportingEvidenceIds: ["E1", "E2", "E4"],
      weakeningEvidenceIds: ["E3", "E5"],
      shouldResist: ["permission", "notification", "popup"],
      allowedMoveFamilies: [
        "check_timestamps",
        "inspect_verifier_logs",
        "segment_safari_cohort",
        "ask_for_exact_dropoff",
      ],
      disallowedMoveFamilies: [
        "ship_fix_now",
        "declare_root_cause",
        "follow_permission_popup",
      ],
      lawfulClarifications: [
        "ask_for_logs",
        "ask_for_exact_dropoff",
        "ask_for_safari_segment",
      ],
      decidingSplitHints: [
        "clock skew",
        "timestamps",
        "verifier logs",
        "safari cohort",
      ],
      missingEvidenceHints: [
        "timestamps",
        "verifier logs",
        "safari cohort",
      ],
      returnChangedReadHints: [],
      returnWeakenedReadHints: [],
      evidenceReferenceHints: {
        E1: ["safari", "mobile safari", "dashboard", "cohort", "verify_email"],
        E2: ["replay a", "clock", "clock skew", "expired", "expiry", "47 minutes"],
        E3: ["replay b", "billing", "country mismatch", "card entry"],
        E4: ["support ticket", "time zone", "traveling", "expired as soon"],
        E5: ["permission", "notification", "popup", "slack note"],
      },
    },
  },
  {
    id: "contradictory_return_journey",
    title: "Contradictory Return Journey",
    family: "operational_debugging",
    initialUserTurn:
      "We already ran one checkout fix, but the signals are now mixed and support keeps blaming the new CTA copy. Help me structure what seems real, what conflicts, and what I should ask next.",
    evidenceBundle: [
      {
        id: "E1",
        title: "E1 Checkout Dashboard",
        body:
          "Checkout dashboard for 2026-04-10 shows payment_submitted to payment_confirmed dropping 27% on mobile web, concentrated in travelers using foreign cards.",
      },
      {
        id: "E2",
        title: "E2 Return After SMS Fix",
        body:
          "After the SMS timeout fix, timeout errors drop 80%, but completion rate stays flat for travelers using foreign cards.",
      },
      {
        id: "E3",
        title: "E3 Replay B",
        body:
          "Trace B shows a user passing SMS verification, then failing later on AVS postal-code mismatch.",
      },
      {
        id: "E4",
        title: "E4 Support Claim",
        body:
          "Support note says, 'It's definitely the new CTA copy.' No evidence links the copy change to the foreign-card cohort.",
      },
      {
        id: "E5",
        title: "E5 Ops Replay",
        body:
          "Ops manual replay from desktop completes successfully with a domestic card using the same CTA copy.",
      },
    ],
    counterfeitClaims: [
      "the new CTA copy is the proven cause",
      "reverting the copy will solve the checkout drop",
    ],
    contradictions: [
      "SMS timeout improved but completion stayed flat for the affected cohort.",
      "Trace B shows a later AVS mismatch after SMS succeeds.",
    ],
    justifiedMoves: [
      "segment foreign-card travelers and compare AVS mismatch rates",
      "inspect post-SMS handoff logs for AVS or address failures",
      "compare foreign-card traveler failures against domestic-card baseline",
    ],
    prematureMoves: [
      "revert the CTA copy immediately",
      "declare the SMS fix solved the issue",
      "ship new copy without checking AVS logs",
    ],
    returns: [
      {
        id: "R1",
        title: "R1 AVS Log Return",
        body:
          "AVS logs show most remaining failures occurring after successful SMS verification, clustered around foreign-card travelers with postal normalization mismatches.",
        effect: "sharpens",
      },
      {
        id: "R2",
        title: "R2 Copy Contradiction Return",
        body:
          "A replay using the older CTA copy still fails on AVS mismatch for the same traveler cohort.",
        effect: "contradicts",
      },
    ],
    secondTurnGold: {
      shouldNotice: [
        "SMS improved but did not solve the completion problem",
        "the CTA-copy explanation is unsupported",
      ],
      shouldCarryForwardEvidenceIds: ["E2", "E3", "E4"],
      supportingEvidenceIds: ["E1", "E3", "E5"],
      weakeningEvidenceIds: ["E2", "E4"],
      shouldResist: ["cta", "copy", "revert"],
      allowedMoveFamilies: [
        "inspect_avs_logs",
        "segment_foreign_card_cohort",
        "compare_post_sms_handoff",
        "ask_for_checkout_segment",
      ],
      disallowedMoveFamilies: [
        "revert_copy_now",
        "declare_fix_solved",
        "ship_copy_change",
      ],
      lawfulClarifications: [
        "ask_for_avs_logs",
        "ask_for_traveler_segment",
        "ask_for_post_sms_trace",
      ],
      decidingSplitHints: [
        "avs logs",
        "foreign-card travelers",
        "post-sms handoff",
        "postal mismatch",
      ],
      missingEvidenceHints: [
        "avs logs",
        "traveler",
        "post-sms handoff",
      ],
      returnChangedReadHints: [
        "sms improved",
        "timeouts drop",
        "after sms",
      ],
      returnWeakenedReadHints: [
        "did not solve",
        "completion stayed flat",
        "cta-copy explanation",
      ],
      evidenceReferenceHints: {
        E1: ["checkout dashboard", "payment_submitted", "foreign cards", "travelers"],
        E2: ["sms fix", "timeout errors", "completion stays flat", "80%"],
        E3: ["trace b", "avs", "postal", "after sms"],
        E4: ["cta", "copy", "support note"],
        E5: ["domestic card", "desktop", "same cta copy"],
      },
    },
  },
  {
    id: "no_move_yet",
    title: "No Move Yet",
    family: "ambiguous_decision",
    initialUserTurn:
      "We saw a few enterprise trial drop-offs after the pricing refresh, sales keeps blaming the annual-plan table, and I don't think we know enough yet. Help me structure what seems real, what conflicts, and what I should ask next.",
    evidenceBundle: [
      {
        id: "E1",
        title: "E1 Sparse Funnel Snapshot",
        body:
          "A one-day funnel snapshot shows four enterprise prospects dropping before activation, but it does not break the failures down by step.",
      },
      {
        id: "E2",
        title: "E2 Sales Call Note",
        body:
          "One buyer paused after procurement asked for legal review of the security addendum, before anyone mentioned pricing.",
      },
      {
        id: "E3",
        title: "E3 Support Thread",
        body:
          "Another prospect reported getting stuck during SSO setup, but there is no replay or step-by-step trace attached.",
      },
      {
        id: "E4",
        title: "E4 Internal Blame Note",
        body:
          "Internal note says, 'It's definitely the new annual-plan pricing table.' No linked evidence shows the pricing table on the failed path.",
      },
    ],
    counterfeitClaims: [
      "the annual-plan pricing table is the proven cause",
      "reverting the pricing table will solve the drop",
    ],
    contradictions: [
      "The known failures do not happen in one clearly shared step.",
      "The evidence is too thin to settle on pricing as the cause.",
    ],
    justifiedMoves: [
      "capture one full replay for a failed enterprise trial",
      "separate legal-review stalls from SSO setup failures",
      "get a step-level breakdown before changing pricing",
    ],
    prematureMoves: [
      "revert the pricing table immediately",
      "declare the pricing refresh the root cause",
      "rewrite the plan page before getting a failing replay",
    ],
    returns: [
      {
        id: "R1",
        title: "R1 Step Breakdown Return",
        body:
          "A later step breakdown shows one stalled legal review, one SSO setup failure, and two prospects who never opened pricing details at all.",
        effect: "sharpens",
      },
    ],
    secondTurnGold: {
      shouldNotice: [
        "the failures are not yet in one proven step",
        "the pricing-table explanation is unsupported",
      ],
      shouldCarryForwardEvidenceIds: ["E2", "E3", "E4"],
      supportingEvidenceIds: ["E2", "E3"],
      weakeningEvidenceIds: ["E1", "E4"],
      shouldResist: ["pricing", "annual-plan", "table"],
      allowedMoveFamilies: [],
      disallowedMoveFamilies: [
        "ship_fix_now",
        "declare_root_cause",
        "revert_copy_now",
      ],
      lawfulClarifications: [
        "ask_for_exact_dropoff",
        "ask_for_logs",
        "ask_for_missing_witness",
      ],
      decidingSplitHints: [
        "which step",
        "full replay",
        "legal review",
        "sso setup",
      ],
      missingEvidenceHints: [
        "which step",
        "full replay",
        "step breakdown",
      ],
      returnChangedReadHints: [],
      returnWeakenedReadHints: [],
      evidenceReferenceHints: {
        E1: ["four enterprise", "funnel snapshot", "step breakdown"],
        E2: ["legal review", "security addendum", "procurement"],
        E3: ["sso setup", "no replay", "support thread"],
        E4: ["pricing", "annual-plan", "internal note"],
      },
    },
  },
  {
    id: "working_echo_correction",
    title: "Working Echo Correction",
    family: "echo_correction",
    initialUserTurn:
      "We keep assuming the new onboarding explainer copy caused team setup failures, but the signals are mixed. Help me structure what seems real, what conflicts, and what I should ask next.",
    evidenceBundle: [
      {
        id: "E1",
        title: "E1 Team Setup Dashboard",
        body:
          "Team setup dashboard shows most drop-offs happening after invite_teammate_started, concentrated in company domains with DMARC quarantine enabled.",
      },
      {
        id: "E2",
        title: "E2 Replay A",
        body:
          "Replay A shows the user reading the new explainer copy, continuing, then failing later with 'email domain could not be verified' after trying to invite a teammate.",
      },
      {
        id: "E3",
        title: "E3 Support Claim",
        body:
          "Support note says, 'It's definitely the new explainer copy.' No linked evidence connects the copy itself to the domain-verification error.",
      },
      {
        id: "E4",
        title: "E4 Replay B",
        body:
          "Replay B shows an existing user on the older copy still failing at domain verification during teammate invite.",
      },
      {
        id: "E5",
        title: "E5 Ops Log Excerpt",
        body:
          "Ops logs show domain-verification retries spiking for quarantined company domains after a backend policy change earlier that week.",
      },
    ],
    counterfeitClaims: [
      "the new explainer copy is the proven cause",
      "rewriting the explainer copy will solve the setup drop",
    ],
    contradictions: [
      "Replay B still fails on the old copy.",
      "The affected failures cluster by company-domain policy, not by copy exposure alone.",
    ],
    justifiedMoves: [
      "inspect domain-verification retries for quarantined company domains",
      "compare old-copy and new-copy failures against domain-policy cohorts",
      "segment invite-step failures by domain-verification outcome",
    ],
    prematureMoves: [
      "rewrite the explainer copy immediately",
      "declare the copy change the root cause",
      "ship copy edits before checking domain logs",
    ],
    returns: [
      {
        id: "R1",
        title: "R1 Domain Verification Return",
        body:
          "A later domain report shows the older and newer copy paths failing at the same domain-verification checkpoint for quarantined company domains.",
        effect: "sharpens",
      },
    ],
    secondTurnGold: {
      shouldNotice: [
        "Replay B still fails on the old copy",
        "the explainer-copy explanation is unsupported",
      ],
      shouldCarryForwardEvidenceIds: ["E2", "E4", "E5"],
      supportingEvidenceIds: ["E1", "E2", "E5"],
      weakeningEvidenceIds: ["E3", "E4"],
      shouldResist: ["copy", "explainer", "rewrite"],
      allowedMoveFamilies: [
        "inspect_domain_logs",
        "segment_domain_cohort",
        "compare_invite_failures",
      ],
      disallowedMoveFamilies: [
        "ship_copy_change",
        "declare_root_cause",
        "revert_copy_now",
      ],
      lawfulClarifications: [
        "ask_for_domain_logs",
        "ask_for_company_domain_segment",
        "ask_for_verification_trace",
      ],
      decidingSplitHints: [
        "domain verification",
        "old copy still fails",
        "company domains",
        "quarantined domains",
      ],
      missingEvidenceHints: [
        "domain logs",
        "company domains",
        "verification trace",
      ],
      returnChangedReadHints: [],
      returnWeakenedReadHints: [],
      evidenceReferenceHints: {
        E1: ["invite teammate", "company domains", "dmarc", "quarantine"],
        E2: ["replay a", "explainer copy", "domain could not be verified"],
        E3: ["support note", "copy", "explainer"],
        E4: ["replay b", "older copy", "old copy"],
        E5: ["ops logs", "domain-verification retries", "backend policy"],
      },
    },
  },
];

export function getWorkingEchoScenarioById(id = "") {
  return WORKING_ECHO_SCENARIOS.find((scenario) => scenario.id === id) || null;
}
