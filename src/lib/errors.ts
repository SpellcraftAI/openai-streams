export const OpenAIErrors = {
  "NO_API_KEY": "No API key provided. Please set the OPENAI_API_KEY environment variable or pass the { apiKey } option.",
  "MAX_TOKENS": "Maximum number of tokens reached.",
  "UNKNOWN": "An unknown error occurred.",
  "INVALID_API_KEY":  "Incorrect API key provided. You can find your API key at https://platform.openai.com/account/api-keys.",
  "INVALID_MODEL":  "The model does not exist",
  "RATE_LIMIT_REACHED": "You are sending requests too quickly. Pace your requests. Read the Rate limit guide.",
  "EXCEEDED_QUOTA": "You have hit your maximum monthly spend (hard limit) which you can view in the account billing section. Apply for a quota increase.",
  "ENGINE_OVERLOAD": "Our servers are experiencing high traffic. Please retry your requests after a brief wait.",
  "SERVER_ERROR": "Issue on our servers. Retry your request after a brief wait and contact us if the issue persists. Check the status page.",
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