export default function Badge({ children, color, active, className = "", ...props }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-sm font-medium rounded-[3px] ${className}`}
      style={color ? {
        background: active ? color + "10" : "transparent",
        color: active ? color : "#D4D4D4",
        border: `1px solid ${active ? color + "30" : "#E5E5E5"}`,
      } : undefined}
      {...props}
    >
      {children}
    </span>
  );
}
