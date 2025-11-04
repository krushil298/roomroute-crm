import { DealCard } from "../deal-card";

export default function DealCardExample() {
  return (
    <div className="p-6 max-w-sm">
      <DealCard
        title="Enterprise Software License"
        value={45000}
        stage="Negotiation"
        contact="Sarah Johnson"
        closingDate="Dec 15, 2025"
        probability={75}
      />
    </div>
  );
}
