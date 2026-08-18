# MCP Distribution Template

This project is a template for building MCP servers with the [`@waniwani/sdk`](https://docs.waniwani.ai) & [Skybridge](https://docs.skybridge.tech). It is a starting point for building your own MCP App.

## Quick start

```bash
cp .env.example .env   # add WANIWANI_API_KEY (https://docs.waniwani.ai/setup/api-key)
bun install            # or npm install / pnpm install
bun run dev            # or npm run dev
```

- DevTools: http://localhost:3000
- MCP endpoint: http://localhost:3000/mcp

To test in ChatGPT/Claude, expose the port with [ngrok](https://ngrok.com) or [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide), then add `<public-url>/mcp` under **Settings → Connectors → Create**.

> Inside Claude Code, just run `/waniwani-sdk tunnel` — the skill starts the dev server and opens a public tunnel for you.

## Run with Docker

```bash
docker build -t mcp-template .
docker run --rm -p 3000:3000 --env-file .env mcp-template
```

- MCP endpoint: http://localhost:3000/mcp
- Override the port with `-e PORT=8080 -p 8080:8080`.
- `--env-file .env` supplies `WANIWANI_API_KEY` and `WANIWANI_PUBLIC_KEY` (see `.env.example`).

## Layout

```
src/server.ts      MCP server — entry point, tool registration
src/search/        `search` tool — knowledge-base search
src/lib/waniwani.ts  Shared server-side WaniWani client
src/views/         React views rendered in the chat client
src/helpers.ts     Typed skybridge hooks inferred from the server
src/index.css      Tailwind entry — theme tokens + base styles
vite.config.ts     Vite + skybridge + Tailwind plugins
alpic.json         Alpic config
```

The template ships one tool out of the box — [`search`](#knowledge-base-search-tool),
which answers questions from your WaniWani knowledge base. Add your own in
`src/server.ts`. The server is platform-agnostic.

### Add a tool

```ts
const server = new McpServer({ name: "…", version: "0.0.1" }, { capabilities: {} })
  .registerTool(
    {
      name: "search-trips",
      description: "Search available trips.",
      inputSchema: { destination: z.string() },
    },
    async ({ destination }) => ({
      structuredContent: { results: [] },
      content: [{ type: "text", text: `Searched ${destination}` }],
    }),
  );
```

Keep the `withWaniwani(server)` call **below** your registrations.

### Add a view

Drop a `.tsx` file in `src/views/` that **default-exports** a React component —
skybridge mounts it for you, so there is no `mountView(...)` call to write. Then
point a tool at it with `view: { component: "<filename>" }`:

```ts
  view: { component: "trip-results" }, // → src/views/trip-results.tsx
```

Read the tool's data inside the view with the typed hook from `src/helpers.ts`
(the tool name autocompletes), and style it with Tailwind classes. Each view is
its own bundle entry, so **import `@/index.css` in every view**:

```tsx
import "@/index.css";
import { useToolInfo } from "@/helpers";

export default function TripResults() {
  const { isSuccess, output } = useToolInfo<"search-trips">();
  if (!isSuccess) return <p className="p-4 text-sm text-ink-muted">Loading…</p>;

  return (
    <ul className="flex flex-col gap-2 p-4">
      {output.results.map((trip) => (
        <li key={trip.id} className="rounded-xl bg-surface-muted p-3 text-sm">
          {trip.name}
        </li>
      ))}
    </ul>
  );
}
```

## Styling

Views are styled with [Tailwind CSS v4](https://tailwindcss.com), wired through
the `@tailwindcss/vite` plugin — there is no `tailwind.config.js`, all
configuration lives in `src/index.css`:

- `@theme` defines the design tokens. Each one generates utilities, so
  `--color-ink` gives you `text-ink` / `bg-ink` and `--font-sans` gives you
  `font-sans`. **Rebrand the template by editing these values** — the shipped
  set (`ink`, `ink-muted`, `surface`, `surface-muted`, Inter) is a placeholder.
- `@custom-variant dark` points the `dark:` variant at a `.dark` class instead
  of the OS `prefers-color-scheme`, because the chat client hands the colour
  scheme to the view rather than to the browser. Read it with skybridge's
  `useLayout()` and put the class on your wrapper element:

```tsx
import { useLayout } from "skybridge/web";

const { theme } = useLayout(); // "light" | "dark"
return <div className={theme === "dark" ? "dark" : ""}>{/* … */}</div>;
```

Utility classes are the default; reach for plain CSS in `src/index.css` only for
things utilities can't express (keyframes, third-party overrides).

## Knowledge base (`search` tool)

The template ships with a `search` tool that runs semantic search
(`wani.kb.search`) over your WaniWani knowledge base and answers general
product questions from the passages it gets back.

Manage the knowledge base content from the WaniWani dashboard — the tool reads
it at runtime. Requires `WANIWANI_API_KEY`. Tune retrieval via the search
options in [`src/search/index.ts`](src/search/index.ts) (`topK`, `minScore`,
`metadata`), and delete `src/search/` if you don't need it.

## Analytics

`withWaniwani(server)` wraps every registered tool to report calls to WaniWani.
Requires `WANIWANI_API_KEY`. Call it **after** registering your tools — it walks
the already-registered tools and wraps each handler in place.

## Deploy

`bun run build` (i.e. `skybridge build`) compiles the server to `dist/`, builds
the views, and additionally emits a native Vercel [Build Output API][bo] tree
under `.vercel/output/` — so no `vercel.json` or serverless adapter is needed.

[bo]: https://vercel.com/docs/build-output-api

For a managed deploy, choose Alpic or Vercel. To run it on your own infrastructure, self-host the Docker image.

[![Deploy](https://assets.alpic.ai/button.svg)](https://app.alpic.ai/new/clone?repositoryUrl=https%3A%2F%2Fgithub.com%2FWaniWani-AI%2Fmcp-distribution-template)

OR

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FWaniWani-AI%2Fmcp-distribution-template)

### Self-host with Docker

The template ships a production `Dockerfile`, so you can deploy it to anything that runs containers (a VPS, Fly.io, Railway, Render, Cloud Run, Kubernetes, …). Build the image and run the container — see [Run with Docker](#run-with-docker) for the commands. For a hosted deployment:

- Publish the image to your registry (or build it on the host), then run the container behind your platform's router.
- The MCP endpoint is served at `http://<your-host>/mcp` — port `3000` by default. Set `PORT` to match your platform and map it, e.g. `-e PORT=8080 -p 8080:8080`.
- Supply `WANIWANI_API_KEY` and `WANIWANI_PUBLIC_KEY` as environment variables / secrets on the host rather than baking a `.env` file into the image.

## Docs

- Waniwani SDK: [docs.waniwani.ai](https://docs.waniwani.ai/introduction)
- MCP: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- Skybridge: [docs.skybridge.tech](https://docs.skybridge.tech)
- Vercel: [vercel.com](https://vercel.com)