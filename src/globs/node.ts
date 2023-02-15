if (typeof window !== "undefined") {
  throw new Error("Node globals cannot be used in the browser.");
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not defined.");
}

export const { OPENAI_API_KEY, TWITTER_BEARER_TOKEN } = process.env;