import { withWaniwani } from "@waniwani/sdk/mcp";
import "dotenv/config";
import { McpServer } from "skybridge/server";
import { faqTool } from "./faq/index.js";

const server = new McpServer(
	{
		name: "mcp-distribution-template",
		version: "0.0.1",
	},
	{ capabilities: {} },
).registerTool(faqTool.config, faqTool.handler);

// Add more tools by chaining further `.registerTool({ name, ... }, handler)`
// calls above. To render a React view, add `view: { component: "<file>" }`
// pointing at a file in `src/views/`.
// Docs: https://docs.skybridge.tech/api-reference/register-tool

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
