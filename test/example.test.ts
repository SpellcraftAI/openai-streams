import "./env";
import test from "ava";
import { OpenAI } from "../src/lib";
import { yieldStream } from "yield-stream";
import { DECODER } from "../src/globs";

test("'completions' endpoint", async (t) => {
  const result = await OpenAI(
    "completions",
    {
      model: "text-davinci-003",
      prompt: "Write a sentence.",
      max_tokens: 50
    }
  );

  /**
   * Write each chunk to the screen as one string.
   */
  const chunks: string[] = [];
  for await (const chunk of yieldStream(result)) {
    chunks.push(DECODER.decode(chunk));
    process.stdout.write(chunks.join("").trim());
  }

  t.pass();
});

test("'edits' endpoint", async (t) => {
  const result = await OpenAI(
    "edits",
    {
      model: "text-davinci-edit-001",
      input: "helo wrld",
      instruction: "Fix spelling mistakes."
    }
  );

  /**
   * Write each chunk to the screen as one string.
   */
  const chunks: string[] = [];
  for await (const chunk of yieldStream(result)) {
    chunks.push(DECODER.decode(chunk));
    process.stdout.write(chunks.join("").trim());
  }

  t.pass();
});