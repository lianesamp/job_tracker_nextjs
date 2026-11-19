/**
 * StatusTimeline — a Server Component that displays the status change history
 * for an application as a vertical timeline.
 *
 * WHY is this a Server Component (no "use client")?
 * It has no interactivity — just renders data. By keeping it as a Server
 * Component, it has zero JS bundle cost and renders entirely on the server.
 * Only add "use client" when you need hooks or event handlers.
 *
 * Laravel equivalent: a Blade partial like `_timeline.blade.php` that
 * receives a collection of status history entries.
 */

import type { StatusHistoryEntry } from "@/types";
import type { ApplicationStatus } from "@/db/schema";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  technical_test: "Technical Test",
  offer: "Offer",
  rejected: "Rejected",
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  saved: "bg-gray-400",
  applied: "bg-blue-500",
  interview: "bg-yellow-500",
  technical_test: "bg-purple-500",
  offer: "bg-green-500",
  rejected: "bg-red-500",
};

interface StatusTimelineProps {
  history: StatusHistoryEntry[];
}

export function StatusTimeline({ history }: StatusTimelineProps) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-gray-400">No status changes recorded.</p>
    );
  }

  return (
    <div className="space-y-0">
      {history.map((entry, index) => {
        const isLast = index === history.length - 1;

        return (
          <div key={entry.id} className="relative flex gap-3">
            {/* Vertical line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={`h-3 w-3 shrink-0 rounded-full ${STATUS_COLORS[entry.toStatus]}`}
              />
              {!isLast && (
                <div className="w-px flex-1 bg-gray-200 dark:bg-zinc-700" />
              )}
            </div>

            {/* Content */}
            <div className={`pb-5 ${isLast ? "pb-0" : ""}`}>
              <p className="text-sm font-medium">
                {entry.fromStatus ? (
                  <>
                    {STATUS_LABELS[entry.fromStatus]} → {STATUS_LABELS[entry.toStatus]}
                  </>
                ) : (
                  <>Created as {STATUS_LABELS[entry.toStatus]}</>
                )}
              </p>
              <time className="text-xs text-gray-400">
                {entry.changedAt.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
          </div>
        );
      })}
    </div>
  );
}
