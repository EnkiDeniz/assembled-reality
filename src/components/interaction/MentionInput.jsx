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
      // Position relative to wrapper for better mobile behavior
      if (wrapperRef.current) {
        const wrapperRect = wrapperRef.current.getBoundingClientRect();
        const taRect = e.target.getBoundingClientRect();
        setDropdownPos({
          top: taRect.bottom - wrapperRect.top + 2,
          left: 0,
        });
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
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = newBefore.length;
        ta.focus();
      }, 0);
    }
  };

  const filtered = READERS.filter(r => r.toLowerCase().startsWith(filter));

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showDropdown && e.key === "Escape") {
        setShowDropdown(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showDropdown]);

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: "100%", padding: "9px 10px", fontSize: "16px",
          fontFamily: "'Cormorant Garamond',Georgia,serif",
          border: "1px solid #D6D1C8", background: "#F7F4EF",
          borderRadius: 3, outline: "none", resize: "vertical", lineHeight: 1.5,
          ...style,
        }}
      />
      {showDropdown && filtered.length > 0 && (
        <div style={{
          position: "absolute",
          top: dropdownPos.top,
          left: dropdownPos.left,
          right: 0,
          zIndex: 300, background: "#F7F4EF", border: "1px solid #D6D1C8",
          borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          maxHeight: 200, overflowY: "auto",
        }}>
          {filtered.map(name => (
            <button
              key={name}
              onClick={() => insertMention(name)}
              style={{
                display: "block", width: "100%",
                padding: "10px 14px",
                fontSize: "0.82rem", fontFamily: "'DM Sans',sans-serif",
                fontWeight: 500, background: "transparent", border: "none",
                cursor: "pointer", textAlign: "left", color: "#1A1917",
                minHeight: 40,
                borderBottom: "1px solid #F0ECE4",
              }}
            >
              @{name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
