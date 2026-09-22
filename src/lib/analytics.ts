import { createMutation, enqueueMutation } from "@/lib/blossom/sync-client";

type AnalyticsEvent = {
  name: string;
  at: string;
  props?: Record<string, string | number | boolean>;
};

const buffer: AnalyticsEvent[] = [];

export function track(
  name: string,
  props?: Record<string, string | number | boolean>,
) {
  const at = new Date().toISOString();
  const event = { name, at, props };
  buffer.push(event);

  try {
    const mutation = createMutation({
      operation: "analytics.record",
      entityId: name,
      payload: {
        name,
        occurredAt: at,
        props: props ?? {},
      },
    });
    void enqueueMutation(mutation);
  } catch {
    // Telemetry must never block or break the learning experience.
  }
}

export function getAnalyticsBuffer() {
  return buffer.slice();
}
