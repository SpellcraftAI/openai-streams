import { Readable } from "stream";
import { yieldStream } from "yield-stream";
import { OpenAINodeClient } from "../types";
import { OpenAI as OpenAIEdge } from "./edge";

/**
 * A Node.js client for OpenAI's API, using NodeJS.Readable.
 *
 *  Create a new completion stream. Stream of strings by default, set `mode:
 * 'raw'` for the raw stream of JSON objects.
 *
 * @note Use `openai-streams/edge` for Edge Runtime or Browser.
 */
export const OpenAI: OpenAINodeClient = async (
  endpoint,
  args,
  options,
) => {
  const stream = await OpenAIEdge(endpoint, args, options);
  const nodeStream = Readable.from(yieldStream(stream));

  return nodeStream;
};