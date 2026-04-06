import Link from "next/link";
import {
  LOEGOS_SHAPE_ORDER,
  buildShapeNavItems,
  getLoegosShape,
  getSignalTone,
} from "@/lib/loegos-system";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

function ShapeSealGlyph({ size = 20 }) {
  return (
    <svg
      viewBox="0 0 48 32"
      width={size}
      height={Math.round(size * 0.68)}
      aria-hidden="true"
    >
      {[4, 14, 24, 34].map((x) => (
        <path key={`top-${x}`} d={`M${x} 4h6l-3 10z`} fill="currentColor" />
      ))}
      {[9, 19, 29].map((x) => (
        <path key={`bottom-${x}`} d={`M${x} 18h6l-3 10z`} fill="currentColor" />
      ))}
    </svg>
  );
}

export function ShapeGlyph({ shapeKey = "aim", size = 18, className = "" }) {
  const shape = getLoegosShape(shapeKey);
  const glyphClassName = joinClasses("loegos-shape-glyph", className, `is-${shape.key}`);

  if (shape.key === "aim") {
    return (
      <span className={glyphClassName} aria-hidden="true">
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
          <path
            d="M12 4.5 19 18.5H5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  if (shape.key === "reality") {
    return (
      <span className={glyphClassName} aria-hidden="true">
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
          <rect
            x="6.25"
            y="6.25"
            width="11.5"
            height="11.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      </span>
    );
  }

  if (shape.key === "weld") {
    return (
      <span className={glyphClassName} aria-hidden="true">
        <span className="loegos-shape-glyph__weld" style={{ fontSize: size + 4 }}>
          œ
        </span>
      </span>
    );
  }

  return (
    <span className={glyphClassName} aria-hidden="true">
      <ShapeSealGlyph size={size + 4} />
    </span>
  );
}

export function SignalChip({
  tone = "neutral",
  label = "",
  className = "",
  subtle = false,
  children,
}) {
  const normalizedTone = getSignalTone(tone);
  const content = children || label;

  if (!content) return null;

  return (
    <span
      className={joinClasses(
        "loegos-signal-chip",
        subtle ? "is-subtle" : "",
        `is-${normalizedTone}`,
        className,
      )}
    >
      {content}
    </span>
  );
}

export function SevenGradient({ level = 0, className = "", label = "" }) {
  const normalizedLevel = Math.max(0, Math.min(7, Number(level) || 0));

  return (
    <div className={joinClasses("loegos-seven-gradient", className)} aria-label={`Settlement ${normalizedLevel} of 7`}>
      <div className="loegos-seven-gradient__track">
        {Array.from({ length: 7 }).map((_, index) => (
          <span
            key={index}
            className={joinClasses(
              "loegos-seven-gradient__step",
              index < normalizedLevel ? "is-active" : "",
            )}
            style={{ "--loegos-seven-index": index }}
          />
        ))}
      </div>
      {label ? <span className="loegos-seven-gradient__label">{label}</span> : null}
    </div>
  );
}

export function SettlementHex({ stageCount = 0, className = "", label = "" }) {
  const normalizedCount = Math.max(0, Math.min(7, Number(stageCount) || 0));
  const edgeStates = Array.from({ length: 6 }).map((_, index) => index < normalizedCount);
  const centerActive = normalizedCount >= 7;

  return (
    <div
      className={joinClasses("loegos-settlement-hex", className)}
      aria-label={`Settlement vessel ${normalizedCount} of 7`}
    >
      <svg viewBox="0 0 64 56" className="loegos-settlement-hex__svg" aria-hidden="true">
        <polygon
          className="loegos-settlement-hex__outline"
          points="16,4 48,4 60,28 48,52 16,52 4,28"
        />
        <line className={joinClasses("loegos-settlement-hex__edge", edgeStates[0] ? "is-active" : "")} x1="16" y1="4" x2="48" y2="4" />
        <line className={joinClasses("loegos-settlement-hex__edge", edgeStates[1] ? "is-active" : "")} x1="48" y1="4" x2="60" y2="28" />
        <line className={joinClasses("loegos-settlement-hex__edge", edgeStates[2] ? "is-active" : "")} x1="60" y1="28" x2="48" y2="52" />
        <line className={joinClasses("loegos-settlement-hex__edge", edgeStates[3] ? "is-active" : "")} x1="48" y1="52" x2="16" y2="52" />
        <line className={joinClasses("loegos-settlement-hex__edge", edgeStates[4] ? "is-active" : "")} x1="16" y1="52" x2="4" y2="28" />
        <line className={joinClasses("loegos-settlement-hex__edge", edgeStates[5] ? "is-active" : "")} x1="4" y1="28" x2="16" y2="4" />
        <circle
          className={joinClasses("loegos-settlement-hex__core", centerActive ? "is-active" : "")}
          cx="32"
          cy="28"
          r="5.5"
        />
      </svg>
      {label ? <span className="loegos-settlement-hex__label">{label}</span> : null}
    </div>
  );
}

export function ConvergenceBar({ left = 0, middle = 0, right = 0, className = "" }) {
  const segments = [
    { key: "left", label: "Aim", value: Number(left) || 0 },
    { key: "middle", label: "Reality", value: Number(middle) || 0 },
    { key: "right", label: "Weld", value: Number(right) || 0 },
  ];
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;

  return (
    <div className={joinClasses("loegos-convergence-bar", className)} aria-label="Convergence">
      {segments.map((segment) => (
        <span
          key={segment.key}
          className={joinClasses("loegos-convergence-bar__segment", `is-${segment.key}`)}
          style={{ flexGrow: segment.value || 1, "--loegos-weight": segment.value / total }}
          title={`${segment.label}: ${segment.value}`}
        />
      ))}
    </div>
  );
}

export function ShapeNav({
  items = buildShapeNavItems(),
  activeShape = "aim",
  compact = false,
  className = "",
  onSelect,
}) {
  return (
    <div className={joinClasses("loegos-shape-nav", compact ? "is-compact" : "", className)}>
      {items.map((item) => {
        const shape = getLoegosShape(item.shapeKey);
        const active = item.active ?? item.shapeKey === activeShape;
        const content = (
          <>
            <span className="loegos-shape-nav__head">
              <ShapeGlyph shapeKey={shape.key} size={compact ? 16 : 18} />
              <span className="loegos-shape-nav__label">{item.label || shape.label}</span>
              {item.badge ? (
                <SignalChip tone={item.badgeTone} subtle className="loegos-shape-nav__badge">
                  {item.badge}
                </SignalChip>
              ) : null}
            </span>
            <span className="loegos-shape-nav__copy">
              <span className="loegos-shape-nav__verb">{item.verb || shape.verbs[0]}</span>
              <span className="loegos-shape-nav__description">
                {compact ? item.description || shape.summary : item.description || shape.summary}
              </span>
            </span>
          </>
        );

        if (item.href) {
          return (
            <Link
              key={shape.key}
              href={item.href}
              className={joinClasses("loegos-shape-nav__item", active ? "is-active" : "")}
            >
              {content}
            </Link>
          );
        }

        if (!onSelect) {
          return (
            <div
              key={shape.key}
              className={joinClasses("loegos-shape-nav__item", active ? "is-active" : "")}
            >
              {content}
            </div>
          );
        }

        return (
          <button
            key={shape.key}
            type="button"
            className={joinClasses("loegos-shape-nav__item", active ? "is-active" : "")}
            onClick={() => onSelect?.(shape.key)}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

export function VerbToolbar({
  shapeKey = "aim",
  verbs = [],
  activeVerb = "",
  className = "",
  onSelect,
}) {
  const shape = getLoegosShape(shapeKey);
  const items = verbs.length ? verbs : shape.verbs;

  return (
    <div className={joinClasses("loegos-verb-toolbar", className)} aria-label={`${shape.label} verbs`}>
      {items.map((verb) => {
        const isActive = verb === activeVerb;
        if (!onSelect) {
          return (
            <div
              key={verb}
              className={joinClasses("loegos-verb-toolbar__item", isActive ? "is-active" : "")}
            >
              {verb}
            </div>
          );
        }

        return (
          <button
            key={verb}
            type="button"
            className={joinClasses("loegos-verb-toolbar__item", isActive ? "is-active" : "")}
            onClick={() => onSelect?.(verb)}
          >
            {verb}
          </button>
        );
      })}
    </div>
  );
}

export function BoxMetric({ label, value, detail = "", className = "" }) {
  return (
    <article className={joinClasses("loegos-box-metric", className)}>
      <span className="loegos-box-metric__label">{label}</span>
      <strong className="loegos-box-metric__value">{value}</strong>
      {detail ? <span className="loegos-box-metric__detail">{detail}</span> : null}
    </article>
  );
}

export function OperatorBlock({
  shapeKey = "reality",
  label = "",
  title = "",
  body = "",
  meta = "",
  signal = "",
  className = "",
}) {
  const shape = getLoegosShape(shapeKey);

  return (
    <article className={joinClasses("loegos-operator-block", className)}>
      <div className="loegos-operator-block__head">
        <span className="loegos-operator-block__shape">
          <ShapeGlyph shapeKey={shape.key} size={16} />
          <span>{label || shape.label}</span>
        </span>
        {signal ? <SignalChip tone={signal}>{signal}</SignalChip> : null}
      </div>
      {title ? <strong className="loegos-operator-block__title">{title}</strong> : null}
      {body ? <p className="loegos-operator-block__body">{body}</p> : null}
      {meta ? <span className="loegos-operator-block__meta">{meta}</span> : null}
    </article>
  );
}

export function AssembledCard({
  shapeKey = "reality",
  label = "",
  title = "",
  body = "",
  detail = "",
  signal = "",
  signalTone = "",
  metric = null,
  footer = null,
  action = null,
  stageCount = 0,
  children = null,
  className = "",
}) {
  const shape = getLoegosShape(shapeKey);

  return (
    <article className={joinClasses("loegos-assembled-card", className)}>
      <div className="loegos-assembled-card__head">
        <span className="loegos-assembled-card__shape">
          <ShapeGlyph shapeKey={shape.key} size={18} />
          <span>{label || shape.label}</span>
        </span>
        <div className="loegos-assembled-card__head-meta">
          {signal ? <SignalChip tone={signalTone || signal}>{signal}</SignalChip> : null}
          <SettlementHex stageCount={stageCount} />
        </div>
      </div>
      {title ? <h3 className="loegos-assembled-card__title">{title}</h3> : null}
      {body ? <p className="loegos-assembled-card__body">{body}</p> : null}
      {metric ? <div className="loegos-assembled-card__metric">{metric}</div> : null}
      {detail ? <p className="loegos-assembled-card__detail">{detail}</p> : null}
      {children ? <div className="loegos-assembled-card__content">{children}</div> : null}
      {footer || action ? (
        <div className="loegos-assembled-card__footer">
          {footer ? <div className="loegos-assembled-card__footer-copy">{footer}</div> : null}
          {action ? <div className="loegos-assembled-card__action">{action}</div> : null}
        </div>
      ) : null}
    </article>
  );
}

export function buildLoegosNavItems({
  activeShape = "aim",
  activeVerb = "",
  badges = {},
} = {}) {
  return buildShapeNavItems({ activeShape, activeVerb, badges }).map((item) => ({
    ...item,
    key: item.shapeKey,
  }));
}

export function buildStaticShapeNav(activeShape = "aim") {
  return LOEGOS_SHAPE_ORDER.map((shapeKey) => {
    const shape = getLoegosShape(shapeKey);
    return {
      shapeKey,
      label: shape.label,
      description: shape.summary,
      verb: shape.verbs[0],
      active: shapeKey === activeShape,
    };
  });
}
