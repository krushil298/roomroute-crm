import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, Mail, Calendar, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

type ActivityType = "call" | "email" | "meeting" | "note";

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  contact: string;
  contactId?: string;
  timestamp: string;
  avatarUrl?: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

const activityIcons: Record<ActivityType, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: FileText,
};

const activityColors: Record<ActivityType, string> = {
  call: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  email: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  meeting: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  note: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const [, setLocation] = useLocation();

  const handleContactClick = (contactId: string | undefined) => {
    if (contactId) {
      setLocation("/contacts");
      // Optionally, you could add a query param or state to highlight/open the contact
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activityIcons[activity.type];
          return (
            <div
              key={activity.id}
              className="flex gap-3 pb-4 last:pb-0 last:border-0 border-b"
              data-testid={`activity-${activity.id}`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${activityColors[activity.type]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{activity.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activity.contactId ? (
                    <button
                      onClick={() => handleContactClick(activity.contactId)}
                      className="hover:underline hover:text-primary cursor-pointer transition-colors"
                    >
                      {activity.contact}
                    </button>
                  ) : (
                    activity.contact
                  )} • {activity.timestamp}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {activity.type}
              </Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
