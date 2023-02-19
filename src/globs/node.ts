if (typeof window !== "undefined") {
  throw new Error("Node globals cannot be used in the browser.");
}

export {};