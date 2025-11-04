import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Calculator } from "lucide-react";
import { useLocation } from "wouter";

export function QuickActions() {
  const [, setLocation] = useLocation();

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div className="space-y-3">
        <Button 
          className="w-full justify-start" 
          data-testid="button-add-contact"
          onClick={() => setLocation("/contacts")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
        <Button 
          className="w-full justify-start" 
          data-testid="button-add-deal"
          onClick={() => setLocation("/deals")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Deal
        </Button>
        <Button 
          className="w-full justify-start" 
          variant="outline" 
          data-testid="button-quick-import"
          onClick={() => setLocation("/import")}
        >
          <Upload className="h-4 w-4 mr-2" />
          Import Leads
        </Button>
        <Button 
          className="w-full justify-start" 
          variant="outline" 
          data-testid="button-quick-calculator"
          onClick={() => setLocation("/calculator")}
        >
          <Calculator className="h-4 w-4 mr-2" />
          Calculate Revenue
        </Button>
      </div>
    </Card>
  );
}
