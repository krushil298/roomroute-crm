import { ContractTemplateCard } from "../contract-template-card";

export default function ContractTemplateCardExample() {
  return (
    <div className="p-6 max-w-md">
      <ContractTemplateCard
        name="Standard LNR Agreement"
        type="lnr"
        description="Standard lease agreement template for long-term rentals with customizable terms and conditions."
        lastModified="2 days ago"
        onUse={() => console.log("Use template")}
        onEdit={() => console.log("Edit template")}
        onPreview={() => console.log("Preview template")}
      />
    </div>
  );
}
