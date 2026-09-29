// Compatibility barrel for the server-only Blossom domain surface.
// Implementations are split by authorization/data boundary so each subsystem
// can be reviewed independently without changing domain.api import contracts.
export * from "./access.server";
export * from "./workspaces.server";
export * from "./tandem.server";
export * from "./booking.server";
export * from "./activities.server";
export * from "./sessions.server";
export * from "./notifications.server";
