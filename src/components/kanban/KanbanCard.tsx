"use client";

/**
 * KanbanCard — a draggable card representing one job application.
 *
 * Uses dnd-kit's `useDraggable` hook to make the card draggable.
 *
 * HOW useDraggable WORKS:
 * You call useDraggable({ id }) and it returns:
 *   - attributes: ARIA attributes for accessibility (role, tabIndex, etc.)
 *   - listeners: event handlers (onPointerDown, onKeyDown) that start the drag
 *   - setNodeRef: a ref callback to attach to the DOM element
 *   - transform: the { x, y } offset while dragging (null when not dragging)
 *   - isDragging: boolean — true while this item is being dragged
 *
 * The `transform` is applied as a CSS transform to move the card with the cursor.
 * We use @dnd-kit/utilities' CSS.Transform.toString() to convert { x, y } → "translate3d(...)".
 *
 * Vue equivalent: in Vue you'd use a directive like v-draggable or a library
 * like vuedraggable. The concept is the same — attach drag behavior to an element.
 */

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Application } from "@/types";

const WORK_MODE_LABELS: Record<string, string> = {
  "on-site": "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

interface KanbanCardProps {
  application: Application;
}

export function KanbanCard({ application }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      // The id must be unique across all draggables in the DndContext.
      // We prefix with "card-" to avoid collisions with column IDs.
      id: `card-${application.id}`,
      // `data` lets us attach extra info that we can read in the onDragEnd handler.
      data: { application },
    });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing dark:border-zinc-700 dark:bg-zinc-800"
    >
      <p className="font-medium">{application.company}</p>
      <p className="text-sm text-gray-600 dark:text-zinc-400">
        {application.role}
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {application.city && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-zinc-700 dark:text-zinc-300">
            {application.city}
          </span>
        )}
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          {WORK_MODE_LABELS[application.workMode] ?? application.workMode}
        </span>
        {application.salary && (
          <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300">
            {application.salary}
          </span>
        )}
      </div>
    </div>
  );
}
