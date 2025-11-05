import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Contact } from "@shared/schema";

interface OutreachDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
}

interface OutreachAttempt {
  date: string;
  method: string;
  notes: string;
}

const CONTACT_METHODS = ["Call", "Email", "Text", "In-Person", "LinkedIn", "Other"];

export function OutreachDialog({ open, onOpenChange, contact }: OutreachDialogProps) {
  const { toast } = useToast();
  const [attempts, setAttempts] = useState<OutreachAttempt[]>([
    { date: new Date().toISOString().split('T')[0], method: "", notes: "" },
    { date: "", method: "", notes: "" },
  ]);
  const [additionalNotes, setAdditionalNotes] = useState("");

  const mapMethodToActivityType = (method: string): string => {
    const methodMap: Record<string, string> = {
      "Call": "call",
      "Email": "email",
      "Text": "email", // Using email as SMS/text type
      "In-Person": "meeting",
      "LinkedIn": "email", // LinkedIn messages mapped to email
      "Other": "note",
    };
    return methodMap[method] || "note";
  };

  const saveOutreachMutation = useMutation({
    mutationFn: async () => {
      const validAttempts = attempts.filter(a => a.date && a.method);
      
      if (validAttempts.length === 0 && !additionalNotes) {
        throw new Error("Please add at least one outreach attempt or notes");
      }

      // Save each attempt as an activity with proper type
      for (const attempt of validAttempts) {
        const description = attempt.notes 
          ? `${attempt.method}: ${attempt.notes}` 
          : attempt.method;
        
        await apiRequest("POST", "/api/activities", {
          contactId: contact.id,
          type: mapMethodToActivityType(attempt.method),
          description,
        });
      }

      // If there are additional notes, save them as a note activity
      if (additionalNotes) {
        await apiRequest("POST", "/api/activities", {
          contactId: contact.id,
          type: "note",
          description: additionalNotes,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Success",
        description: "Outreach logged successfully",
      });
      onOpenChange(false);
      setAttempts([
        { date: new Date().toISOString().split('T')[0], method: "", notes: "" },
        { date: "", method: "", notes: "" },
      ]);
      setAdditionalNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log outreach",
        variant: "destructive",
      });
    },
  });

  const updateAttempt = (index: number, field: keyof OutreachAttempt, value: string) => {
    const newAttempts = [...attempts];
    newAttempts[index] = { ...newAttempts[index], [field]: value };
    setAttempts(newAttempts);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log Outreach - {contact.leadOrProject}</DialogTitle>
          <DialogDescription>
            Record your outreach attempts and notes for this lead
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {attempts.map((attempt, index) => (
            <div key={index} className="border rounded-md p-4 space-y-3">
              <h4 className="font-medium text-sm">Outreach Attempt {index + 1}</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor={`date-${index}`}>Date</Label>
                  <Input
                    id={`date-${index}`}
                    type="date"
                    value={attempt.date}
                    onChange={(e) => updateAttempt(index, "date", e.target.value)}
                    data-testid={`input-outreach-date-${index}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`method-${index}`}>Contact Method</Label>
                  <Select
                    value={attempt.method}
                    onValueChange={(value) => updateAttempt(index, "method", value)}
                  >
                    <SelectTrigger id={`method-${index}`} data-testid={`select-outreach-method-${index}`}>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACT_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`notes-${index}`}>Notes</Label>
                <Textarea
                  id={`notes-${index}`}
                  placeholder="What was discussed, next steps, etc."
                  value={attempt.notes}
                  onChange={(e) => updateAttempt(index, "notes", e.target.value)}
                  data-testid={`textarea-outreach-notes-${index}`}
                  rows={3}
                />
              </div>
            </div>
          ))}

          <div className="space-y-2">
            <Label htmlFor="additional-notes">Additional Notes</Label>
            <Textarea
              id="additional-notes"
              placeholder="General notes, follow-up reminders, or other comments about this lead..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              data-testid="textarea-additional-notes"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-outreach"
            >
              Cancel
            </Button>
            <Button
              onClick={() => saveOutreachMutation.mutate()}
              disabled={saveOutreachMutation.isPending}
              data-testid="button-save-outreach"
            >
              {saveOutreachMutation.isPending ? "Saving..." : "Save Outreach"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
