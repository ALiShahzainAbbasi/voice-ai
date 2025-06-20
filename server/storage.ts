import { users, friends, type User, type InsertUser, type Friend, type InsertFriend, type UpdateFriend } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private friends: Map<number, Friend>;
  private currentUserId: number;
  private currentFriendId: number;

  constructor() {
    this.users = new Map();
    this.friends = new Map();
    this.currentUserId = 1;
    this.currentFriendId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getFriends(): Promise<Friend[]> {
    return Array.from(this.friends.values());
  }

  async getFriend(id: number): Promise<Friend | undefined> {
    return this.friends.get(id);
  }

  async createFriend(insertFriend: InsertFriend): Promise<Friend> {
    const id = this.currentFriendId++;
    const friend: Friend = { ...insertFriend, id };
    this.friends.set(id, friend);
    return friend;
  }

  async updateFriend(id: number, updateFriend: UpdateFriend): Promise<Friend | undefined> {
    const existingFriend = this.friends.get(id);
    if (!existingFriend) return undefined;
    
    const updatedFriend: Friend = { ...existingFriend, ...updateFriend };
    this.friends.set(id, updatedFriend);
    return updatedFriend;
  }

  async deleteFriend(id: number): Promise<boolean> {
    return this.friends.delete(id);
  }
}

export const storage = new MemStorage();
