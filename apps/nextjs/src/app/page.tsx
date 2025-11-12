"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLatency, formatTimestamp } from "@/lib/utils";

interface ServiceStatus {
  status: "online" | "offline";
  latency: number | null;
  formattedLatency: string | null;
  error: string | null;
}

interface MetaPayload {
  services: {
    ollama: ServiceStatus;
    qdrant: ServiceStatus;
    redis: ServiceStatus;
    cloud: {
      openai: boolean;
      anthropic: boolean;
      gemini: boolean;
    };
  };
  uptime: string;
  version: string;
}

interface CouncilLogEntry {
  id: string;
  promptPreview: string;
  route: "local" | "cloud";
  model: string;
  timestamp: string;
  latency: number;
}

interface LatencyPoint {
  timestamp: string;
  ollama: number | null;
  qdrant: number | null;
  redis: number | null;
}

const STATUS_ICON: Record<ServiceStatus["status"], string> = {
  online: "✅",
  offline: "❌"
};

export default function DashboardPage() {
  const [meta, setMeta] = useState<MetaPayload | null>(null);
  const [latencySeries, setLatencySeries] = useState<LatencyPoint[]>([]);
  const [logEntries, setLogEntries] = useState<CouncilLogEntry[]>([]);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMeta = useCallback(async () => {
    try {
      const response = await fetch("/api/meta");
      if (!response.ok) {
        throw new Error(`Meta request failed: ${response.status}`);
      }
      const payload: MetaPayload = await response.json();
      setMeta(payload);
      setLatencySeries((series) => {
        const nextPoint: LatencyPoint = {
          timestamp: new Date().toISOString(),
          ollama: payload.services.ollama.latency,
          qdrant: payload.services.qdrant.latency,
          redis: payload.services.redis.latency
        };
        const nextSeries = [...series, nextPoint];
        return nextSeries.slice(-12);
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch("/api/council");
      if (!response.ok) {
        throw new Error(`Log request failed: ${response.status}`);
      }
      const payload = (await response.json()) as { entries: CouncilLogEntry[] };
      setLogEntries(payload.entries ?? []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchMeta();
    fetchLogs();
    const interval = setInterval(() => {
      fetchMeta();
      fetchLogs();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchLogs, fetchMeta]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!message.trim()) {
        return;
      }

      setLoading(true);
      setError(null);
      setResult("");
      try {
        const response = await fetch("/api/council", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: message.trim() }]
          })
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Council request failed");
        }

        setResult(payload.output);
        setMessage("");
        fetchLogs();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [fetchLogs, message]
  );

  const latencyChartData = useMemo(() => {
    return latencySeries.map((point) => ({
      time: formatTimestamp(point.timestamp),
      ollama: point.ollama ?? 0,
      qdrant: point.qdrant ?? 0,
      redis: point.redis ?? 0
    }));
  }, [latencySeries]);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
            ForgeAthena
          </p>
          <h1 className="text-3xl font-bold">Athena Operations Dashboard</h1>
          <p className="text-sm text-slate-400">
            Monitor routing health, memory systems, and recent counsel in real time.
          </p>
        </div>
        <div className="text-right text-sm text-slate-400">
          <p>Version: {meta?.version ?? "-"}</p>
          <p>Uptime: {meta?.uptime ?? "-"}</p>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {meta &&
          ([
            { key: "ollama", label: "Ollama" },
            { key: "qdrant", label: "Qdrant" },
            { key: "redis", label: "Redis" }
          ] as const).map(({ key, label }) => {
            const status = meta.services[key];
            return (
              <Card key={key}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{label}</CardTitle>
                  <span className="text-2xl">
                    {STATUS_ICON[status.status]}
                  </span>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400">Latency</p>
                  <p className="text-xl font-semibold">
                    {status.formattedLatency ?? formatLatency(status.latency)}
                  </p>
                  {status.error && (
                    <p className="mt-2 rounded bg-red-500/10 p-2 text-xs text-red-300">
                      {status.error}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Latency Telemetry</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyChartData}>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis dataKey="time" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid rgba(148,163,184,0.25)",
                    borderRadius: 12
                  }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Line type="monotone" dataKey="ollama" stroke="#22d3ee" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="qdrant" stroke="#a855f7" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="redis" stroke="#f97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Cloud Access</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {meta ? (
              <>
                <div className="flex items-center justify-between rounded-lg bg-slate-900/60 px-4 py-3">
                  <span>OpenAI</span>
                  <span>{meta.services.cloud.openai ? "✅" : "⚠️"}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-900/60 px-4 py-3">
                  <span>Anthropic</span>
                  <span>{meta.services.cloud.anthropic ? "✅" : "⚠️"}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-900/60 px-4 py-3">
                  <span>Gemini</span>
                  <span>{meta.services.cloud.gemini ? "✅" : "⚠️"}</span>
                </div>
              </>
            ) : (
              <p className="text-slate-400">Loading…</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Send Council Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="min-h-[140px] w-full rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm focus:border-accent focus:outline-none"
                placeholder="Ask Athena something…"
              />
              {error && (
                <p className="rounded bg-red-500/10 p-2 text-xs text-red-300">{error}</p>
              )}
              {result && (
                <pre className="max-h-40 overflow-y-auto rounded-lg bg-slate-900/70 p-3 text-xs text-slate-200">
                  {result}
                </pre>
              )}
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-accent/80 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-accent"
              >
                {loading ? "Routing…" : "Dispatch"}
              </button>
            </form>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Council Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-72 space-y-3 overflow-y-auto text-xs">
              {logEntries.length === 0 && (
                <p className="text-slate-500">No activity yet.</p>
              )}
              {logEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{formatTimestamp(entry.timestamp)}</span>
                    <span>
                      {entry.route.toUpperCase()} · {entry.model} · {formatLatency(entry.latency)}
                    </span>
                  </div>
                  <p className="mt-2 text-slate-200">{entry.promptPreview}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
