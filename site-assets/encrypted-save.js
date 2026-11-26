class y extends Error {
  constructor(e) {
    (super(e),
      (this.name = "SiteSaveError"),
      (this.detail = { $text: "site.storage." + e, params: {} }));
  }
}
const v = "backmir-local-aesgcm-v1",
  w = "__backmir_local_key_v1",
  S = new TextEncoder().encode("backmir.org/local-save/v1"),
  m = (c) => c?.format === v;
async function f(c, e) {
  const t = crypto.getRandomValues(new Uint8Array(12)),
    s = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: t, additionalData: S },
      c,
      new TextEncoder().encode(JSON.stringify(e)),
    );
  return { format: v, iv: t, ciphertext: s };
}
async function b(c, e) {
  if (e !== void 0) {
    if (!m(e)) throw new y("format");
    try {
      return JSON.parse(
        new TextDecoder().decode(
          await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: e.iv, additionalData: S },
            c,
            e.ciphertext,
          ),
        ),
      );
    } catch {
      throw new y("integrity");
    }
  }
}
const p = (c) =>
  new Promise((e, t) => {
    ((c.oncomplete = e),
      (c.onabort = () => {
        const s = new y("transaction");
        (c.error?.name === "QuotaExceededError" &&
          (s.detail = { $text: "storage.quota", params: {} }),
          t(s));
      }),
      (c.onerror = () => {}));
  });
class k {
  constructor(e = "dream-mir-typescript-v1") {
    ((this.name = e), (this.ownerId = null));
  }
  storageKey(e, t = this.ownerId) {
    return `partition:${t === null ? "guest" : "account:" + encodeURIComponent(t)}:${e}`;
  }
  selectOwner(e) {
    this.ownerId = e;
  }
  async transact(e) {
    const t = this.db.transaction("saves", "readwrite"),
      s = p(t);
    try {
      e(t.objectStore("saves"), t);
    } catch (o) {
      throw (t.abort(), await s.catch(() => {}), o);
    }
    await s;
  }
  async open() {
    if (!crypto?.subtle) throw new y("secure");
    this.db = await new Promise((r, a) => {
      const d = indexedDB.open(this.name, 1);
      ((d.onupgradeneeded = () => d.result.createObjectStore("saves")),
        (d.onsuccess = () => r(d.result)),
        (d.onerror = () => a(new y("open"))));
    });
    const e = this.db.transaction("saves", "readonly"),
      t = e.objectStore("saves"),
      s = t.getAll(),
      o = t.getAllKeys();
    await p(e);
    const n = o.result.map((r, a) => [r, s.result[a]]),
      u = n.find(([r]) => r === w)?.[1];
    if (!u && n.some(([, r]) => m(r))) throw new y("missingKey");
    if (
      ((this.key =
        u ||
        (await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, !1, [
          "encrypt",
          "decrypt",
        ]))),
      this.key.type !== "secret" ||
        this.key.extractable ||
        this.key.algorithm?.name !== "AES-GCM" ||
        this.key.algorithm.length !== 256)
    )
      throw new y("invalidKey");
    const l = n.filter(([r, a]) => r !== w && !m(a)),
      h = await Promise.all(l.map(async ([r, a]) => [r, await f(this.key, a)])),
      g = new Map(n.filter(([r]) => r !== w));
    for (const [r, a] of h) g.set(r, a);
    const i = [];
    for (const [r, a] of g)
      if (
        [
          "current",
          "previous",
          "before-cloud-read",
          "before-cloud-merge",
          "cloud-merge-remote",
          "before-dream-runtime-v1",
        ].includes(r) ||
        /^before-world-v\d+$/.test(r)
      ) {
        r === "current" &&
          !g.has("legacy-current-original") &&
          i.push(["legacy-current-original", a]);
        const d = this.storageKey(r, null);
        g.has(d) || i.push([d, a]);
      }
    (!u || h.length || i.length) &&
      (await this.transact((r) => {
        r.put(this.key, w);
        for (const [a, d] of [...h, ...i]) r.put(d, a);
      }));
  }
  async read(e = "current") {
    if (e === w) throw new y("reserved");
    const t = this.db.transaction("saves", "readonly"),
      s = t.objectStore("saves").get(this.storageKey(e));
    return (await p(t), b(this.key, s.result));
  }
  async readOwner(e, t = "current") {
    if (t === w) throw new y("reserved");
    const s = this.db.transaction("saves", "readonly"),
      o = s.objectStore("saves").get(this.storageKey(t, e));
    return (await p(s), b(this.key, o.result));
  }
  async guestBinding() {
    const e = this.db.transaction("saves", "readonly"),
      t = e.objectStore("saves").get("guest-bound-owner");
    return (await p(e), (await b(this.key, t.result)) ?? null);
  }
  async bindGuest(e, t, s, o) {
    const [n, u, l, h] = await Promise.all([
      f(this.key, t),
      f(this.key, e),
      s === void 0 ? void 0 : f(this.key, s),
      o === void 0 ? void 0 : f(this.key, o),
    ]);
    let g = !1;
    try {
      await this.transact((i, r) => {
        const a = i.get("guest-bound-owner");
        a.onsuccess = () => {
          if (a.result !== void 0) {
            ((g = !0), r.abort());
            return;
          }
          try {
            if (l)
              for (const d of ["before-cloud-merge", "before-cloud-read", "previous"])
                i.put(l, this.storageKey(d, e));
            (h && i.put(h, this.storageKey("cloud-merge-remote", e)),
              i.put(u, "guest-bound-owner"),
              i.put(n, this.storageKey("current", e)));
          } catch {
            r.abort();
          }
        };
      });
    } catch (i) {
      throw g ? Error("guestBound") : i;
    }
  }
  async backupOnce(e, t) {
    if (e === w) throw new y("reserved");
    const s = await f(this.key, t);
    await this.transact((o, n) => {
      const u = o.get(this.storageKey(e));
      u.onsuccess = () => {
        try {
          u.result === void 0 && o.put(s, this.storageKey(e));
        } catch {
          n.abort();
        }
      };
    });
  }
  async merge(e, t, s, o = !0) {
    const [n, u, l] = await Promise.all([
      f(this.key, e),
      f(this.key, t),
      s === void 0 ? void 0 : f(this.key, s),
    ]);
    await this.transact((h, g) => {
      const i = h.get(this.storageKey("current"));
      i.onsuccess = () => {
        try {
          const r = l ?? i.result;
          if (r)
            for (const a of o
              ? ["before-cloud-merge", "before-cloud-read", "previous"]
              : ["before-cloud-read", "previous"])
              h.put(r, this.storageKey(a));
          (h.put(u, this.storageKey(o ? "cloud-merge-remote" : "auto-cloud-remote")),
            h.put(n, this.storageKey("current")));
        } catch {
          g.abort();
        }
      };
    });
  }
  async write(e, t = !1, s) {
    if (s === w) throw new y("reserved");
    const o = await f(this.key, e);
    await this.transact((n, u) => {
      const l = n.get(this.storageKey("current"));
      l.onsuccess = () => {
        try {
          (l.result &&
            (s && n.put(l.result, this.storageKey(s)),
            t || n.put(l.result, this.storageKey("previous"))),
            n.put(o, this.storageKey("current")));
        } catch {
          u.abort();
        }
      };
    });
  }
  async writeOwner(e, t) {
    const s = await f(this.key, e);
    await this.transact((o) => o.put(s, this.storageKey("current", t)));
  }
  close() {
    this.db?.close();
  }
}
export {
  k as EncryptedSaveStore,
  y as SiteSaveError,
  m as isEncryptedSave,
  b as openSave,
  f as sealSave,
};

