import { Resend } from "resend";
import { appEnv } from "@/lib/env";
import { DESIGN_TOKENS } from "@/lib/design-tokens";
import { PRODUCT_NAME } from "@/lib/product-language";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function getEmailHtml({ url, brandName }) {
  const escapedUrl = url.replace(/&/g, "&amp;");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Sign in to ${brandName}</title>
      </head>
      <body style="margin:0;padding:0;background:${DESIGN_TOKENS.surface0};color:${DESIGN_TOKENS.textPrimary};font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif;">
        <div style="padding:32px 16px;background:${DESIGN_TOKENS.surface0};">
          <div style="max-width:560px;margin:0 auto;border:1px solid ${DESIGN_TOKENS.line};border-radius:28px;background:${DESIGN_TOKENS.surface1};box-shadow:${DESIGN_TOKENS.shadowPanel};overflow:hidden;">
            <div style="padding:24px 28px 18px;border-bottom:1px solid ${DESIGN_TOKENS.line};">
              <p style="margin:0;color:${DESIGN_TOKENS.textMeta};font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">
                Lœgos
              </p>
            </div>
            <div style="padding:32px 28px 30px;">
              <p style="margin:0 0 10px 0;color:${DESIGN_TOKENS.textSecondary};font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">
                Email magic link
              </p>
              <p style="margin:0 0 12px 0;color:${DESIGN_TOKENS.textPrimary};font-size:28px;line-height:1.2;font-weight:600;letter-spacing:-0.03em;">
                Sign in to ${brandName} with a secure link.
              </p>
              <p style="margin:0 0 28px 0;color:${DESIGN_TOKENS.assemblyStep1Text};font-size:16px;line-height:1.6;">
                Close the gap between what you think and what you do.
              </p>
              <a
                href="${escapedUrl}"
                style="display:block;width:100%;box-sizing:border-box;border:1px solid ${DESIGN_TOKENS.assemblyStep1Border};border-radius:18px;background:${DESIGN_TOKENS.assemblyStep1Soft};color:${DESIGN_TOKENS.textPrimary};text-decoration:none;padding:18px 24px;font-size:18px;font-weight:600;text-align:center;"
              >
                Enter Loegos
              </a>
              <p style="margin:26px 0 0 0;color:${DESIGN_TOKENS.textSecondary};font-size:14px;line-height:1.7;">
                This sign-in link expires shortly and only works once.
              </p>
              <p style="margin:12px 0 0 0;color:${DESIGN_TOKENS.textMeta};font-size:13px;line-height:1.7;">
                If you did not request this email, you can safely ignore it.
              </p>
              <p style="margin:22px 0 0 0;color:${DESIGN_TOKENS.textMeta};font-size:12px;line-height:1.7;word-break:break-all;">
                If the button does not work, open this link:<br />
                <a href="${escapedUrl}" style="color:${DESIGN_TOKENS.assemblyStep1Text};text-decoration:none;">${escapedUrl}</a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function getEmailText({ url, brandName }) {
  return `Sign in to ${brandName}

Open this link to enter ${brandName}:
${url}

If you did not request this email, you can safely ignore it.`;
}

export async function sendVerificationRequest({ identifier, url, provider }) {
  if (!resend) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[email] RESEND_API_KEY missing. Magic link:");
      console.warn(url);
    }
    return;
  }

  const brandName = provider?.brandName || PRODUCT_NAME;
  const from = String(provider?.from || appEnv.emailFrom).trim();

  const { error } = await resend.emails.send({
    from,
    to: identifier,
    subject: `Sign in to ${brandName}`,
    html: getEmailHtml({ url, brandName }),
    text: getEmailText({ url, brandName }),
  });

  if (error) {
    throw new Error(error.message);
  }
}
