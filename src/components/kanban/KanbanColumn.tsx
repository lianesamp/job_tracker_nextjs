"use client";

/**
 * KanbanColumn — a droppable column that holds cards for one status.
 *
 * Uses dnd-kit's `useDroppable` hook to make this a drop target.
 *
 * HOW useDroppable WORKS:
 * You call useDroppable({ id }) and it returns:
 *   - setNodeRef: a ref callback to attach to the DOM element (the drop zone)
 *   - isOver: boolean — true when a draggable is hovering over this droppable
 *
 * When a card is dropped on a column, the DndContext's `onDragEnd` fires
 * with `over.id` set to this column's ID. We handle the status update there.
 *
 * Vue equivalent: in vuedraggable, the <draggable> component IS the drop zone.
 * In dnd-kit, the draggable and droppable are separate concepts.
 */

import { useDroppable } from "@dnd-kit/core";
import type { ApplicationStatus } from "@/db/schema";
import type { Application } from "@/types";
import { KanbanCard } from "./KanbanCard";

/** Human-friendly labels for each status column. */
const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  technical_test: "Technical Test",
  offer: "Offer",
  rejected: "Rejected",
};

/** Color accents for the column header dot. */
const STATUS_COLORS: Record<ApplicationStatus, string> = {
  saved: "bg-gray-400",
  applied: "bg-blue-500",
  interview: "bg-yellow-500",
  technical_test: "bg-purple-500",
  offer: "bg-green-500",
  rejected: "bg-red-500",
};

interface KanbanColumnProps {
  status: ApplicationStatus;
  applications: Application[];
  demoMode?: boolean;
}

export function KanbanColumn({ status, applications, demoMode = false }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    // The column ID matches the status name so we can read it in onDragEnd.
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[200px] w-64 shrink-0 flex-col rounded-xl border p-3 transition-colors ${
        isOver
          ? "border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20"
          : "border-gray-200 bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900"
      }`}
    >
      {/* Column header */}
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[status]}`} />
        <h2 className="text-sm font-semibold">{STATUS_LABELS[status]}</h2>
        <span className="ml-auto text-xs text-gray-400">{applications.length}</span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2">
        {applications.map((app) => (
          <KanbanCard key={app.id} application={app} demoMode={demoMode} />
        ))}
      </div>

      {/* Empty state */}
      {applications.length === 0 && (
        <p className="py-8 text-center text-xs text-gray-400">
          Drop here
        </p>
      )}
    </div>
  );
}
