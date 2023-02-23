import { OpenAI as OpenAIEdge } from "./edge";
import { OpenAINode } from "../types";
import { Readable } from "stream";
import { yieldStream } from "yield-stream";

export const OpenAI: OpenAINode = async (
  endpoint,
  args,
  options,
) => {
  const stream = await OpenAIEdge(endpoint, args, options);
  const nodeStream = Readable.from(yieldStream(stream));

  return nodeStream;
};