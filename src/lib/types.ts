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
   * The name of the environment variable that contains the OpenAI API key. We
   * will not let you pass a raw string, only the name to read from process.env,
   * e.g. `"MY_SECRET_KEY"` will read from `process.env.MY_SECRET_KEY`.
   */
  envKey?: string;
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