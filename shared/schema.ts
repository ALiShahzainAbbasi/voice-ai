import { pgTable, text, serial, integer, boolean, real } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  personality: text("personality").notNull(),
  voice: text("voice").notNull(),
  voiceId: text("voice_id"),
  gender: text("gender").notNull(),
  age: integer("age").notNull(),
  race: text("race").notNull(),
  religion: text("religion").notNull(),
  politicalLeaning: integer("political_leaning").notNull(),
  stability: real("stability").notNull(),
  similarity: real("similarity").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const voiceMoods = pgTable("voice_moods", {
  id: serial("id").primaryKey(),
  sentiment: text("sentiment").notNull(), // positive, negative, neutral
  intensity: real("intensity").notNull(), // 0.0 to 1.0
  recommendedVoiceIds: text("recommended_voice_ids").array().notNull(),
  personalityMatch: text("personality_match").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFriendSchema = createInsertSchema(friends).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateFriendSchema = insertFriendSchema.partial();

export const insertVoiceMoodSchema = createInsertSchema(voiceMoods).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Friend = typeof friends.$inferSelect;
export type InsertFriend = z.infer<typeof insertFriendSchema>;
export type UpdateFriend = z.infer<typeof updateFriendSchema>;
export type VoiceMood = typeof voiceMoods.$inferSelect;
export type InsertVoiceMood = z.infer<typeof insertVoiceMoodSchema>;
