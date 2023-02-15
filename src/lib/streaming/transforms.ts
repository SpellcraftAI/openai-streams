import { Transform } from "yield-stream";
import { ENCODER, DECODER } from "../../globs/shared";

/**
 * A transformer that receives chunks of parsed server sent events from OpenAI
 * and yields the text of the first choice.
 */
export const TokenParser: Transform = async function* (chunk) {
  const decoded = DECODER.decode(chunk);
  const message = JSON.parse(decoded);

  const { text } = message?.choices?.[0];
  if (!text) {
    return;
  }

  yield ENCODER.encode(text);
};

/**
 * A transformer that receives chunks of parsed server sent events from OpenAI
 * and yields the JSON of the first choice's logprobs.
 */
export const LogprobsParser: Transform = async function* (chunk) {
  const ENCODER = new TextEncoder();
  const DECODER = new TextDecoder();

  const decoded = DECODER.decode(chunk);
  const message = JSON.parse(decoded);

  const { logprobs } = message?.choices?.[0];
  if (!logprobs) {
    return;
  }

  yield ENCODER.encode(JSON.stringify(logprobs));
};