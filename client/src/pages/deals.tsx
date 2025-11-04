import { DealCard } from "@/components/deal-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

export default function Deals() {
  const [searchQuery, setSearchQuery] = useState("");

  const deals = [
    {
      title: "Enterprise Software License",
      value: 45000,
      stage: "Negotiation",
      contact: "Sarah Johnson",
      closingDate: "Dec 15, 2025",
      probability: 75,
    },
    {
      title: "Cloud Migration Project",
      value: 28000,
      stage: "Qualified",
      contact: "Mike Chen",
      closingDate: "Jan 10, 2026",
      probability: 60,
    },
    {
      title: "Website Redesign",
      value: 15000,
      stage: "Proposal",
      contact: "Emily Rodriguez",
      closingDate: "Dec 20, 2025",
      probability: 50,
    },
    {
      title: "Mobile App Development",
      value: 35000,
      stage: "New",
      contact: "David Kim",
      closingDate: "Feb 1, 2026",
      probability: 30,
    },
    {
      title: "Consulting Package",
      value: 12000,
      stage: "Closed",
      contact: "Lisa Anderson",
      closingDate: "Nov 30, 2025",
      probability: 100,
    },
    {
      title: "Annual Support Contract",
      value: 24000,
      stage: "Negotiation",
      contact: "James Wilson",
      closingDate: "Dec 31, 2025",
      probability: 80,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Deals</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage your opportunities
          </p>
        </div>
        <Button data-testid="button-add-new-deal">
          <Plus className="h-4 w-4 mr-2" />
          Add Deal
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search deals..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-deals"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deals.map((deal) => (
          <DealCard key={deal.title} {...deal} />
        ))}
      </div>
    </div>
  );
}
