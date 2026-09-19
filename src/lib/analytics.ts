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
  buffer.push({ name, at: new Date().toISOString(), props });
}

export function getAnalyticsBuffer() {
  return buffer.slice();
}
