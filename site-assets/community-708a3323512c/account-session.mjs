// Shared display state only. Every private operation is still authorized by the server.
export class AccountSession {
  constructor({ fetcher = (...args) => globalThis.fetch(...args) } = {}) {
    this.fetcher = fetcher;
    this.state = { status: "checking", user: null };
    this.listeners = new Set();
    this.generation = 0;
    this.pending = null;
  }
  subscribe(fn) {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }
  emit() {
    for (const fn of this.listeners) fn(this.state);
  }
  accept(user) {
    this.generation++;
    this.pending = null;
    this.state = { ...this.state, status: user ? "member" : "guest", user: user || null };
    this.emit();
  }
  async refresh({ force = false } = {}) {
    if (this.pending && !force) return this.pending;
    const generation = ++this.generation;
    const request = (async () => {
      try {
        const r = await this.fetcher("/Game/api/account/me", {
          credentials: "same-origin",
          cache: "no-store",
          signal: AbortSignal.timeout(6000),
        });
        if (!r.ok) throw Error("account-unavailable");
        const body = await r.json();
        if (!Object.hasOwn(body, "user")) throw Error("account-invalid");
        if (generation === this.generation) {
          this.state = {
            status: body.user ? "member" : "guest",
            user: body.user || null,
            emailLoginAvailable: body.emailLoginAvailable === true,
            googleAvailable: !!body.googleClientId,
          };
          this.emit();
        }
      } catch {
        if (generation === this.generation) {
          this.state = { ...this.state, status: "unavailable" };
          this.emit();
        }
      } finally {
        if (generation === this.generation) this.pending = null;
      }
      return this.state;
    })();
    this.pending = request;
    return request;
  }
}
export const accountSession = new AccountSession();
let channel;
export function publishAccountChange(user) {
  accountSession.accept(user);
  channel?.postMessage("changed");
}
if (typeof window !== "undefined") {
  try {
    channel = new BroadcastChannel("backmir-account-status");
    channel.onmessage = () => accountSession.refresh({ force: true });
  } catch {}
  const refresh = () => {
    if (!document.hidden) accountSession.refresh();
  };
  window.addEventListener("focus", refresh);
  window.addEventListener("online", refresh);
  document.addEventListener("visibilitychange", refresh);
  setInterval(refresh, 60000);
  accountSession.refresh();
}

