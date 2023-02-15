# OpenAI Streams

- **Docs: https://openai-streams.vercel.app**

This library returns OpenAI API responses as streams only. Non-stream endpoints
like `edits` etc. are simply a stream with only one chunk update. 

It simplifies the following:

1. Prioritizing streaming and type inference.
2. Auto-loads `OPENAI_API_KEY` from `process.env`.
3. Uses the same function for all endpoints, and switches the type based on the
   `OpenAI(endpoint, ...)` signature.

Overall, the library aims to make it as simple to call the API as possible and
stream updates in.

### Usage

1. **Set the `OPENAI_API_KEY` env variable.**

   The runtime will throw if this is not available.

2. **Call the API via `await OpenAI(endpoint, params)`.**

   The `params` type will be inferred based on the `endpoint` you provide, i.e.
   for the `"edits"` endpoint, `import('openai').CreateEditRequest` will be
   enforced.

#### Example: Consuming streams in Next.js Edge functions

```ts
export default async function test() {
  const stream = await OpenAI(
    "completions",
    {
      model: "text-davinci-003",
      prompt: "Write a two-sentence paragraph.\n\n",
      temperature: 1,
      max_tokens: 100,
    },
  );

  return new Response(completionsStream);
}
```

### Notes

1. Internally, streams are often manipulated using generators via `for await
   (const chunk of yieldStream(stream)) { ... }`. We recommend following this
   pattern if you find it intuitive.