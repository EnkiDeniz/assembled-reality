import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

function StarterAction({
  label,
  detail,
  primary = false,
  pending = false,
  testId = "",
  onClick,
}) {
  return (
    <button
      type="button"
      className={`assembler-starter__action ${primary ? "is-primary" : ""}`}
      data-testid={testId || undefined}
      onClick={onClick}
      disabled={pending}
    >
      <span className="assembler-starter__action-label">{label}</span>
      <span className="assembler-starter__action-detail">{detail}</span>
    </button>
  );
}

export default function WorkspaceStarter({
  scopedProject = null,
  pending = false,
  onAddSource,
  onOpenBoxes,
  onStartFresh,
}) {
  const scopedBoxTitle =
    scopedProject?.boxTitle || scopedProject?.title || "Untitled Box";
  const scoped = Boolean(scopedProject?.projectKey);

  return (
    <section className="assembler-starter" data-testid="workspace-starter">
      <div className="assembler-starter__panel">
        <header className="assembler-starter__header">
          <div className="assembler-starter__copy">
            <span className="assembler-starter__eyebrow">
              {scoped ? "Starter" : "Workspace"}
            </span>
            <h1 className="assembler-starter__title">Start with a source.</h1>
            <p className="assembler-starter__subtitle">
              See the text as captured, listen to it as-is, then move into the
              Lœgos flow when you are ready.
            </p>
            {scoped ? (
              <p className="assembler-starter__scope">
                Current box: <strong>{scopedBoxTitle}</strong>
              </p>
            ) : null}
          </div>

          <div className="assembler-starter__session" aria-label="Account and session">
            <Link
              href="/account"
              className="assembler-starter__session-link"
              data-testid="workspace-starter-account-link"
            >
              Account
            </Link>
            <SignOutButton
              className="assembler-starter__session-signout"
            >
              Sign out
            </SignOutButton>
          </div>
        </header>

        <div className="assembler-starter__actions">
          <StarterAction
            primary
            pending={pending}
            testId="workspace-starter-add-source"
            label={pending && !scoped ? "Preparing box…" : "Add source"}
            detail={
              scoped
                ? `Import into ${scopedBoxTitle}, then read and listen before shaping the seed.`
                : "Create a fresh box first, then upload, paste, link, or speak."
            }
            onClick={onAddSource}
          />
          <StarterAction
            pending={pending}
            testId="workspace-starter-open-box"
            label="Open box"
            detail="Browse an existing box and enter from its calmer home screen."
            onClick={onOpenBoxes}
          />
          <StarterAction
            pending={pending}
            testId="workspace-starter-start-fresh"
            label={pending ? "Creating box…" : "Start fresh"}
            detail="Create a new Untitled Box and stay here until you are ready to add something."
            onClick={onStartFresh}
          />
        </div>

        <footer className="assembler-starter__footer">
          <p>
            This MVP is intentionally source-first: add one real thing, read it,
            listen to it, then take the next step into seed shaping.
          </p>
        </footer>
      </div>
    </section>
  );
}
