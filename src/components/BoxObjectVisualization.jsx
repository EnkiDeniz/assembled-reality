import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { getAssemblyColorTokens } from "@/lib/assembly-architecture";

const SIZE_TOKENS = Object.freeze({
  compact: {
    className: "is-compact",
    width: 144,
    height: 118,
  },
  standard: {
    className: "is-standard",
    width: 220,
    height: 176,
  },
  expanded: {
    className: "is-expanded",
    width: 280,
    height: 224,
  },
});

function getResolvedSize(size = "standard") {
  return SIZE_TOKENS[size] || SIZE_TOKENS.standard;
}

export default function BoxObjectVisualization({
  state = null,
  size = "standard",
  title = "Box state",
  subtitle = "",
}) {
  const Motion = motion;
  const resolvedSize = getResolvedSize(size);
  const prefersReducedMotion = useReducedMotion();
  const gradientScope = useId().replace(/:/g, "");
  const fillGradientId = `${gradientScope}-box-object-fill`;
  const wireGradientId = `${gradientScope}-box-object-wire`;
  const fill = Math.max(0.06, Math.min(1, Number(state?.fill) || 0));
  const stage = String(state?.stage || "dormant").trim().toLowerCase();
  const colorTokens = state?.colorTokens || getAssemblyColorTokens(state?.colorStep);
  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.8, ease: "easeInOut" };

  return (
    <div className={`assembler-box-object ${resolvedSize.className}`}>
      <div
        className="assembler-box-object__frame"
        style={{
          "--assembly-tone": colorTokens.fill,
          "--assembly-tone-soft": colorTokens.soft,
          "--assembly-tone-border": colorTokens.border,
          "--assembly-tone-glow": colorTokens.glow,
          "--assembly-tone-text": colorTokens.text,
        }}
      >
        <svg
          viewBox="0 0 220 176"
          width={resolvedSize.width}
          height={resolvedSize.height}
          role="img"
          aria-label={title}
        >
          <defs>
            <linearGradient id={fillGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colorTokens.fill} />
              <stop offset="50%" stopColor="rgba(255, 255, 255, 0.68)" />
              <stop offset="100%" stopColor={colorTokens.text} />
            </linearGradient>
            <linearGradient id={wireGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colorTokens.fill} />
              <stop offset="100%" stopColor={colorTokens.text} />
            </linearGradient>
          </defs>

          <Motion.polygon
            points="34,54 110,24 186,54 110,84"
            fill={colorTokens.soft}
            stroke={`url(#${wireGradientId})`}
            strokeWidth="2"
            initial={false}
            animate={{ opacity: stage === "dormant" ? 0.2 : 0.78 }}
            transition={transition}
          />
          <Motion.polygon
            points="34,54 34,118 110,150 110,84"
            fill={colorTokens.soft}
            stroke={`url(#${wireGradientId})`}
            strokeWidth="2"
            initial={false}
            animate={{ opacity: stage === "dormant" ? 0.14 : 0.62 }}
            transition={transition}
          />
          <Motion.polygon
            points="110,84 110,150 186,118 186,54"
            fill={colorTokens.soft}
            stroke={`url(#${wireGradientId})`}
            strokeWidth="2"
            initial={false}
            animate={{ opacity: stage === "dormant" ? 0.14 : 0.62 }}
            transition={transition}
          />

          <Motion.polygon
            points="58,70 110,50 162,70 110,90"
            fill={`url(#${fillGradientId})`}
            stroke={colorTokens.text}
            strokeWidth="1.2"
            initial={false}
            animate={{
              opacity:
                stage === "dormant"
                  ? 0
                  : stage === "wireframe"
                    ? 0.18
                    : Math.max(0.28, fill),
              scale: stage === "solid" ? 1 : 0.98,
            }}
            transformOrigin="110px 88px"
            transition={transition}
          />

          <Motion.path
            d="M58 70 L58 116 L110 136 L110 90"
            fill={`url(#${fillGradientId})`}
            stroke={colorTokens.border}
            strokeWidth="1.2"
            initial={false}
            animate={{
              opacity:
                stage === "dormant"
                  ? 0
                  : stage === "wireframe"
                    ? 0.12
                    : Math.max(0.24, fill * 0.92),
            }}
            transition={transition}
          />
          <Motion.path
            d="M110 90 L110 136 L162 116 L162 70"
            fill={`url(#${fillGradientId})`}
            stroke={colorTokens.border}
            strokeWidth="1.2"
            initial={false}
            animate={{
              opacity:
                stage === "dormant"
                  ? 0
                  : stage === "wireframe"
                    ? 0.12
                    : Math.max(0.24, fill * 0.92),
            }}
            transition={transition}
          />

          <Motion.path
            d="M44 60 L110 86 L176 60"
            fill="none"
            stroke={colorTokens.border}
            strokeDasharray="5 6"
            strokeWidth="1.4"
            initial={false}
            animate={{
              opacity: stage === "dormant" ? 0.12 : 0.48,
              pathLength: stage === "solid" ? 1 : 0.72,
            }}
            transition={transition}
          />

          <Motion.path
            d="M76 100 C92 92, 126 92, 146 104"
            fill="none"
            stroke={colorTokens.fill}
            strokeWidth="2"
            strokeLinecap="round"
            initial={false}
            animate={{
              opacity: stage === "tension" ? 0.92 : 0.12,
              pathLength: stage === "tension" ? 1 : 0.35,
            }}
            transition={transition}
          />

          <Motion.circle
            cx="110"
            cy="104"
            r="8"
            fill={colorTokens.text}
            initial={false}
            animate={{
              opacity: stage === "solid" || stage === "tension" ? 0.9 : 0.22,
              scale:
                stage === "solid"
                  ? 1.06
                  : stage === "tension"
                    ? 0.94
                    : 0.82,
            }}
            transition={transition}
          />

          {state?.suggestionPending ? (
            <Motion.circle
              cx="174"
              cy="42"
              r="8"
              fill="rgba(255, 214, 118, 0.96)"
              initial={false}
              animate={{ opacity: 1, scale: prefersReducedMotion ? 1 : [1, 1.08, 1] }}
              transition={
                prefersReducedMotion
                  ? transition
                  : { duration: 1.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
              }
            />
          ) : null}
        </svg>
      </div>

      <div className="assembler-box-object__copy">
        <span className="assembler-box-object__title">{title}</span>
        {subtitle ? <span className="assembler-box-object__subtitle">{subtitle}</span> : null}
      </div>
    </div>
  );
}
