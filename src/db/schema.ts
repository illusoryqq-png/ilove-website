import { pgTable, text, timestamp, serial, integer } from "drizzle-orm/pg-core";

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  caption: text("caption").default(""),
  rotation: text("rotation").default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  soundcloud_url: text("soundcloud_url").default(""),
  created_at: timestamp("created_at").defaultNow().notNull(),
});