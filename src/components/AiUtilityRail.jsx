export default function AiUtilityRail({
  open = false,
  inputRef,
  value,
  scope,
  pending = false,
  scopeOptions = [],
  onToggleOpen,
  onChange,
  onScopeChange,
  onSubmit,
  onPreset,
}) {
  return (
    <section className={`assembler-utility-rail ${open ? "is-open" : ""}`}>
      <div className="assembler-utility-rail__header">
        <div className="assembler-utility-rail__copy">
          <span className="assembler-utility-rail__eyebrow">AI</span>
          <span className="assembler-utility-rail__title">Assistant</span>
        </div>

        <button
          type="button"
          className={`assembler-utility-rail__toggle ${open ? "is-active" : ""}`}
          onClick={onToggleOpen}
          aria-label={open ? "Close 7 utility rail" : "Open 7 utility rail"}
        >
          {open ? "Close" : "Open"}
        </button>
      </div>

      <p className="assembler-utility-rail__hint">
        Press <kbd>/</kbd> to work on the current source, block, or staged assembly.
      </p>

      {open ? (
        <div className="assembler-utility-rail__body">
          <div className="assembler-utility-rail__presets">
            {["extract", "summarize", "synthesize", "evidence search"].map((label) => (
              <button
                key={label}
                type="button"
                className="assembler-utility-rail__preset"
                onClick={() => onPreset(label)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="assembler-utility-rail__scope" role="tablist" aria-label="AI scope">
            {scopeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`assembler-utility-rail__scope-button ${
                  scope === option.value ? "is-active" : ""
                }`}
                onClick={() => onScopeChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="assembler-utility-rail__field">
            <span className="assembler-utility-rail__prompt">&gt;</span>
            <input
              ref={inputRef}
              className="assembler-utility-rail__input"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onSubmit();
                }
              }}
              placeholder={pending ? "thinking…" : "ask about the working surface…"}
              disabled={pending}
            />
            <button
              type="button"
              className="assembler-utility-rail__run"
              disabled={!value.trim() || pending}
              onClick={onSubmit}
            >
              {pending ? "Running…" : "Run"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
