import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileUp, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertContact } from "@shared/schema";

export function LeadImport() {
  const [pastedData, setPastedData] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (contacts: InsertContact[]) => {
      return await apiRequest("/api/contacts/import", {
        method: "POST",
        body: JSON.stringify({ contacts }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setImportedCount(data.length);
      setPastedData("");
      toast({
        title: "Success",
        description: `Imported ${data.length} contact(s) successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to import contacts. Please check the format.",
        variant: "destructive",
      });
    },
  });

  const parseCSVData = (csvText: string): InsertContact[] => {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) return [];

    const contacts: InsertContact[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(",").map(v => v.trim());
      if (values.length >= 4) {
        contacts.push({
          name: values[0],
          email: values[1],
          phone: values[2],
          company: values[3],
          status: values[4] || "new",
          avatarUrl: values[5] || undefined,
        });
      }
    }
    
    return contacts;
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.match(/\.(csv|txt)$/i)) {
      toast({
        title: "Invalid file",
        description: "Please upload a CSV or TXT file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const contacts = parseCSVData(text);
      if (contacts.length > 0) {
        importMutation.mutate(contacts);
      } else {
        toast({
          title: "No data found",
          description: "The file doesn't contain valid contact data",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handlePasteImport = () => {
    const contacts = parseCSVData(pastedData);
    if (contacts.length > 0) {
      importMutation.mutate(contacts);
    } else {
      toast({
        title: "Invalid format",
        description: "Please paste data in CSV format with headers",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Import Leads</h2>
      {importedCount > 0 && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          <div>
            <p className="font-medium text-green-900 dark:text-green-100">
              Import successful!
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              {importedCount} contact(s) have been imported.
            </p>
          </div>
        </div>
      )}
      <Tabs defaultValue="upload">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="upload" data-testid="tab-upload-file">
            Upload File
          </TabsTrigger>
          <TabsTrigger value="paste" data-testid="tab-paste-data">
            Paste Data
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-md p-12 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            data-testid="dropzone-file-upload"
          >
            <FileUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">
              Drag and drop your file here
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse for CSV files
            </p>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileInputChange}
              className="hidden"
              id="file-upload"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById("file-upload")?.click()}
              data-testid="button-browse-files"
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? "Importing..." : "Browse Files"}
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              <strong>Expected CSV format:</strong>
            </p>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
              Name, Email, Phone, Company, Status
              {"\n"}John Doe, john@example.com, 555-1234, Acme Corp, new
              {"\n"}Jane Smith, jane@example.com, 555-5678, Tech Inc, active
            </pre>
          </div>
        </TabsContent>
        <TabsContent value="paste" className="space-y-4">
          <Textarea
            placeholder="Paste your lead data here (CSV format)&#10;Name, Email, Phone, Company, Status&#10;John Doe, john@example.com, 555-1234, Acme Corp, new"
            className="min-h-[200px] font-mono text-sm"
            value={pastedData}
            onChange={(e) => setPastedData(e.target.value)}
            data-testid="textarea-paste-data"
          />
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handlePasteImport}
              disabled={!pastedData.trim() || importMutation.isPending}
              data-testid="button-import-pasted"
            >
              <Upload className="h-4 w-4 mr-2" />
              {importMutation.isPending ? "Importing..." : "Import Data"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setPastedData("")}
              data-testid="button-clear-pasted"
            >
              Clear
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
