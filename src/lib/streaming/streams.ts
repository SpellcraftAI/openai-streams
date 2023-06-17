import { ENCODER, DECODER } from "../../globs/shared";
import { ChatParser, TokenParser } from "./transforms";

import { createParser } from "eventsource-parser";
import { Transform, pipeline, yieldStream } from "yield-stream";
import { yieldStream as yieldStreamNode } from "yield-stream/node";
import { OpenAIError } from "../errors";

export type StreamMode = "raw" | "tokens";

export interface OpenAIStreamOptions {
  /**
   * Whether to return tokens or raw events.
   */
  mode?: StreamMode;

  /**
   * A function to run at the end of a stream. This is useful if you want
   * to do something with the stream after it's done, like log token usage.
   */
  onDone?: () => void | Promise<void>;
  /**
   * A function that runs for each token. This is useful if you want
   * to sum tokens used as they're returned.
   */
  onParse?: (token: string) => void | Promise<void>;
}

export type OpenAIStream = (
  stream: NodeJS.ReadableStream | ReadableStream<Uint8Array>,
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
  { mode = "tokens", onDone }
) => {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const parser = createParser(async (event) => {
        if (event.type === "event") {
          const { data } = event;
          /**
           * Break if event stream finished.
           */
          if (data === "[DONE]") {
            const controllerIsClosed = controller.desiredSize === null;
            if (!controllerIsClosed) {
              controller.close();
            }

            await onDone?.();
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

      // Check if the stream is a NodeJS stream or a browser stream.
      // @ts-ignore - TS doesn't know about `pipe` on streams.
      const isNodeJsStream = typeof stream.pipe === "function";

      /**
       * Feed the parser with decoded chunks from the raw stream.
       */
      for await (const chunk of isNodeJsStream
        ? yieldStreamNode<Buffer>(stream as NodeJS.ReadableStream)
        : yieldStream(stream as ReadableStream<Uint8Array>)
      ) {
        const decoded = DECODER.decode(chunk);

        try {
          const parsed = JSON.parse(decoded);

          if (parsed.hasOwnProperty("error"))
            controller.error(new Error(parsed.error.message));
        } catch (e) {}

        parser.feed(decoded);
      }
    },
  });
};

/**
 * Creates a handler that decodes the given stream into a string,
 * then pipes that string into the provided callback.
 */
const CallbackHandler = ({ onParse }: OpenAIStreamOptions) => {
  const handler: Transform  = async function* (chunk) {
    const decoded = DECODER.decode(chunk);
    onParse?.(decoded);
    if (decoded) {
      yield ENCODER.encode(decoded);
    }
  };

  return handler;
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
    TokenParser,
    CallbackHandler(options)
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
    ChatParser,
    CallbackHandler(options)
  );
};