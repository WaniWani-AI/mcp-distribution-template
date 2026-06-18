import { waniwani } from "@waniwani/sdk";

/**
 * Shared server-side WaniWani client.
 *
 * Reads `WANIWANI_API_KEY` from the environment. Used for knowledge-base
 * search (`wani.kb.search`) and ingestion (`wani.kb.ingest`).
 */
export const wani = waniwani({
	apiKey: process.env.WANIWANI_API_KEY,
});
