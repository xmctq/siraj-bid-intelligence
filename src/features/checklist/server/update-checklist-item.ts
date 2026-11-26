import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { checklistItems } from "@/server/db/schema";
import { notFound } from "@/server/errors";

export async function setChecklistItemCompleted(tenderId: string, itemId: string, completed: boolean) {
  const db = await getDb();
  const [item] = await db
    .update(checklistItems)
    .set({ completed, completedAt: completed ? new Date() : null })
    .where(and(eq(checklistItems.id, itemId), eq(checklistItems.tenderId, tenderId)))
    .returning({ id: checklistItems.id, completed: checklistItems.completed, completedAt: checklistItems.completedAt });
  if (!item) throw notFound("Checklist item");
  return item;
}
