export const OpenAIErrors = {
  "NO_API_KEY": "No API key provided. Please set the OPENAI_API_KEY environment variable or pass the { apiKey } option.",
  "MAX_TOKENS": "Maximum number of tokens reached.",
  "UNKNOWN": "An unknown error occurred.",
} as const;

export type OpenAIErrorType = keyof typeof OpenAIErrors;
export type OpenAIErrorMessage = typeof OpenAIErrors[OpenAIErrorType];

export class OpenAIError extends Error {
  type: OpenAIErrorType;
  message: OpenAIErrorMessage;

  constructor(
    type: OpenAIErrorType,
  ) {
    const message = OpenAIErrors[type];

    super(message);
    this.message = message;
    this.type = type;
  }

  toJSON() {
    return {
      type: this.type,
      message: this.message,
    };
  }
}