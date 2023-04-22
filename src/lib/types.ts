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
   * Whether to return tokens or raw events.
   */
  mode?: StreamMode;
  /**
   * An optional AbortController, which can be used to abort the request
   * mid-flight.
   */
  controller?: AbortController;
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
