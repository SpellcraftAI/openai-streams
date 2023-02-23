export const RUNTIME = globalThis.process?.versions?.node ? "node" : "edge";
export const ENCODER = new TextEncoder();
export const DECODER = new TextDecoder();