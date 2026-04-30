# MCP Distribution Template

A template for building MCP servers with [Skybridge](https://docs.skybridge.tech) and [WaniWani](https://waniwani.com/) — guided conversation flows, interactive widgets, and analytics, deployable to either [Alpic](https://alpic.ai/) or [Vercel](https://vercel.com/).

The repo ships with a minimal reference flow (an investment-portfolio picker — three nodes, one widget) so you can run it end-to-end before stripping it out and writing your own.

## What's inside

```
server/src/        Your MCP server (tools, flows, resources)
web/src/widgets/   React components rendered inside the chat client
api/index.ts       Vercel serverless adapter
alpic.json         Alpic deployment config
vercel.json        Vercel deployment config
```

## Getting Started

### Prerequisites

- Node.js 24+
- An HTTP tunnel such as [ngrok](https://ngrok.com/download) or [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide) for testing with ChatGPT

### Setup

```bash
cp .env.example .env   # add your WaniWani API key (https://docs.waniwani.ai/setup/api-key)
npm install
```

### Local Development

```bash
npm run dev
```

- DevTools: http://localhost:3000/
- MCP endpoint: http://localhost:3000/mcp

### Connect to ChatGPT

1. Expose your local server with a tunnel:
   ```bash
   # ngrok (requires account)
   ngrok http 3000

   # or cloudflared (anonymous quick tunnel, no login)
   cloudflared tunnel --url http://localhost:3000
   ```
2. In ChatGPT, go to **Settings → Connectors → Create** and add the public URL suffixed with `/mcp` (e.g. `https://abc123.ngrok-free.app/mcp` or `https://<random>.trycloudflare.com/mcp`).

## Deployment

The MCP server in [`server/`](server/) is platform-agnostic. Pick a target:

### Alpic (long-running Node, stateful sessions)

One-click clone:

[![Deploy on Alpic](https://assets.alpic.ai/button.svg)](https://app.alpic.ai/new/clone?repositoryUrl=https%3A%2F%2Fgithub.com%2FWaniWani-AI%2Fmcp-distribution-template)

Or build locally with `npm run build:alpic` and follow the [Alpic CLI docs](https://docs.alpic.ai/).

### Vercel (serverless)

Push to a Vercel project. The build is wired through [`vercel.json`](vercel.json) and [`api/index.ts`](api/index.ts), which wraps the same server in an Express handler.

> **Note on sessions:** serverless invocations are stateless, so [`api/index.ts`](api/index.ts) derives a stable session ID from `IP + user-agent` as a fallback for clients (like Claude.ai) whose proxies strip the `Mcp-Session-Id` header.

Once deployed, add your MCP URL in ChatGPT under **Settings → Connectors → Create**.

## Customizing

- **Tools and flows** live in [`server/src/`](server/src/). Replace the `journey/` directory with your own.
- **Widgets** live in [`web/src/widgets/`](web/src/widgets/) and are mounted via `mountWidget(...)` from `skybridge/web`.
- Use the [`@waniwani/sdk`](https://docs.waniwani.ai/) for event tracking, multi-step flows, knowledge base search, and chat components.

## Resources

- [Skybridge Documentation](https://docs.skybridge.tech)
- [WaniWani Documentation](https://docs.waniwani.ai/introduction)
- [Alpic Documentation](https://docs.alpic.ai/)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
