import { ImageResponse } from "next/og";
import {
  ACTION_LINE,
  BRAND_TRUTH,
  METADATA_DESCRIPTION,
  PRODUCT_NAME,
} from "@/lib/product-language";

export const alt = `${PRODUCT_NAME} share card`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

function MetaPill({ children, accent = false }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 16px",
        borderRadius: 999,
        border: `1px solid ${accent ? "rgba(51, 156, 255, 0.32)" : "rgba(255,255,255,0.1)"}`,
        background: accent ? "rgba(51, 156, 255, 0.08)" : "rgba(255,255,255,0.03)",
        color: accent ? "#339CFF" : "rgba(255,255,255,0.7)",
        fontSize: 20,
        letterSpacing: 0.6,
      }}
    >
      {children}
    </div>
  );
}

function MockRow({ title, meta, active = false }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "18px 20px",
        borderRadius: 22,
        border: `1px solid ${active ? "rgba(51,156,255,0.24)" : "rgba(255,255,255,0.06)"}`,
        background: active ? "rgba(51,156,255,0.09)" : "rgba(255,255,255,0.03)",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "#1b1b1b",
          color: active ? "#339CFF" : "rgba(255,255,255,0.7)",
          fontSize: 22,
        }}
      >
        {active ? "7" : ">"}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            color: "#FFFFFF",
            fontSize: 24,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.46)",
            fontSize: 18,
          }}
        >
          {meta}
        </div>
      </div>
    </div>
  );
}

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 36,
          background: "#181818",
          color: "#FFFFFF",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            borderRadius: 34,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "#1f1f1f",
            padding: 34,
            gap: 28,
          }}
        >
          <div
            style={{
              width: "54%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <MetaPill accent>{BRAND_TRUTH}</MetaPill>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 76,
                    lineHeight: 0.96,
                    fontWeight: 700,
                    letterSpacing: -2.6,
                  }}
                >
                  {PRODUCT_NAME}
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.72)",
                    fontSize: 34,
                    lineHeight: 1.18,
                    maxWidth: 520,
                  }}
                >
                  {ACTION_LINE}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <MetaPill>Speak</MetaPill>
                <MetaPill>Listen</MetaPill>
                <MetaPill>Assemble</MetaPill>
                <MetaPill>Keep the receipt</MetaPill>
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.52)",
                  fontSize: 20,
                  lineHeight: 1.4,
                  maxWidth: 560,
                }}
              >
                {METADATA_DESCRIPTION}
              </div>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              padding: 18,
              borderRadius: 28,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "#242424",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: 6,
              }}
            >
              <div
                style={{
                  color: "#FFFFFF",
                  fontSize: 24,
                  fontWeight: 600,
                }}
              >
                Workspace
              </div>
              <MetaPill accent>Main Project</MetaPill>
            </div>

            <MockRow
              active
              title="Seven conversation"
              meta="Ask about the current document, then send useful answers into staging."
            />
            <MockRow
              title="Source material"
              meta="Drop anything to build something."
            />
            <MockRow
              title="Current assembly"
              meta="Selected blocks gather here, then turn into a working document."
            />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
