import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

type ReportsPageProps = {
  searchParams: Promise<{ file?: string }>;
};

type ReportFile = {
  name: string;
  path: string;
  size: number;
  updated_at: string;
};

const VOC_ROOT = process.env.VOC_ROOT ?? "/opt/voc";
const REPORTS_DIR = join(VOC_ROOT, "reports");

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const reports = listReports();
  const selectedName = safeReportName(params.file) ?? reports[0]?.name ?? null;
  const selected = selectedName ? reports.find((report) => report.name === selectedName) ?? null : null;
  const content = selected ? readFileSync(selected.path, "utf8") : "No reports are available.";

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="BERTHIER report viewer"
        description="Read-only viewer for Markdown reports in /opt/voc/reports. This page renders report text only and performs no command execution."
      />

      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Report list</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reports.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">No report files found.</div>
            ) : (
              reports.map((report) => (
                <Link
                  key={report.name}
                  href={`/reports?file=${encodeURIComponent(report.name)}`}
                  className={`block rounded-md border p-3 text-sm transition hover:bg-muted ${report.name === selectedName ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background text-muted-foreground"}`}
                >
                  <div className="font-medium text-foreground">{report.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{formatBytes(report.size)} · {new Date(report.updated_at).toLocaleString()}</div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selected?.name ?? "No report selected"}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-md border border-border bg-background p-4 text-sm leading-6 text-muted-foreground">
              {content}
            </pre>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function listReports(): ReportFile[] {
  try {
    return readdirSync(REPORTS_DIR)
      .filter((name) => name.endsWith(".md"))
      .map((name) => {
        const path = join(REPORTS_DIR, name);
        const stats = statSync(path);
        return {
          name,
          path,
          size: stats.size,
          updated_at: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

function safeReportName(name: string | undefined): string | null {
  if (!name) {
    return null;
  }
  const safe = basename(name);
  return safe.endsWith(".md") ? safe : null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}
