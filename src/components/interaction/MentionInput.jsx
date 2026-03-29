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
        className="w-full py-2 px-2.5 text-[16px] font-[inherit] border border-border bg-white rounded-sm outline-none resize-y leading-normal"
        style={style}
      />
      {showDropdown && filtered.length > 0 && (
        <div className="absolute left-0 right-0 z-[300] bg-white border border-border rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.06)] max-h-[200px] overflow-y-auto" style={{ top: dropdownPos.top }}>
          {filtered.map(name => (
            <button key={name} onClick={() => insertMention(name)}
              className="block w-full py-2 px-3 text-md font-medium bg-transparent border-none cursor-pointer text-left text-ink min-h-9 border-b border-surface-raised">
              @{name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
