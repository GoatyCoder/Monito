const STORAGE_KEY = 'monito.recent-users';
const MAX_RECENT_USERS = 5;

export interface RecentUserLocalEntry {
  userId: string;
  lastUsedAt: string;
}

export function getRecentUsersLocal(): RecentUserLocalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentUserLocalEntry[];

    return parsed
      .filter((entry) => !!entry.userId && !!entry.lastUsedAt)
      .sort((a, b) => (a.lastUsedAt < b.lastUsedAt ? 1 : -1))
      .slice(0, MAX_RECENT_USERS);
  } catch {
    return [];
  }
}

export function saveRecentUserLocal(userId: string): void {
  const current = getRecentUsersLocal().filter((entry) => entry.userId !== userId);
  const next: RecentUserLocalEntry[] = [
    {
      userId,
      lastUsedAt: new Date().toISOString(),
    },
    ...current,
  ].slice(0, MAX_RECENT_USERS);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function removeRecentUserLocal(userId: string): void {
  const next = getRecentUsersLocal().filter((entry) => entry.userId !== userId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearRecentUsersLocal(): void {
  localStorage.removeItem(STORAGE_KEY);
}
