import { EncryptedSaveStore as u } from "./site-assets/encrypted-save.js";
let r,
  n,
  s,
  i = Promise.resolve(),
  p = 0;
const f = crypto.randomUUID();
async function y() {
  r || ((r = new u()), await r.open());
  let e;
  try {
    e = await r.read();
  } catch (a) {
    if (((e = await r.read("previous")), !e)) throw a;
  }
  return (
    e?.sync?.ownerId != null && (e = void 0),
    {
      epoch: f,
      revision: ++p,
      cursor: 0,
      time: e?.time || 0,
      lastSaved: e?.lastSaved,
      sync: e?.sync,
      account: { id: 1, name: "\u672C\u673A\u5B58\u6863", guest: !1 },
      guestAvailable: !1,
      stage: "Select",
      roles: (Array.isArray(e?.roles) ? e.roles : []).map(
        ({ id: a, cloudId: t, name: o, job: l, gender: c, level: d }) => ({
          id: a,
          cloudId: t,
          name: o,
          job: l,
          gender: c,
          level: d,
        }),
      ),
      me: null,
      actors: [],
      mapMonsters: [],
      packets: [],
    }
  );
}
async function m() {
  return (
    s ||
      (s = import("./game-runtime/core.3b1609e2914f5317.js")
        .then(async (e) => (await e.initializeCore(), r?.close(), (n = e), e))
        .catch((e) => {
          throw ((s = null), e);
        })),
    s
  );
}
self.onmessage = (e) => {
  i = i.then(async () => {
    try {
      if (n) return n.handleCoreMessage(e);
      const { id: a, route: t } = e.data;
      return ["init", "entry", "open", "state", "pause", "save"].includes(t)
        ? self.postMessage({ id: a, result: await y() })
        : t === "world"
          ? self.postMessage({ id: a, result: { name: "\u65E7\u5883\u4F20\u8BF4", maps: [] } })
          : (await m()).handleCoreMessage(e);
    } catch (a) {
      self.postMessage({
        id: e.data.id,
        error: a.detail || { $text: "site.storage.load", params: {} },
      });
    }
  });
};

