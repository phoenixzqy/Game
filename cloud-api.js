function cloudError(code, message, status) {
  const error = Error(message || code);
  error.code = code;
  if (status !== undefined) error.status = status;
  return error;
}
// Shared playsnow account service, with a separate save slot for this game.
export class CloudAccountAPI {
  constructor(base = "https://api.playsnow.top", fetcher = globalThis.fetch.bind(globalThis)) {
    this.base = base;
    this.fetcher = fetcher;
  }
  async request(path, method = "GET", body) {
    const controller = new AbortController(),
      timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await this.fetcher(this.base + "/Game/api/" + path, {
        method,
        credentials: "include",
        signal: controller.signal,
        ...(body === undefined
          ? {}
          : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
      });
      let data;
      try {
        data = await response.json();
      } catch {
        throw cloudError("cloud.error.response");
      }
      if (!response.ok) {
        throw cloudError(
          response.status === 401 ? "cloud.error.auth" : "cloud.error.request",
          data.error,
          response.status,
        );
      }
      return data;
    } catch (e) {
      if (e.name === "AbortError") throw cloudError("cloud.error.timeout");
      if (e instanceof TypeError) throw cloudError("cloud.error.network");
      throw e;
    } finally {
      clearTimeout(timeout);
    }
  }
  me() {
    return this.request("auth/me");
  }
  auth(mode, username, password) {
    return this.request("auth/" + mode, "POST", { username, password });
  }
  logout() {
    return this.request("auth/logout", "POST", {});
  }
  read() {
    return this.request("games/maomao/save");
  }
  upload(revision, saveJson) {
    return this.request("games/maomao/save", "PUT", { revision, saveJson });
  }
}

