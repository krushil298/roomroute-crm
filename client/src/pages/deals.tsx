import { DealCard } from "@/components/deal-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Deal, Contact } from "@shared/schema";
import { format } from "date-fns";

export default function Deals() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: deals = [], isLoading: dealsLoading } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const dealsWithContactNames = deals.map(deal => ({
    title: deal.title,
    value: Number(deal.value),
    stage: deal.stage,
    contact: contacts.find(c => c.id === deal.contactId)?.name || "No contact",
    closingDate: deal.expectedCloseDate ? format(new Date(deal.expectedCloseDate), "MMM dd, yyyy") : "No date",
    probability: deal.probability,
  }));

  const filteredDeals = searchQuery
    ? dealsWithContactNames.filter(deal =>
        deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.contact.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : dealsWithContactNames;

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

      {dealsLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading deals...
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? "No deals match your search" : "No deals yet. Click 'Add Deal' to create your first deal."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDeals.map((deal, index) => (
            <DealCard key={`${deal.title}-${index}`} {...deal} />
          ))}
        </div>
      )}
    </div>
  );
}
