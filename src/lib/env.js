function normalizeSecret(value) {
  return String(value || "").trim();
}

function getApplePrivateKey() {
  const raw = normalizeSecret(process.env.APPLE_PRIVATE_KEY);
  if (!raw) return "";

  if (raw.includes("BEGIN PRIVATE KEY")) {
    return raw.replace(/\\n/g, "\n");
  }

  try {
    return Buffer.from(raw, "base64").toString("utf8");
  } catch {
    return raw;
  }
}

function getDefaultSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function getOpenAiApiKey() {
  const env = normalizeSecret(process.env.VERCEL_ENV || "development");

  if (env === "production") {
    return normalizeSecret(process.env.OPENAI_API_KEY_PROD || process.env.OPENAI_API_KEY);
  }

  if (env === "preview") {
    return normalizeSecret(
      process.env.OPENAI_API_KEY_PREVIEW || process.env.OPENAI_API_KEY,
    );
  }

  return normalizeSecret(process.env.OPENAI_API_KEY);
}

export const appEnv = {
  siteUrl: getDefaultSiteUrl(),
  authSecret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "",
  bootstrapCode: normalizeSecret(process.env.READER_BOOTSTRAP_CODE) || "hineni",
  emailFrom:
    normalizeSecret(process.env.NEXTAUTH_EMAIL_FROM) ||
    normalizeSecret(process.env.EMAIL_FROM) ||
    "Assembled Reality <noreply@updates.getreceipts.com>",
  magicLinksEnabled: Boolean(
    process.env.RESEND_API_KEY && (process.env.NEXTAUTH_EMAIL_FROM || process.env.EMAIL_FROM),
  ),
  apple: {
    clientId:
      normalizeSecret(process.env.APPLE_WEB_CLIENT_ID) ||
      normalizeSecret(process.env.APPLE_ID) ||
      normalizeSecret(process.env.APPLE_CLIENT_ID),
    teamId: normalizeSecret(process.env.APPLE_TEAM_ID),
    keyId: normalizeSecret(process.env.APPLE_KEY_ID),
    privateKey: getApplePrivateKey(),
  },
  getReceipts: {
    appSlug: process.env.GETRECEIPTS_APP_SLUG || "assembled-reality",
    baseUrl: process.env.GETRECEIPTS_BASE_URL || "https://getreceipts.com",
    clientSecret: process.env.GETRECEIPTS_CLIENT_SECRET || "",
    redirectUri:
      process.env.GETRECEIPTS_REDIRECT_URI ||
      `${getDefaultSiteUrl()}/api/integrations/getreceipts/callback`,
  },
  integrationsStateSecret:
    process.env.INTEGRATIONS_STATE_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "",
  integrationsTokenKey:
    process.env.INTEGRATIONS_TOKEN_KEY ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "",
  openai: {
    apiKey: getOpenAiApiKey(),
    textModel: normalizeSecret(process.env.OPENAI_SEVEN_MODEL) || "gpt-4o-mini",
    imageSourceModel:
      normalizeSecret(process.env.OPENAI_IMAGE_SOURCE_MODEL) || "gpt-4.1-mini",
    audioSourceModel: normalizeSecret(process.env.OPENAI_AUDIO_SOURCE_MODEL),
    speechModel:
      normalizeSecret(process.env.OPENAI_SEVEN_SPEECH_MODEL) || "gpt-4o-mini-tts",
    voice: normalizeSecret(process.env.OPENAI_SEVEN_VOICE) || "sage",
  },
  elevenlabs: {
    apiKey: normalizeSecret(process.env.ELEVENLABS_API_KEY),
    voiceId: normalizeSecret(process.env.ELEVENLABS_VOICE_ID),
    modelId: normalizeSecret(process.env.ELEVENLABS_MODEL_ID) || "eleven_flash_v2_5",
    outputFormat:
      normalizeSecret(process.env.ELEVENLABS_OUTPUT_FORMAT) || "mp3_44100_64",
  },
};

appEnv.apple.enabled = Boolean(
  appEnv.apple.clientId &&
    appEnv.apple.teamId &&
    appEnv.apple.keyId &&
    appEnv.apple.privateKey,
);

appEnv.openai.enabled = Boolean(appEnv.openai.apiKey);
appEnv.elevenlabs.enabled = Boolean(
  appEnv.elevenlabs.apiKey && appEnv.elevenlabs.voiceId,
);
