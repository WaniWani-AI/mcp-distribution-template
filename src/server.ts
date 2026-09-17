import { withWaniwani } from "@waniwani/sdk/mcp";
import "dotenv/config";
import { McpServer } from "skybridge/server";
import type { AppDefinition } from "./lib/app.js";
import { searchTool } from "./search/index.js";
import { app as generated, registerApp } from "./waniwani.js";

// `waniwani.ts` is generated, so its `app` is whatever the generator happened to
// emit — inferred from a literal, with a key simply absent for every option the
// app's config left unset. Naming the contract here is what turns that into a
// checked seam: a generated file that stops carrying `name`, or starts carrying a
// `search` of the wrong shape, fails the build instead of reading `undefined` at
// runtime, and everything below can keep using the optional fields.
const app: AppDefinition = generated;

const server = new McpServer(
	{
		name: app.name,
		title: app.title,
		version: app.version,
	},
	{ capabilities: {}, instructions: app.instructions },
	// A turn on `/agent/v1` carries the conversation so far, past express's
	// 100kb default. skybridge parses first, so this is the only place to say so.
	{ json: { limit: "1mb" } },
);

// The knowledge-base tool is the template's, but whether it belongs in front of
// THIS app is the app's call. A deployment whose environment has no corpus behind
// it — or holds only another market's documents — is better off without the tool
// than with one that answers confidently out of the wrong file, and `search`
// carries nothing in its own description that would tell the model so.
// `enabled: false` is the only way an app can say that, because it cannot
// unregister what the template has already registered.
//
// Registering here rather than in the constructor chain is why `AppType` below no
// longer names `search` statically: whether it exists is a runtime question now,
// and a type that answered it either way would be wrong half the time.
if (app.search?.enabled !== false) {
	const search = searchTool(app.search);
	server.registerTool(search.config, search.handler);
}

// Whatever the app folder in front of this template contributes — its tools,
// widgets, flows, and docs. Standalone, `waniwani.ts` registers nothing; under
// `waniwani build` it is regenerated from the app. Must run before
// `withWaniwani`, which wraps the already-registered handlers.
await registerApp(server);

function requireEnv(name: string): string {
	const value = process.env[name]?.trim();
	if (!value) {
		throw new Error(`${name} is required when WANIWANI_AGENT_EVE_URL is set`);
	}
	return value;
}

// `/agent/v1` beside `/mcp`: what the chat embed on the customer's own site
// talks to, on a deployment that runs the agent runtime. It needs a host that
// serves this whole app on a listening port. See docs/self-hosted-agent.md.
const eveUrl = process.env.WANIWANI_AGENT_EVE_URL?.trim();
if (eveUrl) {
	const { agentRouter } = await import("@waniwani/agent-adapter/express");
	const allowedOrigins = requireEnv("WANIWANI_ALLOWED_ORIGINS")
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);
	if (allowedOrigins.length === 0) {
		throw new Error("WANIWANI_ALLOWED_ORIGINS names no origin");
	}
	server.use(
		"/agent/v1",
		agentRouter({
			eveUrl,
			apiKey: requireEnv("WANIWANI_API_KEY"),
			publicKey: requireEnv("WANIWANI_PUBLIC_KEY"),
			allowedOrigins,
			title: app.title ?? app.name,
			// The runtime reaches this process's own tools over `/mcp`, on the port
			// skybridge binds, which is `__PORT` and never `PORT`.
			mcpLoopbackUrl: `http://127.0.0.1:${process.env.__PORT?.trim() || "3000"}/mcp`,
		}),
	);
}

// The cast is needed because `withWaniwani` is typed against the raw MCP SDK
// `McpServer`, while skybridge's subclass hides the SDK internals from its
// public type (it extends `Omit<McpServerBase, "registerTool" | "connect">`).
// At runtime this *is* an SDK server, so the fields it reads are all present.
//
// `app.tracking` is forwarded whole. `flushAfterToolCall` is the one that matters
// on serverless: an invocation frozen between tool calls takes any unsent event
// batch with it, and there is no other way for an app to ask for the flush.
await withWaniwani(
	server as unknown as Parameters<typeof withWaniwani>[0],
	app.tracking,
);

export default await server.run();

export type AppType = typeof server;
