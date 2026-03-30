import { Resend } from "resend";

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
      <body style="margin:0;padding:0;background:#f3eee3;color:#1d1612;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <div style="max-width:640px;margin:0 auto;padding:40px 20px;">
          <div style="border:1px solid rgba(68,46,26,0.12);border-radius:28px;background:#faf6ef;padding:32px 28px;box-shadow:0 20px 60px rgba(68,46,26,0.08);">
            <p style="margin:0 0 12px 0;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#8b735f;">Private reading instrument</p>
            <h1 style="margin:0 0 12px 0;font-family:'Source Serif 4',Georgia,serif;font-size:40px;line-height:1;color:#1d1612;">
              ${brandName}
            </h1>
            <p style="margin:0 0 28px 0;font-size:17px;line-height:1.6;color:#4c4036;">
              Use the link below to enter the reader.
            </p>
            <a
              href="${escapedUrl}"
              style="display:inline-block;border-radius:999px;background:#1d1612;color:#faf6ef;text-decoration:none;padding:14px 22px;font-size:14px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;"
            >
              Enter the Reader
            </a>
            <p style="margin:28px 0 0 0;font-size:13px;line-height:1.6;color:#8b735f;">
              If you did not request this sign-in link, you can safely ignore this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function getEmailText({ url, brandName }) {
  return `Sign in to ${brandName}

Open this link to enter the reader:
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

  const brandName = provider?.brandName || "Assembled Reality";
  const from = String(provider?.from || process.env.NEXTAUTH_EMAIL_FROM || process.env.EMAIL_FROM || "Assembled Reality <noreply@updates.getreceipts.com>").trim();

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
