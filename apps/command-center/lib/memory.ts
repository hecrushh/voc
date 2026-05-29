import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { MemoryFile, MemoryFileDetail } from "@/lib/types";

const VOC_ROOT = process.env.VOC_ROOT ?? "/opt/voc";
const allowedSections = ["docs", "memory"] as const;

function sectionRoot(section: "docs" | "memory") {
  return path.join(VOC_ROOT, section);
}

function normalizeRelativePath(value: string) {
  const normalized = path.normalize(value).replace(/^(\.\.(\/|\\|$))+/, "");
  return normalized.replace(/^\/+/, "");
}

function excerpt(content: string) {
  return content
    .replace(/^#\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}

export async function listMemoryFiles(): Promise<MemoryFile[]> {
  const files: MemoryFile[] = [];

  for (const section of allowedSections) {
    const root = sectionRoot(section);
    const entries = await readdir(root, { withFileTypes: true }).catch(() => []);

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) {
        continue;
      }

      const absolute = path.join(root, entry.name);
      const [metadata, content] = await Promise.all([stat(absolute), readFile(absolute, "utf8")]);

      files.push({
        id: `${section}/${entry.name}`,
        title: entry.name,
        section,
        path: `${section}/${entry.name}`,
        size: metadata.size,
        updated_at: metadata.mtime.toISOString(),
        excerpt: excerpt(content)
      });
    }
  }

  return files.sort((a, b) => a.path.localeCompare(b.path));
}

export async function getMemoryFile(filePath: string): Promise<MemoryFileDetail | null> {
  const normalized = normalizeRelativePath(filePath);
  const [section, ...rest] = normalized.split("/");

  if (!allowedSections.includes(section as "docs" | "memory") || rest.length === 0) {
    return null;
  }

  const safeSection = section as "docs" | "memory";
  const relative = rest.join("/");
  const absolute = path.join(sectionRoot(safeSection), relative);

  if (!absolute.startsWith(sectionRoot(safeSection)) || !absolute.endsWith(".md")) {
    return null;
  }

  try {
    const [metadata, content] = await Promise.all([stat(absolute), readFile(absolute, "utf8")]);

    return {
      id: `${safeSection}/${relative}`,
      title: path.basename(relative),
      section: safeSection,
      path: `${safeSection}/${relative}`,
      size: metadata.size,
      updated_at: metadata.mtime.toISOString(),
      excerpt: excerpt(content),
      content
    };
  } catch {
    return null;
  }
}
