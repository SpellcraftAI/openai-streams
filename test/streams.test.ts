/* eslint-disable no-console */
import "./env";
import test from "ava";

import { OpenAI } from "../src";
import { yieldStream } from "yield-stream";
import { DECODER } from "../src/globs/shared";
import nodeFetch from "node-fetch";

test.serial("'completions' endpoint", async (t) => {
  const stream = await OpenAI("completions", {
    model: "text-davinci-003",
    prompt: "Write a sentence.",
    max_tokens: 50,
  });

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
  const stream = await OpenAI("edits", {
    model: "text-davinci-edit-001",
    input: "helo wrld",
    instruction: "Fix spelling mistakes.",
  });

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

test.serial("mode = 'raw': error handling", async (t) => {
  const tokenStream = await OpenAI(
    "completions",
    {
      model: "text-davinci-003",
      prompt: "Write a long sentence.",
      max_tokens: 1,
    },
    { mode: "raw" }
  );

  const DECODER = new TextDecoder();
  for await (const serialized of yieldStream(tokenStream)) {
    const string = DECODER.decode(serialized);
    const json = JSON.parse(string);
    console.table(json.choices);
  }

  t.pass("Raw mode did not throw when user ran out of tokens.");
});

test.serial("mode = 'tokens': error handling", async (t) => {
  try {
    const tokenStream = await OpenAI(
      "completions",
      {
        model: "text-davinci-003",
        prompt: "Write a short sentence.",
        max_tokens: 5,
      },
      { mode: "tokens" }
    );

    const DECODER = new TextDecoder();
    for await (const serialized of yieldStream(tokenStream)) {
      const string = DECODER.decode(serialized);
      console.log(string.trim());
    }

    t.fail("Tokens mode did not throw when user ran out of tokens.");
  } catch (error) {
    t.snapshot(
      JSON.stringify(error, null, 2),
      "Tokens mode should throw for MAX_TOKENS."
    );
  }
});

test.serial("ChatGPT support", async (t) => {
  const stream = await OpenAI("chat", {
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "This is a test message, say hello!" },
    ],
  });

  const DECODER = new TextDecoder();
  for await (const serialized of yieldStream(stream)) {
    const string = DECODER.decode(serialized);
    console.log(string);
  }

  t.pass();
});

test.serial("API base support", async (t) => {
  const stream = await OpenAI(
    "chat",
    {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "This is a test message, say hello!" },
      ],
    },
    {
      apiBase: "https://oai.hconeai.com/v1",
    }
  );

  const DECODER = new TextDecoder();
  for await (const serialized of yieldStream(stream)) {
    const string = DECODER.decode(serialized);
    console.log(string);
  }

  t.pass();
});

const openaiOrganization = process.env.OPENAI_ORGANIZATION;
if (openaiOrganization === undefined) {
  console.log(
    "Skipping 'API headers support' test because $OPENAI_ORGANIZATION is not set."
  );
} else {
  test.serial("API headers support", async (t) => {
    const stream = await OpenAI(
      "chat",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "This is a test message, say hello!" },
        ],
      },
      {
        apiBase: "https://oai.hconeai.com/v1",
        apiHeaders: {
          "OpenAI-Organization": openaiOrganization,
        },
      }
    );

    const DECODER = new TextDecoder();
    for await (const serialized of yieldStream(stream)) {
      const string = DECODER.decode(serialized);
      console.log(string);
    }

    t.pass();
  });
}

test.serial("ChatGPT error propagation", async (t) => {
  try {
    const stream = await OpenAI(
      "chat",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that translates English to French.",
          },
          {
            role: "user",
            content:
              "Translate the following English text to French: \"Hello world!\"",
          },
        ],
      },
      { apiKey: "THIS_IS_A_FAKE_KEY" }
    );

    const DECODER = new TextDecoder();
    for await (const serialized of yieldStream(stream)) {
      const string = DECODER.decode(serialized);
      console.log(string);
    }
  } catch (e) {
    t.snapshot(e);
  }
});

test.serial("cancelling streams", async (t) => {
  const controller = new AbortController();

  const stream = await OpenAI(
    "completions",
    {
      model: "text-davinci-003",
      prompt: "Write two sentences.",
      max_tokens: 50,
    },
    {
      controller,
    }
  );

  /**
   * Write each chunk to the screen as one string.
   */
  let i = 0;
  const chunks: string[] = [];

  try {
    for await (const chunk of yieldStream(stream)) {
      i++;
      chunks.push(DECODER.decode(chunk));
      process.stdout.write(JSON.stringify(chunks));

      if (i >= 5) {
        controller.abort();
      }
    }
  } catch (e) {
    t.is(e.name, "AbortError", "Stream should have been aborted.");
  }

  t.is(i, 5, "Stream should have been cancelled after 5 chunks.");
});

test.serial("should work with custom fetch", async (t) => {
  let didUseMock = false;

  const mockFetch: typeof nodeFetch = (...params) => {
    didUseMock = true;
    return nodeFetch(...params);
  };

  const stream = await OpenAI("chat", {
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "This is a test message, say hello!" },
    ],
  }, { fetch: mockFetch });

  const DECODER = new TextDecoder();
  for await (const serialized of yieldStream(stream)) {
    const string = DECODER.decode(serialized);
    console.log(string);
  }

  t.true(didUseMock, "Did not use custom fetch.");
});
