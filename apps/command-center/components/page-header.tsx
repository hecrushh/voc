export function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-6">
      <div className="text-xs font-medium uppercase tracking-[0.24em] text-primary">{eyebrow}</div>
      <h2 className="mt-2 text-2xl font-semibold md:text-3xl">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
