const VARIANT_COPY = {
  library: {
    eyebrow: "Private library",
    title: "Library",
    description: "Loading your reading progress, core text, and personal documents.",
  },
  account: {
    eyebrow: "Assembled Reality",
    title: "Account",
    description: "Loading your profile, reading snapshot, and connected tools.",
  },
  reader: {
    eyebrow: "Assembled Reality",
    title: "Preparing reader",
    description: "Loading the document, listening state, annotations, and workspace.",
  },
};

const VARIANT_SHELL_CLASS = {
  library: "library-shell library-shell--authenticated-reset",
  account: "account-shell account-shell--authenticated-reset",
  reader: "reader-shell reader-shell--authenticated-reset",
};

export default function AuthenticatedAppFallback({ variant = "library" }) {
  const copy = VARIANT_COPY[variant] || VARIANT_COPY.library;
  const shellClassName = VARIANT_SHELL_CLASS[variant] || VARIANT_SHELL_CLASS.library;

  return (
    <main className={shellClassName}>
      <div className="auth-loading">
        <section className="auth-loading__panel" aria-live="polite">
          <p className="auth-loading__eyebrow">{copy.eyebrow}</p>
          <h1 className="auth-loading__title">{copy.title}</h1>
          <p className="auth-loading__description">{copy.description}</p>
          <div className="auth-loading__meter" aria-hidden="true">
            <span className="auth-loading__meter-fill" />
          </div>
        </section>
      </div>
    </main>
  );
}
