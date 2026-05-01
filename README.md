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

## Layout

```
server/src/        MCP server — tools, flows, resources
web/src/widgets/   React widgets rendered in the chat client
api/index.ts       Vercel serverless adapter
alpic.json         Alpic config
vercel.json        Vercel config
```

The server is platform-agnostic. `web/` widgets mount via `mountWidget(...)` from `skybridge/web`.

## Deploy

- **Alpic** — [![Deploy](https://assets.alpic.ai/button.svg)](https://app.alpic.ai/new/clone?repositoryUrl=https%3A%2F%2Fgithub.com%2FWaniWani-AI%2Fmcp-distribution-template)

- **Vercel** — [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FWaniWani-AI%2Fmcp-distribution-template)

## Docs

- Waniwani SDK: [docs.waniwani.ai](https://docs.waniwani.ai/introduction)
- MCP: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- Skybridge: [docs.skybridge.tech](https://docs.skybridge.tech)
- Vercel: [vercel.com](https://vercel.com)