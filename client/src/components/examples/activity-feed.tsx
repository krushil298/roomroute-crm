import { ActivityFeed } from "../activity-feed";

export default function ActivityFeedExample() {
  const activities = [
    {
      id: "1",
      type: "call" as const,
      title: "Called about proposal follow-up",
      contact: "Sarah Johnson",
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      type: "email" as const,
      title: "Sent pricing information",
      contact: "Mike Chen",
      timestamp: "4 hours ago",
    },
    {
      id: "3",
      type: "meeting" as const,
      title: "Demo scheduled",
      contact: "Emily Rodriguez",
      timestamp: "Yesterday",
    },
  ];

  return (
    <div className="p-6 max-w-2xl">
      <ActivityFeed activities={activities} />
    </div>
  );
}
