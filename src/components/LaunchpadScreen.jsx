export default function LaunchpadScreen({ toolbar = null, children, style = undefined }) {
  return (
    <section
      className="assembler-surface assembler-surface--launchpad loegos-screen loegos-screen--launchpad"
      style={style}
    >
      {toolbar}
      {children}
    </section>
  );
}
