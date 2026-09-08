export const SESSION_COOKIE = "fleetguard_session";

const developmentUser = {
  id: "dev-admin",
  name: "Sadu Admin",
  username: "sadu",
  role: "ADMIN" as const,
};

export function validateDevelopmentCredentials(username: string, password: string) {
  if (username === "sadu" && password === "sadu1234") return developmentUser;
  return null;
}

export function createDevelopmentSession(userId: string) {
  return `dev-session:${userId}`;
}

export function isDevelopmentSession(value?: string) {
  return value === createDevelopmentSession(developmentUser.id);
}
