import { SECTIONS } from "../../constants";

export default function CrossRef({ to }) {
  const section = SECTIONS.find(s => s.id === to);
  if (!section) return null;

  const handleClick = (e) => {
    e.preventDefault();
    const el = document.getElementById(to);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <a
      href={`#${to}`}
      onClick={handleClick}
      className="text-ink no-underline border-b border-border font-medium cursor-pointer"
    >
      {"\u00A7"}{section.num} {section.title}
    </a>
  );
}
