/**
 * The seam the Waniwani generator writes into.
 *
 * `waniwani build` overwrites this file with one generated from the app folder:
 * the app's identity, and a `registerApp()` that registers its tools, widgets,
 * flows, and docs onto the server built in `server.ts`.
 *
 * What is here is the standalone version — the template cloned on its own, with
 * no app folder in front of it. It keeps `bun run dev` working on a fresh clone
 * and documents the shape the generated file has to match.
 */

import type { McpServer } from "skybridge/server";

export const app = {
	name: "mcp-distribution-template",
	title: "MCP Distribution Template",
	version: "0.0.1",
	instructions: undefined as string | undefined,
};

export async function registerApp(_server: McpServer): Promise<void> {
	// Nothing to add: a bare template serves only the tools registered in
	// `server.ts`.
}
