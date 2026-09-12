const accessTokenKey = "moneyleap.mock-access-token";
const deviceIdKey = "moneyleap.mock-device-id";

export type AuthUser = {
  userId: string;
  displayName: string;
  isMock: boolean;
};

type MockSession = AuthUser & {
  accessToken: string;
  expiresAt: string;
};

function getDeviceId() {
  const existingId = sessionStorage.getItem(deviceIdKey);
  if (existingId) return existingId;

  const deviceId = crypto.randomUUID();
  sessionStorage.setItem(deviceIdKey, deviceId);
  return deviceId;
}

export async function initializeMockSession(): Promise<AuthUser> {
  const storedToken = sessionStorage.getItem(accessTokenKey);
  if (storedToken) {
    const response = await apiFetch("/api/auth/me");
    if (response.ok) return (await response.json()) as AuthUser;
    sessionStorage.removeItem(accessTokenKey);
  }

  const response = await fetch("/api/auth/mock-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId: getDeviceId() }),
  });
  if (!response.ok) throw new Error("Unable to start a development session.");

  const session = (await response.json()) as MockSession;
  sessionStorage.setItem(accessTokenKey, session.accessToken);
  return {
    userId: session.userId,
    displayName: session.displayName,
    isMock: true,
  };
}

export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const accessToken = sessionStorage.getItem(accessTokenKey);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  return fetch(input, { ...init, headers });
}

export async function logoutMockSession() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } finally {
    sessionStorage.removeItem(accessTokenKey);
    sessionStorage.removeItem(deviceIdKey);
  }
}
