import { LeadImport } from "@/components/lead-import";

export default function Import() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Import Leads</h1>
        <p className="text-sm text-muted-foreground">
          Upload a file or paste data to import leads into your CRM
        </p>
      </div>

      <div className="max-w-3xl">
        <LeadImport />
      </div>
    </div>
  );
}
