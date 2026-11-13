import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Aggregated daily usage only. No searches, people, or coordinates are stored.
export const usageDaily = sqliteTable("usage_daily", {
  day: text("day").notNull(),
  kind: text("kind").notNull(),
  target: text("target").notNull(),
  count: integer("count").notNull().default(0),
}, (table) => [primaryKey({ columns: [table.day, table.kind, table.target] })]);
