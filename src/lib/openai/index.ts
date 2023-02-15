/* eslint-disable no-console */
import { streamArray } from "yield-stream";
import { ENCODER, OPENAI_API_KEY } from "../../globs";
import { EventStream, TokenStream } from "../streaming";
import { OpenAIAPIEndpoint, OpenAICreateArgs, OpenAIAPI } from "../types";

/**
 * Create a new completion stream. Stream of strings by default, set `mode:
 * 'raw'` for the raw stream of JSON objects.
 */
export const OpenAI: OpenAIAPI = async <T extends OpenAIAPIEndpoint>(
  endpoint: T,
  args: OpenAICreateArgs<T>,
  mode = "tokens"
) => {
  const stream = endpoint === "completions";
  const response = await fetch(
    `https://api.openai.com/v1/${endpoint}`,
    {
      method: "POST",
      body: JSON.stringify({
        ...args,
        stream: stream ? true : undefined,
      }),
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    }
  );

  if (!response.body) {
    throw new Error("No response body");
  }

  if (stream) {
    switch (mode) {
      case "tokens":
        return TokenStream(response.body);
      case "raw":
        return EventStream(response.body);
      default:
        throw new Error(`Invalid mode: ${mode}`);
    }
  }

  /**
   * Load the response in one shot.
   */
  const stringResult = await response.text();

  switch (mode) {
    case "tokens":
      const json = JSON.parse(stringResult);
      const { text } = json.choices?.[0] ?? {};

      if (typeof text !== "string") {
        console.error("No text choices received from OpenAI: " + stringResult);
        return streamArray([]);
      }

      const encoded = ENCODER.encode(text);
      return streamArray([encoded]);
    case "raw":
      const encodedJson = ENCODER.encode(stringResult);
      return streamArray([encodedJson]);
    default:
      throw new Error(`Invalid mode: ${mode}`);
  }
};