import { yieldStream } from "yield-stream";
import { OpenAINodeClient } from "../types";
import { OpenAI } from "./edge";

/**
 * A Node.js client for OpenAI's API, using NodeJS.Readable.
 *
 *  Create a new completion stream. Stream of strings by default, set `mode:
 * 'raw'` for the raw stream of JSON objects.
 */
export const OpenAINode: OpenAINodeClient = async (
  endpoint,
  args,
  options,
) => {
  const { Readable } = await import("stream");
  const stream = await OpenAI(endpoint, args, options);
  const nodeStream = Readable.from(yieldStream(stream));

  return nodeStream;
};