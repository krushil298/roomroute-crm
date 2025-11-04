import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileUp } from "lucide-react";
import { useState } from "react";

export function LeadImport() {
  const [pastedData, setPastedData] = useState("");
  const [isDragging, setIsDragging] = useState(false);

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
    console.log("File dropped", e.dataTransfer.files);
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Import Leads</h2>
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
              or click to browse for CSV or Excel files
            </p>
            <Button variant="outline" data-testid="button-browse-files">
              Browse Files
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Supported formats: .csv, .xlsx (max 5MB)
          </p>
        </TabsContent>
        <TabsContent value="paste" className="space-y-4">
          <Textarea
            placeholder="Paste your lead data here (CSV format)&#10;Name, Email, Phone, Company&#10;John Doe, john@example.com, 555-1234, Acme Corp"
            className="min-h-[200px] resize-none font-mono text-sm"
            value={pastedData}
            onChange={(e) => setPastedData(e.target.value)}
            data-testid="textarea-paste-data"
          />
          <div className="flex gap-2">
            <Button className="flex-1" data-testid="button-import-pasted">
              <Upload className="h-4 w-4 mr-2" />
              Import Data
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
