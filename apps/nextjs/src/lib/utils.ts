export function cn(...inputs: Array<string | undefined | false | null>) {
  return inputs.filter(Boolean).join(" ");
}

export function formatLatency(latency: number | null | undefined) {
  if (latency === null || latency === undefined) {
    return "-";
  }
  if (latency < 1000) {
    return `${latency.toFixed(0)} ms`;
  }
  return `${(latency / 1000).toFixed(2)} s`;
}

export function formatTimestamp(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString();
}
