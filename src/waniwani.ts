/**
 * GENERATED ON BUILD. `waniwani build` OVERWRITES THIS FILE WHOLE — DO NOT PUT
 * ANYTHING HERE THAT AN APP NEEDS, BECAUSE NOTHING HERE SURVIVES A BUILD.
 *
 * This is the seam the Waniwani generator writes into. What it writes is the
 * app's identity, and a `registerApp()` that registers the app folder's tools,
 * widgets, flows and docs onto the server built in `server.ts`.
 *
 * What is *checked in* is the standalone version — the template cloned on its
 * own, with no app folder in front of it — and editing it is how a bare clone
 * changes its own name, title and version. Anything more belongs in the app's
 * `waniwani.config.ts`, which is the input the generator actually reads.
 *
 * The shape the generated file has to match is `AppDefinition`, not this
 * literal: an app sets `instructions`, `search` and `tracking` through that
 * config, and a bare template sets none of them.
 */

import type { McpServer } from "skybridge/server";
import type { AppDefinition } from "./lib/app.js";

export const app: AppDefinition = {
	name: "mcp-distribution-template",
	title: "MCP Distribution Template",
	version: "0.0.1",
};

export async function registerApp(_server: McpServer): Promise<void> {
	// Nothing to add: a bare template serves only the tools registered in
	// `server.ts`.
}
