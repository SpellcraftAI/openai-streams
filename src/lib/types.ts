import type { CreateCompletionRequest, CreateEditRequest, CreateEmbeddingRequest, CreateFineTuneRequest, CreateImageRequest } from "./pinned";

export type StreamMode = "raw" | "tokens";

export type OpenAIAPIEndpoint =
"completions" |
"edits" |
"embeddings" |
"images" |
"fine-tunes";

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
            : never;

export type OpenAIOptions = {
  /**
   * By default, the API key is read from the OPENAI_API_KEY environment
   * variable. You can override this by passing a different key here.
   */
  apiKey?: string;
  /**
   * Whether to return tokens or raw events.
   */
  mode?: StreamMode;
};

export type OpenAIAPI = <T extends OpenAIAPIEndpoint>(
  endpoint: T,
  args: OpenAICreateArgs<T>,
  options?: OpenAIOptions
) => Promise<ReadableStream<Uint8Array>>;

export * from "./pinned";