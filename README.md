# OpenAI Streams

[**GitHub**](https://github.com/SpellcraftAI/openai-streams) |
[**NPM**](https://npmjs.com/package/openai-streams) |
[**Docs**](https://openai-streams.vercel.app)

> Now with ChatGPT API support! See [**Use with ChatGPT
> API**](#use-with-chatgpt-api). (Whisper coming soon!)

This library returns OpenAI API responses as streams only. Non-stream endpoints
like `edits` etc. are simply a stream with only one chunk update.

- Prioritizes streams, so you can display a completion as it arrives.
- Auto-loads `OPENAI_API_KEY` from `process.env`.
- One single function with inferred parameter type based on the endpoint you
  provide.

Uses `ReadableStream` by default for browser, Edge Runtime, and Node 18+, with
a `NodeJS.Readable` version available at `openai-streams/node`.

### Installation

```bash
yarn add openai-streams
# -or-
npm i --save openai-streams
```

### Usage

```ts
await OpenAI(
  /** 'completions', 'chat', etc. */
  ENDPOINT,
  /** max_tokens, temperature, messages, etc. */
  PARAMS,
  /** apiBase, apiKey, mode, controller, etc */
  OPTIONS
);
```

1. **Set the `OPENAI_API_KEY` env variable** (or pass the `{ apiKey }` option).

   The library will throw if it cannot find an API key. Your program will load
   this at runtime from `process.env.OPENAI_API_KEY` by default, but you may
   override this with the `{ apiKey }` option.

   **IMPORTANT:** For security, you should only load this from a `process.env`
   variable.

   ```ts
   await OpenAI(
     "completions",
     {
       /* endpoint params */
     },
     { apiKey: process.env.MY_SECRET_API_KEY }
   );
   ```

2. **Call the API via `await OpenAI(endpoint, params, options?)`.**

   The `params` type will be inferred based on the `endpoint` you provide, i.e.
   for the `"edits"` endpoint, `import('openai').CreateEditRequest` will be
   enforced.

   Example with `raw` streaming mode:

   ```ts
   await OpenAI(
     "chat",
     {
       messages: [
         /* ... */
       ],
     },
     { mode: "raw" }
   );
   ```

#### Edge/Browser: Consuming streams in Next.js Edge functions

This will also work in the browser, but you'll need users to paste their OpenAI
key and pass it in via the `{ apiKey }` option.

```ts
import { OpenAI } from "openai-streams";

export default async function handler() {
  const stream = await OpenAI("completions", {
    model: "text-davinci-003",
    prompt: "Write a happy sentence.\n\n",
    max_tokens: 100,
  });

  return new Response(stream);
}

export const config = {
  runtime: "edge",
};
```

#### Node: Consuming streams in Next.js API Route (Node)

If you cannot use an Edge runtime or want to consume Node.js streams for another
reason, use `openai-streams/node`:

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import { OpenAI } from "openai-streams/node";

export default async function test(_: NextApiRequest, res: NextApiResponse) {
  const stream = await OpenAI("completions", {
    model: "text-davinci-003",
    prompt: "Write a happy sentence.\n\n",
    max_tokens: 25,
  });

  stream.pipe(res);
}
```

<sub>See the example in
[`example/src/pages/api/hello.ts`](https://github.com/SpellcraftAI/openai-streams/blob/master/example/src/pages/api/hello.ts).</sub>
<sub>

#### Use with ChatGPT API

By default, with `mode = "tokens"`, you will receive just the message deltas.
For full events, use `mode = "raw"`.

See: https://platform.openai.com/docs/guides/chat/introduction

```ts
const stream = await OpenAI("chat", {
  model: "gpt-3.5-turbo",
  messages: [
    {
      role: "system",
      content: "You are a helpful assistant that translates English to French.",
    },
    {
      role: "user",
      content: 'Translate the following English text to French: "Hello world!"',
    },
  ],
});
```

In `tokens` mode, you will just receive the response chunks, which look like this
(separated with newlines for illustration):

```
Hello
!
 How
 can
 I
 assist
 you
 today
?
```

Use `mode = "raw"` for access to raw events.

### Notes

1. Internally, streams are often manipulated using generators via `for await
(const chunk of yieldStream(stream)) { ... }`. We recommend following this
   pattern if you find it intuitive.
