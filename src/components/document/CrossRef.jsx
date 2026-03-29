import { SECTIONS } from "../../constants";

export default function CrossRef({ to }) {
  const section = SECTIONS.find(s => s.id === to);
  if (!section) return null;

  const handleClick = (e) => {
    e.preventDefault();
    const el = document.getElementById(to);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <a
      href={`#${to}`}
      onClick={handleClick}
      style={{
        color: "#2A5A6B",
        textDecoration: "none",
        borderBottom: "1px dashed #2A5A6B",
        fontWeight: 500,
        cursor: "pointer",
        transition: "color 0.15s",
      }}
      onMouseEnter={e => e.target.style.color = "#1A1917"}
      onMouseLeave={e => e.target.style.color = "#2A5A6B"}
    >
      {"\u00A7"}{section.num} {section.title}
    </a>
  );
}
