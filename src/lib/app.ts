import type { WithWaniwaniOptions } from "@waniwani/sdk/mcp";
import type { SearchOptions } from "../search/index.js";

/**
 * The contract between the app folder and this template.
 *
 * `src/waniwani.ts` is the one file `waniwani build` overwrites, so a type
 * declared there would last exactly until the first build. It lives here
 * instead, where both the standalone stub and `server.ts` can name it: the stub
 * is checked as it is written, and `server.ts` re-checks whatever the generator
 * produced, so a drift between the two surfaces as a build error rather than as
 * an `undefined` read at runtime.
 *
 * Every field but `name` and `version` is optional because the generator emits
 * only what the app's `waniwani.config.ts` actually set.
 */
export type AppDefinition = {
	/** MCP server name, e.g. `oney-split-payment`. */
	name: string;
	/** Shown to humans in connector UIs. Falls back to `name`. */
	title?: string;
	/** The app's `package.json` version, or the template's own. */
	version: string;
	/**
	 * MCP `instructions`: handed to the host once, in the initialize result,
	 * before any tool is called. Say what this server does and what it covers,
	 * concretely enough that the host can tell whether a request belongs here at
	 * all.
	 */
	instructions?: string;
	/** Tuning for the template's `search` tool, including turning it off. */
	search?: SearchOptions;
	/** Forwarded whole to `withWaniwani` — event tracking and flush behaviour. */
	tracking?: WithWaniwaniOptions;
};
