const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

function migrateLegacyLocalStorage(): void {
  const legacyAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const legacyRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

  if (legacyAccessToken && !sessionStorage.getItem(ACCESS_TOKEN_KEY)) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, legacyAccessToken);
  }

  if (legacyRefreshToken && !sessionStorage.getItem(REFRESH_TOKEN_KEY)) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, legacyRefreshToken);
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getAccessToken(): string | null {
  migrateLegacyLocalStorage();
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  migrateLegacyLocalStorage();
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
