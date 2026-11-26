import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { Citation, TenderAnalysis } from "@/domain/analysis";

/**
 * bytea that behaves identically on Neon (returns Buffer or hex string) and PGlite (Uint8Array).
 * Both drivers serialise a Buffer parameter natively.
 */
const bytea = customType<{ data: Buffer; driverData: unknown }>({
  dataType: () => "bytea",
  toDriver: (value) => value,
  fromDriver: (value) => {
    if (Buffer.isBuffer(value)) return value;
    if (value instanceof Uint8Array) return Buffer.from(value);
    if (typeof value === "string" && value.startsWith("\\x")) return Buffer.from(value.slice(2), "hex");
    throw new Error("Unsupported bytea value from driver");
  },
});

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
};

export const tenders = pgTable(
  "tenders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    issuer: text("issuer"),
    referenceNumber: text("reference_number"),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size").notNull(),
    fileHash: text("file_hash").notNull().unique(),
    pageCount: integer("page_count").notNull(),
    status: text("status", { enum: ["processing", "ready", "failed"] }).notNull().default("processing"),
    errorMessage: text("error_message"),
    submissionDeadline: timestamp("submission_deadline", { withTimezone: true }),
    analysis: jsonb("analysis").$type<TenderAnalysis>(),
    isSample: boolean("is_sample").notNull().default(false),
    analysisStartedAt: timestamp("analysis_started_at", { withTimezone: true }),
    analyzedAt: timestamp("analyzed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("tenders_created_at_idx").on(t.createdAt), index("tenders_deadline_idx").on(t.submissionDeadline)],
);

export const tenderFiles = pgTable("tender_files", {
  tenderId: uuid("tender_id")
    .primaryKey()
    .references(() => tenders.id, { onDelete: "cascade" }),
  data: bytea("data").notNull(),
});

export const tenderPages = pgTable(
  "tender_pages",
  {
    tenderId: uuid("tender_id")
      .notNull()
      .references(() => tenders.id, { onDelete: "cascade" }),
    pageNumber: integer("page_number").notNull(),
    text: text("text").notNull(),
  },
  (t) => [primaryKey({ columns: [t.tenderId, t.pageNumber] })],
);

export const checklistItems = pgTable(
  "checklist_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenderId: uuid("tender_id")
      .notNull()
      .references(() => tenders.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    category: text("category").notNull(),
    requirement: text("requirement").notNull(),
    guidance: text("guidance").notNull(),
    mandatory: boolean("mandatory").notNull(),
    priority: text("priority").notNull(),
    pages: integer("pages").array().notNull(),
    completed: boolean("completed").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [index("checklist_items_tender_idx").on(t.tenderId, t.position)],
);

export const risks = pgTable(
  "risks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenderId: uuid("tender_id")
      .notNull()
      .references(() => tenders.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    kind: text("kind").notNull(),
    severity: text("severity").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    mitigation: text("mitigation").notNull(),
    pages: integer("pages").array().notNull(),
  },
  (t) => [index("risks_tender_idx").on(t.tenderId, t.position)],
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenderId: uuid("tender_id")
      .notNull()
      .references(() => tenders.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant"] }).notNull(),
    content: text("content").notNull(),
    citations: jsonb("citations").$type<Citation[]>().notNull().default([]),
    answerable: boolean("answerable").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("chat_messages_tender_idx").on(t.tenderId, t.createdAt)],
);

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
});

export type TenderRow = typeof tenders.$inferSelect;
export type ChecklistItemRow = typeof checklistItems.$inferSelect;
export type RiskRow = typeof risks.$inferSelect;
export type ChatMessageRow = typeof chatMessages.$inferSelect;
