import createEncoder from "./webp_enc.js";
import { defaultOptions } from "./meta.js";
// Only our locally rendered RGBA is encoded. No decoder, network upload,
// SharedArrayBuffer or cross-origin-isolation permission is involved.
self.onmessage = async (event) => {
  try {
    const { width, height, rgba } = event.data;
    if (
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width < 1 ||
      height < 1 ||
      width > 16000 ||
      height > 16000 ||
      width * height > 32000000 ||
      !(rgba instanceof ArrayBuffer) ||
      rgba.byteLength !== width * height * 4
    )
      throw Error();
    const response = await fetch(new URL("./webp_enc.wasm", import.meta.url));
    if (!response.ok) throw Error();
    const module = await createEncoder({ wasmBinary: await response.arrayBuffer() }),
      result = module.encode(new Uint8ClampedArray(rgba), width, height, {
        ...defaultOptions,
        quality: 72,
        low_memory: 1,
      });
    if (!result?.byteLength) throw Error();
    const bytes = result.slice().buffer;
    self.postMessage({ ok: true, bytes }, [bytes]);
  } catch {
    self.postMessage({ ok: false });
  }
};

