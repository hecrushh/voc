import { execFileSync } from "node:child_process";

export type RepoSummary = {
  branch: string;
  head: string;
  status: string;
  recentCommits: string[];
};

export function summarizeRepoStatus(repoPath = process.env.VOC_REPO_PATH ?? "/opt/voc"): string {
  const summary = getLocalRepoSummary(repoPath);
  return [
    "Repo status, Sire:",
    "",
    `Branch: ${summary.branch}`,
    `HEAD: ${summary.head}`,
    `Working tree: ${summary.status || "clean"}`,
    "",
    "Recent commits:",
    summary.recentCommits.length > 0 ? summary.recentCommits.map((commit) => `- ${commit}`).join("\n") : "- none"
  ].join("\n");
}

export function getLocalRepoSummary(repoPath: string): RepoSummary {
  return {
    branch: git(repoPath, ["branch", "--show-current"]) || "unknown",
    head: git(repoPath, ["rev-parse", "--short", "HEAD"]) || "unknown",
    status: git(repoPath, ["status", "--short"]),
    recentCommits: git(repoPath, ["log", "--oneline", "-5"])
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
  };
}

export function isForbiddenGithubWriteRequest(text: string): boolean {
  return /\b(push|merge|create\s+pr|open\s+pr|pull\s+request|create\s+issue|close\s+issue|delete\s+branch|change\s+settings|modify\s+repo)\b/i.test(text);
}

function git(cwd: string, args: string[]): string {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}
