import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";
import { useState } from "react";

export function RevenueCalculator() {
  const [rooms, setRooms] = useState("6");
  const [nightsPerWeek, setNightsPerWeek] = useState("4");
  const [weeks, setWeeks] = useState("8");
  const [pricePerNight, setPricePerNight] = useState("99");

  const calculateRevenue = () => {
    const r = parseFloat(rooms) || 0;
    const n = parseFloat(nightsPerWeek) || 0;
    const w = parseFloat(weeks) || 0;
    const p = parseFloat(pricePerNight) || 0;
    return r * n * w * p;
  };

  const revenue = calculateRevenue();

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <DollarSign className="h-5 w-5" />
        Potential Revenue Calculator
      </h2>
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
      </div>
      <Button className="w-full" data-testid="button-save-calculation">
        Save to Deal
      </Button>
    </Card>
  );
}
