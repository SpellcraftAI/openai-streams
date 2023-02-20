import { OpenAI } from "openai-streams";

export default async function handler() {
  const stream = await OpenAI(
    "completions",
    {
      model: "text-davinci-003",
      prompt: "Write a sentence.\n\n",
      max_tokens: 100
    }
  );

  return new Response(stream);
}

export const config = {
  runtime: "edge"
};