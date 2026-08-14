import { withWaniwani } from "@waniwani/sdk/mcp";
import "dotenv/config";
import { McpServer } from "skybridge/server";
import { faqTool } from "./search/index.js";
import { app, registerApp } from "./waniwani.js";

const server = new McpServer(
	{
		name: app.name,
		title: app.title,
		version: app.version,
	},
	{ capabilities: {}, instructions: app.instructions },
).registerTool(faqTool.config, faqTool.handler);

// Add more tools by chaining further `.registerTool({ name, ... }, handler)`
// calls above. To render a React view, add `view: { component: "<file>" }`
// pointing at a file in `src/views/`.
// Docs: https://docs.skybridge.tech/api-reference/register-tool

// Whatever the app folder in front of this template contributes — its tools,
// widgets, flows, and docs. Standalone, `waniwani.ts` registers nothing; under
// `waniwani build` it is regenerated from the app. Must run before
// `withWaniwani`, which wraps the already-registered handlers.
await registerApp(server);

// Must run *after* the tools are registered: `withWaniwani` walks the already
// registered tools and wraps each handler in place for analytics. (Registering
// first also sidesteps its `registerTool` interceptor, which only recognises
// the MCP SDK's 3-argument form, not skybridge's `(config, handler)`.)
//
// The cast is needed because `withWaniwani` is typed against the raw MCP SDK
// `McpServer`, while skybridge's subclass hides the SDK internals from its
// public type (it extends `Omit<McpServerBase, "registerTool" | "connect">`).
// At runtime this *is* an SDK server, so the fields it reads are all present.
await withWaniwani(server as unknown as Parameters<typeof withWaniwani>[0]);

export default await server.run();

export type AppType = typeof server;
