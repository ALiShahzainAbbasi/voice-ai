import { users, friends, type User, type InsertUser, type Friend, type InsertFriend, type UpdateFriend } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getFriends(): Promise<Friend[]>;
  getFriend(id: number): Promise<Friend | undefined>;
  createFriend(friend: InsertFriend): Promise<Friend>;
  updateFriend(id: number, friend: UpdateFriend): Promise<Friend | undefined>;
  deleteFriend(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getFriends(): Promise<Friend[]> {
    return await db.select().from(friends);
  }

  async getFriend(id: number): Promise<Friend | undefined> {
    const [friend] = await db.select().from(friends).where(eq(friends.id, id));
    return friend || undefined;
  }

  async createFriend(insertFriend: InsertFriend): Promise<Friend> {
    const [friend] = await db
      .insert(friends)
      .values(insertFriend)
      .returning();
    return friend;
  }

  async updateFriend(id: number, updateFriend: UpdateFriend): Promise<Friend | undefined> {
    const [friend] = await db
      .update(friends)
      .set({ ...updateFriend, updatedAt: new Date().toISOString() })
      .where(eq(friends.id, id))
      .returning();
    return friend || undefined;
  }

  async deleteFriend(id: number): Promise<boolean> {
    const result = await db.delete(friends).where(eq(friends.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
