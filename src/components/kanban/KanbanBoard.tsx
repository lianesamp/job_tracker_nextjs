"use client";

/**
 * KanbanBoard — the main Client Component that orchestrates drag-and-drop.
 *
 * ARCHITECTURE:
 * Server Component (board/page.tsx)
 *   └─ fetches all applications from the DB
 *   └─ passes them as props to this Client Component
 *
 * This component:
 *   1. Groups applications by status into columns
 *   2. Wraps everything in <DndContext> for drag-and-drop
 *   3. On drop, optimistically updates the local state (instant UI feedback)
 *   4. Calls the updateApplicationStatus Server Action in the background
 *   5. If the action fails, reverts the optimistic update
 *
 * WHAT IS OPTIMISTIC UI?
 * Instead of waiting for the server to respond before updating the UI,
 * we update immediately (optimistically assume success) and revert if it fails.
 * This makes the app feel instant — the card snaps to the new column right away.
 *
 * Laravel equivalent: in Livewire you'd use wire:model.live for instant updates.
 * In a Vue SPA, you'd update Vuex/Pinia state immediately and sync with the API.
 *
 * WHAT IS DndContext?
 * The root wrapper from @dnd-kit/core. It tracks all draggables and droppables
 * inside it and fires events (onDragStart, onDragEnd) when things are moved.
 * Think of it like Vue's <draggable> component from vuedraggable, but as a
 * context provider that wraps the entire board.
 */

import { useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/db/schema";
import { updateApplicationStatus } from "@/lib/actions";
import type { Application } from "@/types";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";

interface KanbanBoardProps {
  initialApplications: Application[];
}

export function KanbanBoard({ initialApplications }: KanbanBoardProps) {
  // Local state — we update this optimistically on drag, then sync with the server.
  const [apps, setApps] = useState(initialApplications);

  // The card currently being dragged (for DragOverlay — a floating preview).
  const [activeApp, setActiveApp] = useState<Application | null>(null);

  // useTransition lets us mark the server action as a non-blocking transition.
  // isPending is true while the action is running — we could use it for a subtle
  // loading indicator, but for now the optimistic update is enough.
  const [, startTransition] = useTransition();

  // ─── Sensors ────────────────────────────────────────────
  // Sensors detect HOW a drag starts. PointerSensor handles mouse/touch.
  // KeyboardSensor handles arrow keys for accessibility (a11y).
  //
  // activationConstraint: { distance: 5 } means you must move 5px before
  // a drag starts. This prevents accidental drags on click.
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, keyboardSensor);

  // ─── Group applications by status ──────────────────────
  const columns = APPLICATION_STATUSES.map((status) => ({
    status,
    applications: apps.filter((app) => app.status === status),
  }));

  // ─── Drag handlers ────────────────────────────────────
  function handleDragStart(event: DragStartEvent) {
    const app = event.active.data.current?.application as
      | Application
      | undefined;
    setActiveApp(app ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveApp(null);

    const { active, over } = event;

    // `over` is null if dropped outside any droppable
    if (!over) return;

    // The dragged card's application (attached via useDraggable's `data`)
    const draggedApp = active.data.current?.application as
      | Application
      | undefined;
    if (!draggedApp) return;

    // The column it was dropped on (the droppable id = status string)
    const newStatus = over.id as ApplicationStatus;

    // If dropped on the same column, do nothing
    if (draggedApp.status === newStatus) return;

    // ─── Optimistic update ───────────────────────────────
    // Immediately move the card in local state so the UI feels instant.
    const previousApps = apps;
    setApps((prev) =>
      prev.map((app) =>
        app.id === draggedApp.id ? { ...app, status: newStatus } : app
      )
    );

    // ─── Server sync (in a transition) ───────────────────
    startTransition(async () => {
      const result = await updateApplicationStatus({
        applicationId: draggedApp.id,
        status: newStatus,
      });

      // If the server action failed, revert the optimistic update
      if (!result.success) {
        setApps(previousApps);
        console.error("Status update failed:", result.formError);
      }
    });
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(({ status, applications }) => (
          <KanbanColumn
            key={status}
            status={status}
            applications={applications}
          />
        ))}
      </div>

      {/* DragOverlay renders a floating copy of the card while dragging.
          Without it, the original card moves with the cursor (which we made
          semi-transparent with opacity: 0.5). The overlay gives a cleaner UX
          because it renders above everything with no layout shift.

          Vue equivalent: vuedraggable's ghost/clone element. */}
      <DragOverlay>
        {activeApp ? <KanbanCard application={activeApp} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
