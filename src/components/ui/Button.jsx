const variants = {
  default: "bg-transparent border border-border text-ink-tertiary hover:border-border-dark",
  pill: (active) => active
    ? "bg-ink text-white border border-ink"
    : "bg-transparent text-ink-tertiary border border-border",
  ghost: "bg-transparent border-none text-ink-muted hover:text-ink-tertiary",
  icon: "bg-transparent border-none text-ink-muted p-1.5 flex items-center justify-center",
};

const sizes = {
  sm: "px-2 py-0.5 text-sm min-h-7",
  md: "px-2.5 py-1 text-sm min-h-7",
  lg: "px-5 py-3 text-body min-h-11",
};

export default function Button({ variant = "default", size = "md", active, children, className = "", ...props }) {
  const variantClass = typeof variants[variant] === "function"
    ? variants[variant](active)
    : variants[variant];

  return (
    <button
      className={`rounded-[3px] cursor-pointer font-medium transition-all duration-100 ${sizes[size]} ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
