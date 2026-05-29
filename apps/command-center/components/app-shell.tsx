import Link from "next/link";
import { Activity, Archive, Bot, Database, Gauge, Network, Shield } from "lucide-react";

const nav = [
  { href: "/", label: "Strategic Overview", icon: Gauge },
  { href: "/agents", label: "Agent Board", icon: Bot },
  { href: "/missions", label: "Mission Registry", icon: Archive },
  { href: "/memory", label: "Memory Vault", icon: Database },
  { href: "/infrastructure", label: "Infrastructure", icon: Network }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-border bg-card/80 px-4 py-5 backdrop-blur xl:block">
        <div className="mb-8 border-b border-border pb-5">
          <div className="text-xs uppercase tracking-[0.32em] text-muted-foreground">VOC</div>
          <div className="mt-2 text-2xl font-semibold">Command Center</div>
          <div className="mt-2 text-sm text-muted-foreground">MVP v0.1 local command surface</div>
        </div>
        <nav className="space-y-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-5 left-4 right-4 rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
          <div className="mb-2 flex items-center gap-2 text-foreground">
            <Shield className="h-4 w-4 text-emerald-300" />
            Security posture
          </div>
          Local-first, read-only infrastructure checks. No autonomous agent execution.
        </div>
      </aside>
      <div className="xl:pl-72">
        <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Virtual Operations Command</div>
              <h1 className="text-xl font-semibold md:text-2xl">BERTHIER Operations Console</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
                <Activity className="h-3.5 w-3.5 text-emerald-300" />
                Dashboard only
              </span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5">Secrets hidden</span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5">No tools executed by agents</span>
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 xl:hidden">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
