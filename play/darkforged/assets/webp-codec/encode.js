// Local, one-shot encoder worker. Transferring the fresh canvas RGBA buffer and
// terminating the worker after each image releases its WebAssembly heap.
export function isWebP(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return (
    b.length >= 20 &&
    b[0] === 82 &&
    b[1] === 73 &&
    b[2] === 70 &&
    b[3] === 70 &&
    b[8] === 87 &&
    b[9] === 69 &&
    b[10] === 66 &&
    b[11] === 80 &&
    new DataView(b.buffer, b.byteOffset, b.byteLength).getUint32(4, true) + 8 === b.length
  );
}
export async function encodeWebP(image) {
  const { width, height, data } = image;
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > 16000 ||
    height > 16000 ||
    width * height > 32000000 ||
    data.length !== width * height * 4
  )
    throw Error("Invalid share image");
  const rgba =
    data.byteOffset === 0 && data.byteLength === data.buffer.byteLength
      ? data.buffer
      : data.slice().buffer;
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./encode-worker.js", import.meta.url), { type: "module" });
    const stop = () => {
        clearTimeout(timer);
        worker.terminate();
      },
      fail = () => {
        stop();
        reject(Error("Local WebP encoding failed"));
      },
      timer = setTimeout(fail, 90000);
    worker.onerror = fail;
    worker.onmessageerror = fail;
    worker.onmessage = (event) => {
      const value = event.data;
      if (!value?.ok || !(value.bytes instanceof ArrayBuffer) || !isWebP(value.bytes)) {
        fail();
        return;
      }
      stop();
      resolve(new Blob([value.bytes], { type: "image/webp" }));
    };
    try {
      worker.postMessage({ width, height, rgba }, [rgba]);
    } catch {
      fail();
    }
  });
}

