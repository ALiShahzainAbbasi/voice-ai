import type { Friend, InsertFriend } from "@shared/schema";
import type { AppSettings } from "@/types";
import { STORAGE_KEYS, DEFAULT_SETTINGS } from "@/constants";

export class LocalStorageService {
  // Friend configurations
  static saveFriends(friends: Friend[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(friends));
    } catch (error) {
      console.warn('Failed to save friends to local storage:', error);
    }
  }

  static loadFriends(): Friend[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FRIENDS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load friends from local storage:', error);
      return [];
    }
  }

  static addFriend(friend: Friend): void {
    const friends = this.loadFriends();
    const existingIndex = friends.findIndex(f => f.id === friend.id);
    
    if (existingIndex >= 0) {
      friends[existingIndex] = friend;
    } else {
      friends.push(friend);
    }
    
    this.saveFriends(friends);
  }

  static removeFriend(friendId: number): void {
    const friends = this.loadFriends();
    const filtered = friends.filter(f => f.id !== friendId);
    this.saveFriends(filtered);
  }

  static exportFriends(): string {
    const friends = this.loadFriends();
    return JSON.stringify(friends, null, 2);
  }

  static importFriends(jsonData: string): boolean {
    try {
      const friends = JSON.parse(jsonData);
      if (Array.isArray(friends)) {
        this.saveFriends(friends);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import friends:', error);
      return false;
    }
  }

  // App settings
  static saveSettings(settings: Partial<AppSettings>): void {
    try {
      const current = this.loadSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save settings to local storage:', error);
    }
  }

  static loadSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch (error) {
      console.warn('Failed to load settings from local storage:', error);
      return DEFAULT_SETTINGS;
    }
  }

  static clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.FRIENDS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    } catch (error) {
      console.warn('Failed to clear local storage:', error);
    }
  }

  // Backup and restore
  static createBackup(): string {
    const friends = this.loadFriends();
    const settings = this.loadSettings();
    
    return JSON.stringify({
      friends,
      settings,
      version: '1.0',
      exportDate: new Date().toISOString()
    }, null, 2);
  }

  static restoreBackup(backupData: string): boolean {
    try {
      const backup = JSON.parse(backupData);
      
      if (backup.friends && Array.isArray(backup.friends)) {
        this.saveFriends(backup.friends);
      }
      
      if (backup.settings && typeof backup.settings === 'object') {
        this.saveSettings(backup.settings);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      return false;
    }
  }
}