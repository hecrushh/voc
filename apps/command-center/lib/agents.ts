import type { Agent } from "@/lib/types";

export const agents: Agent[] = [
  {
    id: "berthier",
    name: "BERTHIER",
    title: "Chief of Staff / Orchestrator",
    domain: "Command coordination",
    status: "Offline / Planned",
    responsibilities: ["Command overview", "Mission triage", "Strategic memory", "Approval discipline"],
    constraints: ["No autonomous execution in v0.1", "Reports only dashboard state"]
  },
  {
    id: "soult",
    name: "SOULT",
    title: "Chief Product Strategist",
    domain: "Product planning",
    status: "Offline / Planned",
    responsibilities: ["PRDs", "Roadmaps", "Feature priority", "Tradeoff analysis"],
    constraints: ["Role definition only", "No product worker process"]
  },
  {
    id: "ney",
    name: "NEY",
    title: "Frontend",
    domain: "Command Center UI",
    status: "Offline / Planned",
    responsibilities: ["Frontend architecture", "Responsive UI", "UX review", "Component planning"],
    constraints: ["Role definition only", "No repository automation"]
  },
  {
    id: "lannes",
    name: "LANNES",
    title: "Backend",
    domain: "API and persistence",
    status: "Offline / Planned",
    responsibilities: ["REST API", "SQLite schema", "Adapter contracts", "Service boundaries"],
    constraints: ["Read-only integrations", "No external calls requiring secrets"]
  },
  {
    id: "davout",
    name: "DAVOUT",
    title: "Security",
    domain: "Security posture",
    status: "Offline / Planned",
    responsibilities: ["Threat review", "Secret handling", "Approval gates", "Dashboard exposure"],
    constraints: ["No secret display", "No public exposure before auth"]
  },
  {
    id: "massena",
    name: "MASSÉNA",
    title: "DevOps",
    domain: "VPS operations",
    status: "Offline / Planned",
    responsibilities: ["VPS status", "Docker runtime", "Backups", "Lightweight monitoring"],
    constraints: ["Read-only status checks", "No service mutation"]
  },
  {
    id: "murat",
    name: "MURAT",
    title: "Marketing",
    domain: "Positioning and launch",
    status: "Offline / Planned",
    responsibilities: ["Messaging", "Campaign plans", "Launch posture", "Brand narrative"],
    constraints: ["Drafting only in future", "No publishing automation"]
  },
  {
    id: "caulaincourt",
    name: "CAULAINCOURT",
    title: "Intelligence",
    domain: "Research and analysis",
    status: "Offline / Planned",
    responsibilities: ["Research briefs", "Competitor review", "Technology evaluation", "Market intelligence"],
    constraints: ["No web research worker in v0.1", "No external data ingestion"]
  },
  {
    id: "colbert",
    name: "COLBERT",
    title: "Finance",
    domain: "Cost and resource planning",
    status: "Offline / Planned",
    responsibilities: ["Cost reports", "Budget planning", "Resource allocation", "Spend forecasting"],
    constraints: ["No billing integrations", "No financial account access"]
  },
  {
    id: "imperial-guard",
    name: "IMPERIAL GUARD",
    title: "Automation Command",
    domain: "Controlled automation",
    status: "Offline / Planned",
    responsibilities: ["Future SKP workflows", "Future Playwright jobs", "Scheduled workflows", "Run logs"],
    constraints: ["Inactive until approvals exist", "No automation execution in v0.1"]
  }
];
