import { EmailComposer } from "../email-composer";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function EmailComposerExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Open Email Composer</Button>
      <EmailComposer
        open={open}
        onOpenChange={setOpen}
        recipientEmail="sarah.j@example.com"
        recipientName="Sarah Johnson"
      />
    </div>
  );
}
