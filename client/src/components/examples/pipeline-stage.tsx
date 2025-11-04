import { PipelineStage } from "../pipeline-stage";

export default function PipelineStageExample() {
  const deals = [
    {
      id: "1",
      title: "Enterprise License",
      value: 45000,
      contact: "Sarah Johnson",
    },
    {
      id: "2",
      title: "Consulting Package",
      value: 12000,
      contact: "Mike Chen",
    },
  ];

  return (
    <div className="p-6">
      <PipelineStage stage="Negotiation" deals={deals} color="yellow" />
    </div>
  );
}
