export interface CouncilLogEntry {
  id: string;
  promptPreview: string;
  route: "local" | "cloud";
  model: string;
  timestamp: string;
  latency: number;
}

const MAX_LOG_ENTRIES = 20;
const logEntries: CouncilLogEntry[] = [];

export function addCouncilLogEntry(entry: CouncilLogEntry) {
  logEntries.unshift(entry);
  if (logEntries.length > MAX_LOG_ENTRIES) {
    logEntries.length = MAX_LOG_ENTRIES;
  }
}

export function getCouncilLog() {
  return logEntries;
}
