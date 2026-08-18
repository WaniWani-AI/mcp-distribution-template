import type { KbSearchOptions } from "@waniwani/sdk";
import { z } from "zod";
import { wani } from "../lib/waniwani.js";

// ---------- search tool ----------
//
// Semantic search over the knowledge base configured for this environment in
// WaniWani. Use this for general questions about the product or service rather
// than personalized flows.
//
// Named `search`, titled, described and annotated the way the Apps SDK asks for
// — a verb for a name, a human-readable title, a description that says when NOT
// to call it as well as when to, hint annotations that match what the handler
// actually does, and the two `openai/toolInvocation` strings so the host has
// something to show while the search runs instead of inventing its own label.
// https://developers.openai.com/apps-sdk/app-guidelines
//
// An app tunes this with `defineApp({ search: { ... } })`, which arrives here as
// `app.search` through the generated `waniwani.ts` — see `server.ts`, which also
// decides whether the tool is registered at all. `searchTool()` with no argument
// is the template's own behaviour and has to keep working: a bare clone, with no
// app folder in front of it, calls exactly that.

/**
 * What an app may set.
 *
 * Structurally the same as `SearchOptions` in `@waniwani/kit`, and declared a
 * second time here because the template does not depend on the kit — the two
 * meet at the generated `waniwani.ts` and nowhere else. Keep them in step.
 */
export type SearchOptions = {
	/** Whether to register the tool. Read in `server.ts`, not here. */
	enabled?: boolean;
	/** Passages to ask for, 1-20. Unset leaves the SDK's default of 5. */
	topK?: number;
	/**
	 * Similarity floor, 0-1, under which a passage is dropped rather than ranked
	 * last. Unset leaves the SDK's default of 0.3.
	 */
	minScore?: number;
	/**
	 * Exact-match filter on chunk metadata: a passage must carry all of these
	 * pairs to come back. With the corpus tagged at ingest time, this is a gate in
	 * code rather than a line of prompt.
	 */
	metadata?: Record<string, string>;
	/** Give up on a slow search and answer as though nothing matched. */
	timeoutMs?: number;
	/** Name the source document on each passage. */
	includeSources?: boolean;
	/**
	 * Framing prepended to the answer text. Retrieved passages are third-party
	 * text on its way into a prompt; this is where an app says they are reference
	 * material rather than instructions.
	 */
	preamble?: string;
	/**
	 * Status text the host shows while the call is in flight, and once it has
	 * returned. Configurable because the defaults are English and this string is
	 * one of the few the user actually reads.
	 */
	invoking?: string;
	invoked?: string;
};

const inputSchema = {
	query: z
		.string()
		.describe(
			"What to look up. The search is semantic, so the user's question in their own words works better than keywords.",
		),
};

const outputSchema = {
	results: z
		.array(
			z.object({
				heading: z.string(),
				content: z.string(),
				source: z
					.string()
					.optional()
					.describe(
						"Document the passage came from, when the app asks for sources.",
					),
			}),
		)
		.describe("Knowledge base passages matching the query, best first."),
	answerText: z
		.string()
		.describe("Formatted text answer assembled from the matching passages."),
};

// Model-facing, so it says what to do next rather than only what happened: an
// empty result is the one case where the tool has nothing to ground an answer
// in, and that is exactly when a model is most likely to fill the gap itself.
const NOTHING_FOUND =
	"Nothing in the knowledge base matched. Tell the user this isn't covered rather than answering from general knowledge.";

/** Only the keys the app actually set, so the SDK's own defaults still apply. */
function kbOptions({
	topK,
	minScore,
	metadata,
}: SearchOptions): KbSearchOptions {
	return {
		...(topK !== undefined && { topK }),
		...(minScore !== undefined && { minScore }),
		...(metadata !== undefined && { metadata }),
	};
}

/**
 * The matching passages, or none if the search outran `timeoutMs`.
 *
 * A vector search that has gone slow is worse than one that found nothing: the
 * turn stays open while the user waits on it. The SDK call cannot be aborted, so
 * the loser of the race is abandoned rather than cancelled — which is why the
 * real call is folded into a promise that cannot reject. An abandoned rejection
 * is an unhandled one, and Node ends the process over that under
 * `--unhandled-rejections=strict`. A genuine search failure still throws.
 */
async function searchWithin(query: string, options: SearchOptions) {
	const search = wani.kb.search(query, kbOptions(options));
	if (!options.timeoutMs) {
		return search;
	}

	const settled = search.then(
		(results) => ({ results }),
		(error: unknown) => ({ error }),
	);
	let timer: ReturnType<typeof setTimeout> | undefined;
	const expired = new Promise<"expired">((resolve) => {
		timer = setTimeout(() => resolve("expired"), options.timeoutMs);
	});

	try {
		const first = await Promise.race([settled, expired]);
		if (first === "expired") {
			return [];
		}
		if ("error" in first) {
			throw first.error;
		}
		return first.results;
	} finally {
		clearTimeout(timer);
	}
}

export function searchTool(options: SearchOptions = {}) {
	return {
		config: {
			name: "search",
			title: "Search knowledge base",
			description:
				"Search the knowledge base and return the passages that match a query. Use this for general questions about the product or service — what it covers, pricing, eligibility, policy details, and the like. Answer only from the passages it returns, and if it returns none, say the knowledge base doesn't cover the question instead of answering from general knowledge. Do not use it for anything specific to this user's own account or records.",
			inputSchema,
			outputSchema,
			// The hints have to match the handler, or a submission gets rejected over
			// the mismatch: this one reads a fixed corpus and writes nothing, and the
			// same query twice returns the same passages.
			annotations: {
				title: "Search knowledge base",
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
			_meta: {
				"openai/toolInvocation/invoking":
					options.invoking ?? "Searching the knowledge base",
				"openai/toolInvocation/invoked":
					options.invoked ?? "Searched the knowledge base",
			},
		},
		handler: async ({ query }: { query: string }) => {
			const results = await searchWithin(query, options);

			if (results.length === 0) {
				return {
					structuredContent: { results: [], answerText: NOTHING_FOUND },
					content: [{ type: "text" as const, text: NOTHING_FOUND }],
				};
			}

			const passages = results.map((r) => ({
				heading: r.heading,
				content: r.content,
				...(options.includeSources && { source: r.source }),
			}));

			// The preamble frames the passages, so it has to lead. Empty or unset, it
			// drops out and the shape is what it always was.
			const answerText = [
				options.preamble,
				passages
					.map(
						(p) =>
							`**${p.heading}**${p.source ? ` · ${p.source}` : ""}\n${p.content}`,
					)
					.join("\n\n---\n\n"),
			]
				.filter(Boolean)
				.join("\n\n");

			return {
				structuredContent: { results: passages, answerText },
				content: [{ type: "text" as const, text: answerText }],
			};
		},
	};
}
