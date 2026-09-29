import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActiveSession, BiomeId } from "../types";

export interface FocusRow {
  id: string;
  user_id: string;
  status: "running" | "paused" | "completed" | "abandoned";
  biome: BiomeId;
  planned_seconds: number | null;
  elapsed_ms: number;
  running_since: string | null;
  quote: string;
  origin: "mobile" | "extension" | "web";
  revision: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface FocusSnapshot {
  row: FocusRow | null;
  completed: FocusRow[];
  offset: number;
  busy: boolean;
  connected: boolean;
  error: string | null;
}

export function isActive(row: FocusRow | null): row is FocusRow {
  return row?.status === "running" || row?.status === "paused";
}

export function sessionFromRow(row: FocusRow, offset = 0): ActiveSession {
  return {
    id: row.id, biome: row.biome, plannedSeconds: row.planned_seconds,
    elapsedMs: Number(row.elapsed_ms),
    startedAt: row.running_since ? Date.parse(row.running_since) - offset : null,
    quote: row.quote, sharedUserId: row.user_id, revision: row.revision,
  };
}

export function focusEndTime(row: FocusRow | null, offset = 0): number | null {
  if (!row || row.status !== "running" || !row.running_since || row.planned_seconds === null) return null;
  return Date.parse(row.running_since) - offset + row.planned_seconds * 1000 - Number(row.elapsed_ms);
}

export type FocusCommand = "pause" | "resume" | "complete" | "abandon";
const initial: FocusSnapshot = { row: null, completed: [], offset: 0, busy: false, connected: false, error: null };

// A single queue prevents stale responses from replacing newer commands.
export class FocusConnection {
  snapshot: FocusSnapshot = { ...initial };
  private queue: Promise<unknown> = Promise.resolve();
  private refreshing: Promise<void> | null = null;
  private refreshAgain = false;
  private completionCursor: string | null = null;
  private completedRows = new Map<string, FocusRow>();
  private disposed = false;

  constructor(private client: SupabaseClient, readonly userId: string,
    private onChange: (snapshot: FocusSnapshot) => void, private includeHistory = true) {}

  private publish(update: Partial<FocusSnapshot>) {
    if (this.disposed) return;
    this.snapshot = { ...this.snapshot, ...update };
    this.onChange(this.snapshot);
  }

  private enqueue(work: () => Promise<void>): Promise<void> {
    const result = this.queue.then(async () => {
      if (this.disposed) return;
      this.publish({ busy: true });
      try { await work(); }
      catch (error) {
        this.publish({ connected: false, error: "Sem sincronização. Reconecte para controlar a sessão." });
        throw error;
      } finally { this.publish({ busy: false }); }
    });
    this.queue = result.catch(() => undefined);
    return result;
  }

  private async request(command: string, params: Record<string, unknown> = {}) {
    const before = Date.now();
    const { data, error } = await this.client.rpc("focus_command", { p_command: command, ...params });
    if (error) throw error;
    if (this.disposed) return;
    const result = data as { session: FocusRow | null; server_now: string; conflict: boolean };
    if (result.session && result.session.user_id !== this.userId) throw new Error("Conta da sessão inválida");
    const offset = Date.parse(result.server_now) - (before + Date.now()) / 2;
    this.publish({ row: result.session, offset, connected: true, error: result.conflict
      ? "A sessão mudou em outro dispositivo. O estado atual foi carregado." : null });
  }

  private async history() {
    if (!this.includeHistory || this.disposed) return;
    const completed: FocusRow[] = [];
    for (let from = 0; ; from += 100) {
      let query = this.client.from("focus_sessions").select("*").eq("user_id", this.userId)
        .eq("status", "completed").order("completed_at").order("id").range(from, from + 99);
      if (this.completionCursor) query = query.gte("completed_at", this.completionCursor);
      const { data, error } = await query;
      if (error) throw error;
      completed.push(...data as FocusRow[]);
      if (data.length < 100) break;
    }
    if (completed.length) this.completionCursor = completed[completed.length - 1].completed_at;
    for (const row of completed) this.completedRows.set(row.id, row);
    this.publish({ completed: [...this.completedRows.values()] });
  }

  refresh(): Promise<void> {
    if (this.refreshing) { this.refreshAgain = true; return this.refreshing; }
    this.refreshing = this.enqueue(async () => { await this.request("refresh"); await this.history(); })
      .finally(() => {
        this.refreshing = null;
        if (this.refreshAgain && !this.disposed) {
          this.refreshAgain = false;
          void this.refresh().catch(() => undefined);
        }
      });
    return this.refreshing;
  }

  start(seconds: number | null, biome: BiomeId, quote: string, origin: FocusRow["origin"]) {
    return this.enqueue(async () => {
      await this.request("start", { p_id: crypto.randomUUID(), p_seconds: seconds, p_biome: biome, p_quote: quote, p_origin: origin });
      await this.history();
    });
  }

  command(command: FocusCommand) {
    return this.enqueue(async () => {
      const row = this.snapshot.row;
      if (!isActive(row)) return;
      await this.request(command, { p_id: row.id, p_revision: row.revision });
      await this.history();
    });
  }

  watch() {
    const channel = this.client.channel(`focus:${this.userId}:${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "focus_sessions", filter: `user_id=eq.${this.userId}` },
        () => { void this.refresh().catch(() => undefined); })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void this.refresh().catch(() => undefined);
      });
    return () => { void this.client.removeChannel(channel); };
  }

  dispose() { this.disposed = true; }
}
