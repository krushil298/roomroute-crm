import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Contact } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function RevenueCalculator() {
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [rooms, setRooms] = useState("6");
  const [nightsPerWeek, setNightsPerWeek] = useState("4");
  const [weeks, setWeeks] = useState("8");
  const [pricePerNight, setPricePerNight] = useState("99");
  const { toast } = useToast();

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const calculateRevenue = () => {
    const r = parseFloat(rooms) || 0;
    const n = parseFloat(nightsPerWeek) || 0;
    const w = parseFloat(weeks) || 0;
    const p = parseFloat(pricePerNight) || 0;
    return r * n * w * p;
  };

  const revenue = calculateRevenue();

  const saveToLeadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLeadId) {
        throw new Error("Please select a lead");
      }
      
      // Update the contact with the estimated room nights and potential value (lead pipeline)
      const totalRoomNights = (parseFloat(rooms) || 0) * (parseFloat(nightsPerWeek) || 0) * (parseFloat(weeks) || 0);
      const response = await apiRequest("PATCH", `/api/contacts/${selectedLeadId}`, {
        estRoomNights: Math.round(totalRoomNights),
        potentialValue: revenue.toString(),
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Success",
        description: "Lead potential value saved",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save to lead",
        variant: "destructive",
      });
    },
  });

  const saveToDealMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLeadId) {
        throw new Error("Please select a lead to create a deal");
      }
      const selectedContact = contacts.find(c => c.id === selectedLeadId);
      const response = await apiRequest("POST", "/api/deals", {
        title: `Deal - ${selectedContact?.leadOrProject || "Unknown"}`,
        contactId: selectedLeadId,
        value: revenue.toString(),
        stage: "lead",
        probability: 25,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({
        title: "Success",
        description: "Deal created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create deal",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <DollarSign className="h-5 w-5" />
        Potential Revenue Calculator
      </h2>
      
      <div className="space-y-2 mb-6">
        <Label htmlFor="lead-select" className="text-xs font-medium uppercase tracking-wide">
          Lead Name
        </Label>
        <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
          <SelectTrigger id="lead-select" data-testid="select-lead">
            <SelectValue placeholder="Select a lead..." />
          </SelectTrigger>
          <SelectContent>
            {contacts.map((contact) => (
              <SelectItem key={contact.id} value={contact.id}>
                {contact.leadOrProject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="rooms" className="text-xs font-medium uppercase tracking-wide">
            Rooms
          </Label>
          <Input
            id="rooms"
            type="number"
            value={rooms}
            onChange={(e) => setRooms(e.target.value)}
            placeholder="6"
            data-testid="input-rooms"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nights" className="text-xs font-medium uppercase tracking-wide">
            Nights/Week
          </Label>
          <Input
            id="nights"
            type="number"
            value={nightsPerWeek}
            onChange={(e) => setNightsPerWeek(e.target.value)}
            placeholder="4"
            data-testid="input-nights-per-week"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weeks" className="text-xs font-medium uppercase tracking-wide">
            Weeks
          </Label>
          <Input
            id="weeks"
            type="number"
            value={weeks}
            onChange={(e) => setWeeks(e.target.value)}
            placeholder="8"
            data-testid="input-weeks"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price" className="text-xs font-medium uppercase tracking-wide">
            Price/Night
          </Label>
          <Input
            id="price"
            type="number"
            value={pricePerNight}
            onChange={(e) => setPricePerNight(e.target.value)}
            placeholder="99"
            data-testid="input-price-per-night"
          />
        </div>
      </div>
      <div className="bg-primary/10 border border-primary/20 rounded-md p-6 mb-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
          Potential Revenue
        </p>
        <p className="text-4xl font-bold text-primary tabular-nums" data-testid="text-calculated-revenue">
          ${revenue.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Total Room Nights: {Math.round((parseFloat(rooms) || 0) * (parseFloat(nightsPerWeek) || 0) * (parseFloat(weeks) || 0))}
        </p>
      </div>
      
      <div className="flex gap-2">
        <Button 
          className="flex-1" 
          variant="outline"
          onClick={() => saveToLeadMutation.mutate()}
          disabled={saveToLeadMutation.isPending || !selectedLeadId}
          data-testid="button-save-to-lead"
        >
          {saveToLeadMutation.isPending ? "Saving..." : "Save to Lead"}
        </Button>
        <Button 
          className="flex-1"
          onClick={() => saveToDealMutation.mutate()}
          disabled={saveToDealMutation.isPending || !selectedLeadId}
          data-testid="button-save-to-deal"
        >
          {saveToDealMutation.isPending ? "Creating..." : "Save to Deal"}
        </Button>
      </div>
    </Card>
  );
}
