import type {
  CreateChatCompletionRequest,
  CreateCompletionRequest,
  CreateEditRequest,
  CreateEmbeddingRequest,
  CreateFineTuneRequest,
  CreateImageRequest,
} from "./pinned";

export type StreamMode = "raw" | "tokens";

export const OpenAIAPIEndpoints = {
  chat: "chat/completions",
  completions: "completions",
  edits: "edits",
  embeddings: "embeddings",
  images: "images",
  "fine-tunes": "fine-tunes",
} as const;

export type OpenAIAPIEndpoint = keyof typeof OpenAIAPIEndpoints;

export type OpenAICreateArgs<T extends OpenAIAPIEndpoint> =
  T extends "completions"
    ? Omit<CreateCompletionRequest, "stream">
    : T extends "edits"
      ? CreateEditRequest
      : T extends "embeddings"
        ? CreateEmbeddingRequest
        : T extends "images"
          ? CreateImageRequest
          : T extends "fine-tunes"
            ? CreateFineTuneRequest
            : T extends "chat"
              ? CreateChatCompletionRequest
              : never;

export type OpenAIOptions = {
  /**
   * By default, the API base is https://api.openai.com/v1, corresponding
   * to OpenAIs API. You can override this to use a different provider or proxy.
   */
  apiBase?: string;
  /**
   * By default, the API key is read from the OPENAI_API_KEY environment
   * variable. You can override this by passing a different key here.
   */
  apiKey?: string;
  /**
   * Additional headers to pass to the API. This is useful is you want to
   * pass additional parameters to a proxy service, for instance.
   */
  apiHeaders?: Record<string, string>;
  /**
   * Whether to return tokens or raw events.
   */
  mode?: StreamMode;
  /**
   * An optional AbortController, which can be used to abort the request
   * mid-flight.
   */
  controller?: AbortController;
  /**
   * A function to run at the end of a stream. This is useful if you want
   * to do something with the stream after it's done, like log token usage.
   */
  onDone?: () => Promise<void>;
  /**
   * A function that runs for each token. This is useful if you want
   * to sum tokens used as they're returned.
   */
  onParse?: (token: string) => void;
};

/**
 * The OpenAI API client for Edge runtime.
 */
export type OpenAIEdgeClient = <T extends OpenAIAPIEndpoint>(
  endpoint: T,
  args: OpenAICreateArgs<T>,
  options?: OpenAIOptions
) => Promise<ReadableStream<Uint8Array>>;

export type OpenAINodeClient = <T extends OpenAIAPIEndpoint>(
  endpoint: T,
  args: OpenAICreateArgs<T>,
  options?: OpenAIOptions
) => Promise<NodeJS.ReadableStream>;

export * from "./pinned";
