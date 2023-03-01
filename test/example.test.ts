/* eslint-disable no-console */
import "./env";
import test from "ava";

import { OpenAI } from "../src";
import { yieldStream } from "yield-stream";
import { DECODER } from "../src/globs/shared";

test.serial("'completions' endpoint", async (t) => {
  const stream = await OpenAI(
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
  for await (const chunk of yieldStream(stream)) {
    chunks.push(DECODER.decode(chunk));
    process.stdout.write(chunks.join("").trim());
  }

  t.pass();
});

test.serial("'edits' endpoint", async (t) => {
  const stream = await OpenAI(
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
  for await (const chunk of yieldStream(stream)) {
    chunks.push(DECODER.decode(chunk));
    process.stdout.write(chunks.join("").trim());
  }

  t.pass();
});

test.serial("error handling", async (t) => {
  try {
    const stream = await OpenAI(
      "completions",
      {
        model: "text-davinci-003",
        prompt: "Write a short sentence.",
        max_tokens: 5
      },
      {
        mode: "raw"
      }
    );

    const DECODER = new TextDecoder();
    for await (const serialized of yieldStream(stream)) {
      const string = DECODER.decode(serialized);
      console.table(JSON.parse(string).choices);
    }

    t.fail("Did not throw when user ran out of tokens.");
  } catch (error) {
    t.snapshot(JSON.stringify(error, null, 2), "Should throw for MAX_TOKENS.");
  }
});

test.serial("ChatGPT support", async (t) => {
  const stream = await OpenAI(
    "chat",
    {
      model: "gpt-3.5-turbo",
      messages: [
        { "role": "system", "content": "You are a helpful assistant that translates English to French." },
        { "role": "user", "content": "Translate the following English text to French: \"Hello world!\"" }
      ],
    },
  );

  const DECODER = new TextDecoder();
  for await (const serialized of yieldStream(stream)) {
    const string = DECODER.decode(serialized);
    console.log(string);
  }

  t.pass();
});