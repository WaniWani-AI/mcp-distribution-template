# Self-hosted agent runtime

The chat on your own website can run against an agent inside your network, on the configuration
you publish in WaniWani. Set `WANIWANI_AGENT_EVE_URL` and this server mounts `/agent/v1` beside
`/mcp`. Leave it unset and the server is what it was.

The agent itself is a second container, published from
[WaniWani-AI/agent](https://github.com/WaniWani-AI/agent). Its
[`compose.yaml`](https://github.com/WaniWani-AI/agent/blob/main/compose.yaml) is the reference
deployment: an `eve` service and the Postgres holding its sessions. The
[operator guide](https://github.com/WaniWani-AI/agent/blob/main/docs/self-hosted-agent.md) there
covers enrolment, the model, analytics and every variable the runtime reads.

## Where it runs

Run this server as a container, on anything that gives it a port of its own: Docker, a VPS, Fly,
Railway, Render, Cloud Run, Kubernetes. The route needs the whole Express app listening, because
the agent reaches your tools by calling this same process back on `/mcp`.

The two managed targets in the README cannot serve it. Alpic routes only `/mcp` to your server.
The Vercel build output runs the app as a serverless function with nothing listening locally, so
turns would stream while the tool list, the tool calls and the widget resources all answer 502.
Deploy your MCP server on either of them and keep `WANIWANI_AGENT_EVE_URL` unset there.

## Compose

Take that `compose.yaml` and add this server to it, so the two containers share a network.

```yaml
services:
  mcp:
    image: ghcr.io/your-org/your-mcp:latest
    ports: ["3000:3000"]
    environment:
      WANIWANI_API_KEY: ${WANIWANI_API_KEY:?set WANIWANI_API_KEY}
      WANIWANI_PUBLIC_KEY: ${WANIWANI_PUBLIC_KEY:?set WANIWANI_PUBLIC_KEY}
      WANIWANI_AGENT_EVE_URL: http://eve:3001
      WANIWANI_ALLOWED_ORIGINS: https://example.com
```

Then add one line to the `eve` service, so the runtime reaches your tools on the container network
rather than at the public URL the environment publishes:

```yaml
      WANIWANI_MCP_URL: http://mcp:3000/mcp
```

Compose reads all of these from the `.env` file beside it, which the operator guide already has you
create for `POSTGRES_PASSWORD`:

```sh
POSTGRES_PASSWORD=$(openssl rand -hex 32)
WANIWANI_API_KEY=wwk_…
WANIWANI_PUBLIC_KEY=wwp_…
```

The environment key appears twice on purpose. `eve` reads it from the `./.secrets/api_key` file
the reference deployment mounts, and this server reads it from its own environment.

## Environment

On this server:

| Variable | Required | Meaning |
| --- | --- | --- |
| `WANIWANI_AGENT_EVE_URL` | mounts the routes | Where the runtime listens. Unset, `/agent/v1` does not exist. |
| `WANIWANI_API_KEY` | with the URL | Your environment key (`wwk_…`), presented to the runtime as the bearer. It never reaches a browser. |
| `WANIWANI_PUBLIC_KEY` | with the URL | Your public key (`wwp_…`), which is what browsers present to `/agent/v1`. |
| `WANIWANI_ALLOWED_ORIGINS` | with the URL | Comma-separated origins the chat may be served from. Exact matches, no wildcards. |

A missing key, or an allowlist that names no origin, stops the server at boot and says which
variable it was.

On `eve`, `compose.yaml` fixes the Postgres and port settings, and you supply the rest:

| Variable | Required | Meaning |
| --- | --- | --- |
| `POSTGRES_PASSWORD` | yes | Read straight into a `postgres://` URL, so generate it with `openssl rand -hex 32`. A password carrying `#`, `/`, `@` or `:` produces a URL the runtime cannot parse. |
| `WANIWANI_API_KEY` | yes | The same environment key. Mounted from `./.secrets/api_key` as `WANIWANI_API_KEY_FILE`. |
| `MODEL_API_KEY` | for `byo` | Your model provider's key. |
| `AI_GATEWAY_API_KEY` | for `managed` | Key for managed inference. |
| `WANIWANI_MCP_URL` | on one network | Where this server answers from inside the network, as above. |
| `WANIWANI_CHANNEL_ID` | with 2+ channels | The channel turns are attributed to. Set it once the environment publishes more than one, because the runtime otherwise takes the first. |

## Checking it works

`/agent/v1/health` proxies the runtime's own health, and it takes the public key like every other
route, so a bare `curl` answers `unauthorized` rather than telling you anything:

```sh
curl -H "Authorization: Bearer wwp_…" http://localhost:3000/agent/v1/health
{"ok":true,"runtime":{"ok":true,"status":"ready","workflowId":"workflow//eve//workflowEntry"}}
```

## Embedding the chat

Point the SDK's `ChatEmbed` at the mounted route and hand it the public key. The component fills
its parent, so give it a sized container:

```tsx
<div style={{ height: 600 }}>
	<ChatEmbed api="https://<your mcp host>/agent/v1" headers={{ Authorization: "Bearer wwp_…" }} />
</div>
```

The page's origin has to be in `WANIWANI_ALLOWED_ORIGINS`. An origin that is not on the list fails
its preflight, so the browser blocks the request and reports a CORS error; the same request sent
outside a browser answers 403.

## Behind a reverse proxy

The route allows sixty requests a minute per client address, and that address is whatever opens
the socket. Behind nginx, Cloudflare or any other terminator, that is one address for every
visitor, so the whole site shares one allowance. Tell Express how many hops to trust by adding
this to `src/server.ts` above the mount, matching your own topology:

```ts
server.express.set("trust proxy", 1);
```

Only set it where a proxy you control rewrites `X-Forwarded-For`. On a server reachable directly,
it lets a client forge the header and escape the limit.

## Versions

The runtime image and this template's `@waniwani/agent-adapter` are released together and speak
one wire protocol, so they stay on the same version. Replace the reference file's `build: ./eve`
with the published image, which also means you no longer need the `eve/` source tree:

```yaml
services:
  eve:
    image: ghcr.io/waniwani-ai/agent:0.1.0-beta.2
```

with `"@waniwani/agent-adapter": "0.1.0-beta.2"` in `package.json`. Both are pinned exactly. The
image has no moving tag, and the package's `beta` tag moves with every release.
