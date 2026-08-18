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
);

// The knowledge-base tool is the template's, but whether it belongs in front of
// THIS app is the app's call. A deployment whose environment has no corpus behind
// it — or holds only another market's documents — is better off without the tool
// than with one that answers confidently out of the wrong file, and `faq` carries
// nothing in its own description that would tell the model so. `enabled: false` is
// the only way an app can say that, because it cannot unregister what the template
// has already registered.
//
// Registering here rather than in the constructor chain is why `AppType` below no
// longer names `faq` statically: whether it exists is a runtime question now, and
// a type that answered it either way would be wrong half the time.
if (app.faq?.enabled !== false) {
	const faq = faqTool(app.faq);
	server.registerTool(faq.config, faq.handler);
}

// Whatever the app folder in front of this template contributes — its tools,
// widgets, flows, and docs. Standalone, `waniwani.ts` registers nothing; under
// `waniwani build` it is regenerated from the app. Must run before
// `withWaniwani`, which wraps the already-registered handlers.
await registerApp(server);

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
