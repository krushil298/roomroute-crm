import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileUp, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface ImportContact {
  leadOrProject: string;
  company: string | null;
  segment: string;
  primaryContact: string | null;
  email: string | null;
  phone: string | null;
  estRoomNights: number | null;
  avatarUrl: string | null;
}

export function LeadImport() {
  const [pastedData, setPastedData] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (contacts: ImportContact[]) => {
      const response = await apiRequest("POST", "/api/contacts/import", { contacts });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Import failed");
      }
      return await response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setImportedCount(data.imported || data.length || 0);
      setPastedData("");
      toast({
        title: "Success",
        description: `Imported ${data.imported || data.length || 0} lead(s) successfully`,
      });
    },
    onError: (error: Error) => {
      console.error("Import error:", error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import leads. Please check the format.",
        variant: "destructive",
      });
    },
  });

  const normalizeColumnName = (name: string): string => {
    return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  };

  const mapColumnValue = (row: any, possibleKeys: string[]): string | null => {
    for (const key of possibleKeys) {
      const normalizedKey = normalizeColumnName(key);
      for (const rowKey in row) {
        if (normalizeColumnName(rowKey) === normalizedKey) {
          const value = row[rowKey];
          return value !== undefined && value !== null && value !== "" ? String(value).trim() : null;
        }
      }
    }
    return null;
  };

  const parseExcelData = (file: File): Promise<ImportContact[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          if (jsonData.length === 0) {
            resolve([]);
            return;
          }

          const contacts: ImportContact[] = jsonData.map((row: any) => {
            const leadOrProject = mapColumnValue(row, ["Lead or Project", "Lead or Company Name", "Project", "Lead"]) || "Unnamed Lead";
            const company = mapColumnValue(row, ["Company", "Lead or Company Name"]);
            const segment = mapColumnValue(row, ["Segment", "Business Segment"]) || "Other";
            const primaryContact = mapColumnValue(row, ["Primary Contact", "Contact", "Name"]);
            const phone = mapColumnValue(row, ["Contact Phone", "Phone"]);
            const email = mapColumnValue(row, ["Contact Email", "Email"]);
            const estRoomNightsStr = mapColumnValue(row, ["Est Room Nights", "Estimated Room Nights", "Room Nights"]);
            const estRoomNights = estRoomNightsStr ? parseInt(estRoomNightsStr, 10) : null;

            return {
              leadOrProject,
              company,
              segment,
              primaryContact,
              email,
              phone,
              estRoomNights: estRoomNights && !isNaN(estRoomNights) ? estRoomNights : null,
              avatarUrl: null,
            };
          });

          resolve(contacts);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const parseCSVData = (csvText: string): ImportContact[] => {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) return [];

    // Parse header row
    const headers = lines[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.trim().replace(/^"|"$/g, ''));
    const contacts: ImportContact[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
      
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      const leadOrProject = mapColumnValue(row, ["Lead or Project", "Lead or Company Name", "Project", "Lead"]) || "Unnamed Lead";
      const company = mapColumnValue(row, ["Company", "Lead or Company Name"]);
      const segment = mapColumnValue(row, ["Segment", "Business Segment"]) || "Other";
      const primaryContact = mapColumnValue(row, ["Primary Contact", "Contact", "Name"]);
      const phone = mapColumnValue(row, ["Contact Phone", "Phone"]);
      const email = mapColumnValue(row, ["Contact Email", "Email"]);
      const estRoomNightsStr = mapColumnValue(row, ["Est Room Nights", "Estimated Room Nights", "Room Nights"]);
      const estRoomNights = estRoomNightsStr ? parseInt(estRoomNightsStr, 10) : null;

      contacts.push({
        leadOrProject,
        company,
        segment,
        primaryContact,
        email,
        phone,
        estRoomNights: estRoomNights && !isNaN(estRoomNights) ? estRoomNights : null,
        avatarUrl: null,
      });
    }
    
    return contacts;
  };

  const handleFileUpload = async (file: File) => {
    const isExcel = file.name.match(/\.(xlsx|xls)$/i);
    const isCSV = file.name.match(/\.(csv|txt)$/i);

    if (!isExcel && !isCSV) {
      toast({
        title: "Invalid file",
        description: "Please upload a CSV or Excel (.xlsx) file",
        variant: "destructive",
      });
      return;
    }

    try {
      let contacts: ImportContact[];

      if (isExcel) {
        contacts = await parseExcelData(file);
      } else {
        const reader = new FileReader();
        contacts = await new Promise((resolve, reject) => {
          reader.onload = (e) => {
            const text = e.target?.result as string;
            resolve(parseCSVData(text));
          };
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsText(file);
        });
      }

      if (contacts.length > 0) {
        importMutation.mutate(contacts);
      } else {
        toast({
          title: "No data found",
          description: "The file doesn't contain valid lead data",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse file. Please check the format.",
        variant: "destructive",
      });
    }
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
              {importedCount} lead(s) have been imported.
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
              or click to browse for CSV or Excel files
            </p>
            <input
              type="file"
              accept=".csv,.txt,.xlsx,.xls"
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
              <strong>Expected column headers:</strong>
            </p>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
              Lead or Project | Company | Segment | Primary Contact | Contact Phone | Contact Email | Est Room Nights
            </pre>
            <p className="text-xs text-muted-foreground">
              Note: Segment can be any text value (e.g., "Corporate/Distribution", "Construction/Industrial", "SMERF/Weddings")
            </p>
          </div>
        </TabsContent>
        <TabsContent value="paste" className="space-y-4">
          <Textarea
            placeholder="Paste your lead data here (semicolon-separated format)&#10;Lead or Project; Company; Segment; Primary Contact; Contact Phone; Contact Email; Est Room Nights&#10;Bridge rebuild on I-65; DOT Contractors; Construction; John Doe; 555-1234; john@example.com; 50"
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
