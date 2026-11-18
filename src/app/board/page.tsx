import { Suspense } from "react";
import { connection } from "next/server";
import { db } from "@/db";
import { applications } from "@/db/schema";

async function BoardContent() {
  await connection();
  const allApplications = await db.select().from(applications);

  return (
    <p className="mt-2 text-zinc-500">
      Connected to database. Applications: {allApplications.length}
    </p>
  );
}

export default function BoardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Kanban Board</h1>
      <Suspense fallback={<p className="mt-2 text-zinc-500">Loading...</p>}>
        <BoardContent />
      </Suspense>
    </div>
  );
}
