function splitCsv(value) {
  return (value || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export const appEnv = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000",
  authSecret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "",
  bootstrapCode:
    process.env.READER_BOOTSTRAP_CODE ||
    (process.env.NODE_ENV === "development" ? "hineni" : ""),
  invitedEmails: splitCsv(process.env.READER_INVITED_EMAILS),
  magicLinksEnabled: Boolean(process.env.RESEND_API_KEY && (process.env.NEXTAUTH_EMAIL_FROM || process.env.EMAIL_FROM)),
  getReceipts: {
    appSlug: process.env.GETRECEIPTS_APP_SLUG || "assembled-reality",
    baseUrl: process.env.GETRECEIPTS_BASE_URL || "https://getreceipts.com",
    clientSecret: process.env.GETRECEIPTS_CLIENT_SECRET || "",
    redirectUri:
      process.env.GETRECEIPTS_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/integrations/getreceipts/callback`,
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
};
