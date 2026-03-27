const LOCK_SCREEN_STATE_KEY = 'monito.lock-screen.state';
const LOCK_SCREEN_SHARED_STATE_KEY = 'monito.lock-screen.shared-state';
const LOCK_SCREEN_SYNC_KEY = 'monito.lock-screen.sync';
const LOCK_SCREEN_CHANNEL = 'monito-lock-screen';

interface LockScreenState {
  userId: string;
  lockedAt: string;
}

interface LockScreenSyncMessage {
  type: 'locked' | 'unlocked';
  userId: string;
  timestamp: number;
}

function readState(): LockScreenState | null {
  const raw = sessionStorage.getItem(LOCK_SCREEN_STATE_KEY);
  const readFromRaw = (value: string | null): LockScreenState | null => {
    if (!value) {
      return null;
    }

    try {
      const parsed = JSON.parse(value) as LockScreenState;
      if (!parsed.userId || !parsed.lockedAt) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  };

  const sessionState = readFromRaw(raw);
  if (sessionState) {
    return sessionState;
  }

  return readFromRaw(localStorage.getItem(LOCK_SCREEN_SHARED_STATE_KEY));
}

function postSync(message: LockScreenSyncMessage): void {
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(LOCK_SCREEN_CHANNEL);
    channel.postMessage(message);
    channel.close();
  }

  localStorage.setItem(LOCK_SCREEN_SYNC_KEY, JSON.stringify(message));
  localStorage.removeItem(LOCK_SCREEN_SYNC_KEY);
}

export function isLockScreenActiveForUser(userId: string): boolean {
  const state = readState();
  return !!state && state.userId === userId;
}

export function setLockScreenActive(userId: string): void {
  const state = {
    userId,
    lockedAt: new Date().toISOString(),
  } satisfies LockScreenState;

  sessionStorage.setItem(
    LOCK_SCREEN_STATE_KEY,
    JSON.stringify(state),
  );
  localStorage.setItem(LOCK_SCREEN_SHARED_STATE_KEY, JSON.stringify(state));

  postSync({
    type: 'locked',
    userId,
    timestamp: Date.now(),
  });
}

export function clearLockScreenState(userId?: string): void {
  const previousState = readState();
  sessionStorage.removeItem(LOCK_SCREEN_STATE_KEY);
  localStorage.removeItem(LOCK_SCREEN_SHARED_STATE_KEY);

  if (previousState?.userId) {
    postSync({
      type: 'unlocked',
      userId: previousState.userId,
      timestamp: Date.now(),
    });
    return;
  }

  if (userId) {
    postSync({
      type: 'unlocked',
      userId,
      timestamp: Date.now(),
    });
  }
}

export function subscribeLockScreenSync(onMessage: (message: LockScreenSyncMessage) => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === LOCK_SCREEN_SHARED_STATE_KEY) {
      if (!event.newValue) {
        if (event.oldValue) {
          try {
            const oldState = JSON.parse(event.oldValue) as LockScreenState;
            if (oldState.userId) {
              onMessage({ type: 'unlocked', userId: oldState.userId, timestamp: Date.now() });
            }
          } catch {
            return;
          }
        }
        return;
      }

      try {
        const nextState = JSON.parse(event.newValue) as LockScreenState;
        if (!nextState.userId) {
          return;
        }
        onMessage({ type: 'locked', userId: nextState.userId, timestamp: Date.now() });
      } catch {
        return;
      }
      return;
    }

    if (event.key !== LOCK_SCREEN_SYNC_KEY || !event.newValue) {
      return;
    }

    try {
      const message = JSON.parse(event.newValue) as LockScreenSyncMessage;
      if (!message.type || !message.userId) {
        return;
      }
      onMessage(message);
    } catch {
      return;
    }
  };

  window.addEventListener('storage', handleStorage);

  let channel: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(LOCK_SCREEN_CHANNEL);
    channel.onmessage = (event: MessageEvent<LockScreenSyncMessage>) => {
      const message = event.data;
      if (!message || !message.type || !message.userId) {
        return;
      }
      onMessage(message);
    };
  }

  return () => {
    window.removeEventListener('storage', handleStorage);
    channel?.close();
  };
}
