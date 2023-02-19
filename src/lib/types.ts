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

export type OpenAIAPI = <T extends OpenAIAPIEndpoint>(
  endpoint: T,
  args: OpenAICreateArgs<T>,
  mode?: StreamMode
) => Promise<ReadableStream<Uint8Array>>;

export * from "./pinned";