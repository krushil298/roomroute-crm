import { RevenueCalculator } from "@/components/revenue-calculator";

export default function Calculator() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Revenue Calculator</h1>
        <p className="text-sm text-muted-foreground">
          Calculate potential revenue for your deals
        </p>
      </div>

      <div className="max-w-2xl">
        <RevenueCalculator />
      </div>
    </div>
  );
}
