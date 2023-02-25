/* eslint-disable no-console */
import { streamArray } from "yield-stream";
import { ENCODER } from "../../globs/shared";
import { EventStream, TokenStream } from "../streaming";
import { OpenAIEdgeClient } from "../types";

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
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    }
  );

  if (!response.body) {
    throw new Error("No response body");
  }

  // const DECODER_STREAM = new TextDecoderStream();
  let outputStream: ReadableStream<Uint8Array>;

  if (stream) {
    switch (mode) {
      case "tokens":
        outputStream = TokenStream(response.body);
        break;
      case "raw":
        outputStream = EventStream(response.body);
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
        const { text } = json.choices?.[0] ?? {};

        if (typeof text !== "string") {
          console.error("No text choices received from OpenAI: " + stringResult);
          outputStream = streamArray([]);
          break;
        }

        const encoded = ENCODER.encode(text);
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

  /**
   * Decode UTF-8 text.
   */
  // return generateStream(
  //   async function* () {
  //     const DECODER = new TextDecoder();
  //     for await (const chunk of yieldStream(outputStream)) {
  //       yield DECODER.decode(chunk);
  //     }
  //   }
  // );
};