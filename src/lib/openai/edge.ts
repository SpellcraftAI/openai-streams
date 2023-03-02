/* eslint-disable no-console */
import { streamArray } from "yield-stream";
import { ENCODER } from "../../globs/shared";
import { ChatStream, EventStream, getTokensFromResponse, TokenStream } from "../streaming";
import { OpenAIAPIEndpoints, OpenAIEdgeClient } from "../types";

/**
 * OpenAI Edge client.
 *
 * Create a new completion stream. Stream of strings by default, set `mode:
 * 'raw'` for the raw stream of JSON objects.
 */
export const OpenAI: OpenAIEdgeClient = async (
  endpoint,
  args,
  {
    mode = "tokens",
    apiKey = process.env.OPENAI_API_KEY,
  } = {}
) => {
  if (!apiKey) {
    throw new Error("No API key provided. Please set the OPENAI_API_KEY environment variable or pass the { apiKey } option.");
  }

  const shouldStream = endpoint === "completions" || endpoint === "chat";
  const path = OpenAIAPIEndpoints[endpoint];
  const response = await fetch(
    `https://api.openai.com/v1/${path}`,
    {
      method: "POST",
      body: JSON.stringify({
        ...args,
        stream: shouldStream ? true : undefined,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    }
  );

  if (!response.body) {
    throw new Error("No response body");
  }

  let outputStream: ReadableStream<Uint8Array>;
  const options = { mode };

  if (shouldStream) {
    switch (mode) {
      case "raw":
        outputStream = EventStream(response.body, options);
        break;

      case "tokens":
        switch (endpoint) {
          case "chat":
            outputStream = ChatStream(response.body, options);
            break;

          default:
            outputStream = TokenStream(response.body, options);
            break;
        }
        break;

      default:
        throw new Error(`Invalid mode: ${mode}`);
    }
  } else {
    /**
     * Load the response in one shot.
     */
    const stringResult = await response.text();

    switch (mode) {
      case "tokens":
        const json = JSON.parse(stringResult);
        const tokens = getTokensFromResponse(json);

        if (typeof tokens !== "string") {
          console.error("No text choices received from OpenAI: " + stringResult);
          outputStream = streamArray([]);
          break;
        }

        const encoded = ENCODER.encode(tokens);
        outputStream = streamArray([encoded]);
        break;
      case "raw":
        const encodedJson = ENCODER.encode(stringResult);
        outputStream = streamArray([encodedJson]);
        break;
      default:
        throw new Error(`Invalid mode: ${mode}`);
    }
  }

  return outputStream;
};