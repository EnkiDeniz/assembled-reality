export default function WorkspaceGlyph({ kind = "box" }) {
  if (kind === "box") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M4.5 8.5 12 4l7.5 4.5v7L12 20l-7.5-4.5z" />
        <path d="M12 4v16" />
        <path d="m4.5 8.5 7.5 4.5 7.5-4.5" />
      </svg>
    );
  }

  if (kind === "open") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M8 8h8v8" />
        <path d="m8 16 8-8" />
        <path d="M6 12v5.5h12V6H12" />
      </svg>
    );
  }

  if (kind === "seed") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M12 4.5c4.4 0 7 2.9 7 7.2 0 4.7-3.4 7.8-7 7.8s-7-3.1-7-7.8c0-4.3 2.6-7.2 7-7.2Z" />
        <path d="M12 8.5c1.8 1.6 2.7 3.5 2.7 5.8" />
      </svg>
    );
  }

  if (kind === "paste") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <rect x="7" y="4.5" width="10" height="15" rx="1.8" />
        <path d="M9.5 3.5h5" />
        <path d="M9.5 9.5h5" />
        <path d="M9.5 13h5" />
      </svg>
    );
  }

  if (kind === "photo") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M5 8.5h14v10H5z" />
        <path d="M9 8.5 10.5 6h3L15 8.5" />
        <circle cx="12" cy="13.5" r="2.8" />
      </svg>
    );
  }

  if (kind === "speak") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <rect x="9" y="3.5" width="6" height="10" rx="3" />
        <path d="M6.5 10.5a5.5 5.5 0 0 0 11 0" />
        <path d="M12 16v4" />
        <path d="M8.5 20h7" />
      </svg>
    );
  }

  if (kind === "link") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M10 14 7.8 16.2a3 3 0 1 1-4.2-4.2L5.8 9.8A3 3 0 0 1 10 10" />
        <path d="m14 10 2.2-2.2a3 3 0 1 1 4.2 4.2L18.2 14.2A3 3 0 0 1 14 14" />
        <path d="M8.5 15.5 15.5 8.5" />
      </svg>
    );
  }

  if (kind === "listen") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="m9 7 8 5-8 5z" />
        <path d="M5 6.5v11" />
      </svg>
    );
  }

  if (kind === "seven") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M5.5 6.5h13" />
        <path d="M8 17.5 16 6.5" />
      </svg>
    );
  }

  if (kind === "receipt") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M7.5 5.5h9v13l-2-1.5-2 1.5-2-1.5-2 1.5z" />
        <path d="M9.5 9h5" />
        <path d="M9.5 12.5h5" />
      </svg>
    );
  }

  if (kind === "pin") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="m8 5 8 4-2 2.5v3L10.5 16 9 20l-1.5-4-3.5-1.5L7 11.5V8z" />
      </svg>
    );
  }

  if (kind === "archive") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M5 7h14v10H5z" />
        <path d="M4 7V4.5h16V7" />
        <path d="M10 12h4" />
      </svg>
    );
  }

  if (kind === "search") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <circle cx="11" cy="11" r="5.5" />
        <path d="m15 15 4 4" />
      </svg>
    );
  }

  if (kind === "manage") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <circle cx="12" cy="12" r="2.5" />
        <path d="M4.5 12h2.2" />
        <path d="M17.3 12h2.2" />
        <path d="m7 7 1.6 1.6" />
        <path d="m15.4 15.4 1.6 1.6" />
        <path d="M12 4.5v2.2" />
        <path d="M12 17.3v2.2" />
        <path d="m17 7-1.6 1.6" />
        <path d="m8.6 15.4-1.6 1.6" />
      </svg>
    );
  }

  if (kind === "plus") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    );
  }

  return null;
}
