import { ContactCard } from "@/components/contact-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import avatar1 from "@assets/generated_images/Professional_business_avatar_a916c4b1.png";
import avatar2 from "@assets/generated_images/Female_professional_avatar_13893438.png";
import avatar3 from "@assets/generated_images/Male_executive_avatar_ee69fb7d.png";
import avatar4 from "@assets/generated_images/Team_member_avatar_d18ec3f3.png";

export default function Contacts() {
  const [searchQuery, setSearchQuery] = useState("");

  const contacts = [
    {
      name: "Sarah Johnson",
      email: "sarah.j@acmecorp.com",
      phone: "+1 (555) 123-4567",
      company: "Acme Corporation",
      status: "active" as const,
      avatarUrl: avatar1,
    },
    {
      name: "Mike Chen",
      email: "mike.chen@techstart.io",
      phone: "+1 (555) 234-5678",
      company: "TechStart Inc",
      status: "new" as const,
      avatarUrl: avatar2,
    },
    {
      name: "Emily Rodriguez",
      email: "emily.r@globalsoft.com",
      phone: "+1 (555) 345-6789",
      company: "GlobalSoft",
      status: "active" as const,
      avatarUrl: avatar3,
    },
    {
      name: "David Kim",
      email: "david@innovate.co",
      phone: "+1 (555) 456-7890",
      company: "Innovate Co",
      status: "cold" as const,
      avatarUrl: avatar4,
    },
    {
      name: "Lisa Anderson",
      email: "l.anderson@enterprise.com",
      phone: "+1 (555) 567-8901",
      company: "Enterprise Solutions",
      status: "active" as const,
      avatarUrl: avatar1,
    },
    {
      name: "James Wilson",
      email: "jwilson@startup.io",
      phone: "+1 (555) 678-9012",
      company: "Startup IO",
      status: "new" as const,
      avatarUrl: avatar2,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            Manage your customer relationships
          </p>
        </div>
        <Button data-testid="button-add-new-contact">
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-contacts"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map((contact) => (
          <ContactCard
            key={contact.email}
            {...contact}
            onEdit={() => console.log("Edit", contact.name)}
          />
        ))}
      </div>
    </div>
  );
}
