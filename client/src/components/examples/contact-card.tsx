import { ContactCard } from "../contact-card";
import avatar1 from "@assets/generated_images/Professional_business_avatar_a916c4b1.png";

export default function ContactCardExample() {
  return (
    <div className="p-6 max-w-sm">
      <ContactCard
        name="Sarah Johnson"
        email="sarah.j@example.com"
        phone="+1 (555) 123-4567"
        company="Acme Corporation"
        status="active"
        avatarUrl={avatar1}
        onEdit={() => console.log("Edit contact")}
      />
    </div>
  );
}
