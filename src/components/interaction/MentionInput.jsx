import { useState, useRef, useEffect } from "react";
import { READERS } from "../../constants";

export default function MentionInput({ value, onChange, placeholder, rows = 2, style }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filter, setFilter] = useState("");
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const textareaRef = useRef(null);
  const wrapperRef = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    const cursorPos = e.target.selectionStart;
    const textBefore = val.slice(0, cursorPos);
    const atMatch = textBefore.match(/@(\w*)$/);
    if (atMatch) {
      setFilter(atMatch[1].toLowerCase());
      setShowDropdown(true);
      if (wrapperRef.current) {
        const wrapperRect = wrapperRef.current.getBoundingClientRect();
        const taRect = e.target.getBoundingClientRect();
        setDropdownPos({ top: taRect.bottom - wrapperRect.top + 2, left: 0 });
      }
    } else {
      setShowDropdown(false);
    }
  };

  const insertMention = (name) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const cursorPos = ta.selectionStart;
    const textBefore = value.slice(0, cursorPos);
    const textAfter = value.slice(cursorPos);
    const atMatch = textBefore.match(/@(\w*)$/);
    if (atMatch) {
      const newBefore = textBefore.slice(0, atMatch.index) + `@${name} `;
      onChange(newBefore + textAfter);
      setShowDropdown(false);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = newBefore.length; ta.focus(); }, 0);
    }
  };

  const filtered = READERS.filter(r => r.toLowerCase().startsWith(filter));

  useEffect(() => {
    const handleKeyDown = (e) => { if (showDropdown && e.key === "Escape") setShowDropdown(false); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showDropdown]);

  return (
    <div ref={wrapperRef} className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y rounded-[1rem] border border-border-dark/70 bg-paper-soft px-3 py-2.5 text-[16px] leading-normal outline-none"
        style={style}
      />
      {showDropdown && filtered.length > 0 && (
        <div className="absolute left-0 right-0 z-[300] max-h-[200px] overflow-y-auto rounded-[1rem] border border-border bg-paper-soft shadow-[0_10px_24px_rgba(27,24,21,0.08)]" style={{ top: dropdownPos.top }}>
          {filtered.map(name => (
            <button key={name} onClick={() => insertMention(name)}
              className="block min-h-9 w-full border-b border-surface-raised bg-transparent px-3 py-2 text-left text-md font-medium text-ink"
              type="button"
            >
              @{name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
