"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, StatusBadge } from "@/components/ui";
import type { MemoryFile, MemoryFileDetail } from "@/lib/types";

export function MemoryVault({ files }: { files: MemoryFile[] }) {
  const [selected, setSelected] = useState<MemoryFileDetail | null>(null);
  const [loading, setLoading] = useState(false);

  async function openFile(file: MemoryFile) {
    setLoading(true);
    const response = await fetch(`/api/memory?path=${encodeURIComponent(file.path)}`);
    const payload = (await response.json()) as { file?: MemoryFileDetail };
    setSelected(payload.file ?? null);
    setLoading(false);
  }

  const grouped = {
    docs: files.filter((file) => file.section === "docs"),
    memory: files.filter((file) => file.section === "memory")
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
      <div className="space-y-4">
        {Object.entries(grouped).map(([section, sectionFiles]) => (
          <Card key={section}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{section}</CardTitle>
              <StatusBadge status="online" />
            </CardHeader>
            <CardContent className="space-y-3">
              {sectionFiles.map((file) => (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => openFile(file)}
                  className="block w-full rounded-md border border-border bg-background p-4 text-left transition hover:border-primary/60"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium">{file.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{file.path}</div>
                      <div className="mt-2 line-clamp-2 text-sm text-muted-foreground">{file.excerpt}</div>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="min-h-[520px]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Read-only preview</CardTitle>
          <span className="text-xs text-muted-foreground">Secrets are not sourced from these files by the UI</span>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading document...</div>
          ) : selected ? (
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{selected.title}</h3>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {selected.path} · {(selected.size / 1024).toFixed(1)} KiB · {new Date(selected.updated_at).toLocaleString()}
                  </div>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={() => setSelected(null)}>
                  Clear
                </Button>
              </div>
              <pre className="max-h-[650px] overflow-auto rounded-md border border-border bg-background p-4 text-sm leading-6 text-muted-foreground whitespace-pre-wrap">
                {selected.content}
              </pre>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
              Select a markdown file from `/opt/voc/docs` or `/opt/voc/memory` to inspect it. This explorer is intentionally read-only in v0.1.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
