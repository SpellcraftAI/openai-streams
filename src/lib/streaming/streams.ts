import { ENCODER, DECODER } from "../../globs/shared";
import { ChatParser, TokenParser } from "./transforms";

import { createParser } from "eventsource-parser";
import { pipeline, yieldStream } from "yield-stream";
import { OpenAIError } from "../errors";
import { StreamMode } from "../types";

export type OpenAIStreamOptions = {
  mode: StreamMode;
};

export type OpenAIStream = (
  stream: ReadableStream<Uint8Array>,
  options: OpenAIStreamOptions
) => ReadableStream<Uint8Array>;

/**
 * A `ReadableStream` of server sent events from the given OpenAI API stream.
 *
 * @note This can't be done via a generator while using `createParser` because
 * there is no way to yield from within the callback.
 */
export const EventStream: OpenAIStream = (
  stream,
  { mode = "tokens" }
) => {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const parser = createParser((event) => {
        if (event.type === "event") {
          const { data } = event;
          /**
           * Break if event stream finished.
           */
          if (data === "[DONE]") {
            controller.close();
            return;
          }
          /**
           * Verify we have a valid JSON object and then enqueue it.
           */
          try {
            const parsed = JSON.parse(data);
            controller.enqueue(ENCODER.encode(data));

            /**
             * In `tokens` mode, if the user runs out of tokens and the stream
             * does not complete, we will throw a MAX_TOKENS error. In `raw`
             * mode, we leave it up to the user to handle this.
             *
             * This requires iterating over result.choices[] and throwing an
             * error if any of them have `{ finish_reason: "length" }`.
             */
            if (mode === "tokens" && parsed?.choices) {
              const { choices } = parsed;
              for (const choice of choices) {
                if (choice?.finish_reason === "length") {
                  throw new OpenAIError("MAX_TOKENS");
                }
              }
            }
          } catch (e) {
            controller.error(e);
          }
        }
      });
      /**
       * Feed the parser with decoded chunks from the raw stream.
       */
      for await (const chunk of yieldStream(stream)) {
        parser.feed(DECODER.decode(chunk));
      }
    },
  });
};

/**
 * A `ReadableStream` of parsed tokens from the given OpenAI API stream.
 */
export const TokenStream: OpenAIStream = (
  stream,
  options = { mode: "tokens" }
) => {
  return pipeline(
    EventStream(stream, options),
    TokenParser
  );
};

/**
 * A `ReadableStream` of parsed deltas from the given ChatGPT stream.
 */
export const ChatStream: OpenAIStream = (
  stream,
  options = { mode: "tokens" }
) => {
  return pipeline(
    EventStream(stream, options),
    ChatParser
  );
};