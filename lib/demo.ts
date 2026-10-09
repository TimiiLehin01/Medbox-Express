// Demo accounts for portfolio visitors. These are seeded by prisma/seed-demo.js
// and are signed in by the server only; no password ever reaches the browser.

export type DemoRole = "CONSUMER" | "PHARMACY" | "RIDER" | "ADMIN";

export const DEMO_EMAILS: Record<DemoRole, string> = {
  CONSUMER: "demo-consumer@medbox.demo",
  PHARMACY: "demo-pharmacy@medbox.demo",
  RIDER: "demo-rider@medbox.demo",
  ADMIN: "demo-admin@medbox.demo",
};

export function isDemoEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.ENABLE_DEMO_MODE === "true"
  );
}

// The admin dashboard lists every real user, so the demo admin is opt-in.
export function availableDemoRoles(): DemoRole[] {
  const roles: DemoRole[] = ["CONSUMER", "PHARMACY", "RIDER"];
  if (process.env.DEMO_ALLOW_ADMIN === "true") roles.push("ADMIN");
  return roles;
}
