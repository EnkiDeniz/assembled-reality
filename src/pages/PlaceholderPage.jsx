export default function PlaceholderPage({ title, description }) {
  return (
    <div className="max-w-[640px] mx-auto pt-20 px-5 pb-20">
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <p className="text-body text-ink-tertiary mb-8">{description}</p>
      <div className="p-6 bg-surface-raised border border-border rounded-[4px] text-center">
        <div className="text-ink-muted text-md">Coming soon</div>
      </div>
    </div>
  );
}
