import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Calculator } from "lucide-react";

export function QuickActions() {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div className="space-y-3">
        <Button className="w-full justify-start" data-testid="button-add-contact">
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
        <Button className="w-full justify-start" data-testid="button-add-deal">
          <Plus className="h-4 w-4 mr-2" />
          Add Deal
        </Button>
        <Button className="w-full justify-start" variant="outline" data-testid="button-quick-import">
          <Upload className="h-4 w-4 mr-2" />
          Import Leads
        </Button>
        <Button className="w-full justify-start" variant="outline" data-testid="button-quick-calculator">
          <Calculator className="h-4 w-4 mr-2" />
          Calculate Revenue
        </Button>
      </div>
    </Card>
  );
}
