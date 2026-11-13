export const maxRecordingMs = 25_000;
export const maxAudioBytes = 2 * 1024 * 1024;

const types = {
  "audio/webm": { extension: "webm", signature: [0x1a, 0x45, 0xdf, 0xa3], offset: 0 },
  "audio/ogg": { extension: "ogg", signature: [0x4f, 0x67, 0x67, 0x53], offset: 0 },
  "audio/mp4": { extension: "m4a", signature: [0x66, 0x74, 0x79, 0x70], offset: 4 },
  "audio/wav": { extension: "wav", signature: [0x52, 0x49, 0x46, 0x46], offset: 0 },
};

export function audioFormat(value: string) {
  const mime = value.split(";")[0].trim().toLowerCase();
  if (!Object.hasOwn(types, mime)) return undefined;
  return { mime, ...types[mime as keyof typeof types] };
}

export function validAudioHeader(bytes: Uint8Array, type: NonNullable<ReturnType<typeof audioFormat>>) {
  return bytes.length >= 32 && type.signature.every((value, index) => bytes[type.offset + index] === value)
    && (type.mime !== "audio/wav" || new TextDecoder().decode(bytes.subarray(8, 12)) === "WAVE");
}

export function microphoneAccessDenied(error: unknown): boolean {
  return error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError");
}
