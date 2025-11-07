import { User } from './shared.types';
import { getGroupUsers } from './getGroupUsers';

interface CacheEntry {
  users: User[];
  timestamp: number;
}

class GroupUsersCache {
  private cache: Map<number, CacheEntry> = new Map();
  private inFlightRequests: Map<number, Promise<User[]>> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async fetchGroupUsers(token: string, groupId: number): Promise<User[]> {
    // Check if there's already a request in flight for this group
    const inFlightRequest = this.inFlightRequests.get(groupId);
    if (inFlightRequest) {
      console.log(`Waiting for in-flight request for group ${groupId}`);
      return inFlightRequest;
    }

    // Check cache
    const cached = this.cache.get(groupId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`Using cached data for group ${groupId}`);
      return cached.users;
    }

    // Create new request
    console.log(`Fetching fresh data for group ${groupId}`);
    const request = this.fetchAndCache(token, groupId);
    this.inFlightRequests.set(groupId, request);

    try {
      const users = await request;
      return users;
    } finally {
      this.inFlightRequests.delete(groupId);
    }
  }

  private async fetchAndCache(token: string, groupId: number): Promise<User[]> {
    const result = await getGroupUsers(token, groupId);

    if (result.success && result.data && Array.isArray(result.data)) {
      const users = result.data as User[];
      this.cache.set(groupId, {
        users,
        timestamp: Date.now(),
      });
      return users;
    }

    return [];
  }

  invalidate(groupId?: number) {
    if (groupId !== undefined) {
      console.log(`Invalidating cache for group ${groupId}`);
      this.cache.delete(groupId);
    } else {
      console.log('Invalidating entire group users cache');
      this.cache.clear();
    }
  }

  clear() {
    this.cache.clear();
    this.inFlightRequests.clear();
  }
}

export const groupUsersCache = new GroupUsersCache();
