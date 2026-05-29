import { PageHeader } from "@/components/page-header";
import { listMemoryFiles } from "@/lib/memory";
import { MemoryVault } from "./memory-vault";

export const dynamic = "force-dynamic";

export default async function MemoryPage() {
  const files = await listMemoryFiles();

  return (
    <>
      <PageHeader
        eyebrow="Memory Vault"
        title="Documentation and strategic memory"
        description="Read-only explorer for `/opt/voc/docs` and `/opt/voc/memory`. Editing memory through the dashboard is intentionally deferred."
      />
      <MemoryVault files={files} />
    </>
  );
}
