import { Resend } from "resend";
import { appEnv } from "@/lib/env";
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
      <body style="margin:0;padding:0;background:#121212;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif;">
        <div style="padding:32px 16px;background:radial-gradient(circle at top left, rgba(51, 156, 255, 0.12), transparent 30%), #121212;">
          <div style="max-width:560px;margin:0 auto;border:1px solid rgba(255,255,255,0.08);border-radius:28px;background:#1f1f1f;box-shadow:0 14px 36px rgba(0,0,0,0.32);overflow:hidden;">
            <div style="padding:24px 28px 18px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;color:rgba(255,255,255,0.45);font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">
                Lœgos
              </p>
            </div>
            <div style="padding:32px 28px 30px;">
              <p style="margin:0 0 10px 0;color:rgba(255,255,255,0.68);font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">
                Email magic link
              </p>
              <p style="margin:0 0 12px 0;color:#ffffff;font-size:28px;line-height:1.2;font-weight:600;letter-spacing:-0.03em;">
                Sign in to ${brandName} with a secure link.
              </p>
              <p style="margin:0 0 28px 0;color:#339cff;font-size:16px;line-height:1.6;">
                Close the gap between what you think and what you do.
              </p>
              <a
                href="${escapedUrl}"
                style="display:block;width:100%;box-sizing:border-box;border:1px solid rgba(51,156,255,0.48);border-radius:18px;background:rgba(51,156,255,0.18);color:#ffffff;text-decoration:none;padding:18px 24px;font-size:18px;font-weight:600;text-align:center;"
              >
                Enter Loegos
              </a>
              <p style="margin:26px 0 0 0;color:rgba(255,255,255,0.68);font-size:14px;line-height:1.7;">
                This sign-in link expires shortly and only works once.
              </p>
              <p style="margin:12px 0 0 0;color:rgba(255,255,255,0.45);font-size:13px;line-height:1.7;">
                If you did not request this email, you can safely ignore it.
              </p>
              <p style="margin:22px 0 0 0;color:rgba(255,255,255,0.45);font-size:12px;line-height:1.7;word-break:break-all;">
                If the button does not work, open this link:<br />
                <a href="${escapedUrl}" style="color:#7eb8ff;text-decoration:none;">${escapedUrl}</a>
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
