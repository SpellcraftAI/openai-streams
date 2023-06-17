/* eslint-disable no-console */
export interface BackoffOptions {
  maxRetries: number;
  delay: number;
}

const globalFetch = typeof fetch === "undefined" ? undefined : fetch;

export const fetchWithBackoff = async (
  input: RequestInfo,
  init?: RequestInit,
  fetch?: typeof globalFetch,
  { delay, maxRetries }: BackoffOptions = {
    delay: 500,
    maxRetries: 7
  }
) => {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await (fetch || globalFetch!)(input, init);

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.type === "RATE_LIMIT_REACHED") {
          throw new Error("RATE_LIMIT_REACHED");
        }
      }

      return response;
    } catch (error: any) {
      if (
        error.message === "RATE_LIMIT_REACHED" &&
        i < maxRetries
      ) {
        console.log("Rate limit reached. Retrying in " + delay + "ms");
        await new Promise((resolve) => setTimeout(resolve, delay));

        delay *= 2;
      } else {
        throw error;
      }
    }
  }

  throw new Error("Max retries reached.");
};