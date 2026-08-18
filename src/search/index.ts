import type { KbSearchOptions } from "@waniwani/sdk";
import { z } from "zod";
import { wani } from "../lib/waniwani.js";

// ---------- FAQ tool ----------
//
// Semantic search over the knowledge base configured for this environment in
// WaniWani. Use this for general questions about the product or service rather
// than personalized flows.
//
// An app tunes this with `defineApp({ faq: { ... } })`, which arrives here as
// `app.faq` through the generated `waniwani.ts` — see `server.ts`, which also
// decides whether the tool is registered at all. `faqTool()` with no argument is
// the template's own behaviour and has to keep working: a bare clone, with no app
// folder in front of it, calls exactly that.

/**
 * What an app may set.
 *
 * Structurally the same as `FaqOptions` in `@waniwani/kit`, and declared a second
 * time here because the template does not depend on the kit — the two meet at the
 * generated `waniwani.ts` and nowhere else. Keep them in step.
 */
export type FaqOptions = {
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
};

const inputSchema = {
	question: z.string().describe("The user's question"),
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
		.describe("Relevant knowledge base passages for the question."),
	answerText: z
		.string()
		.describe("Formatted text answer assembled from the matching passages."),
};

const NOTHING_FOUND = "I don't have a specific answer for that question.";

/** Only the keys the app actually set, so the SDK's own defaults still apply. */
function searchOptions({
	topK,
	minScore,
	metadata,
}: FaqOptions): KbSearchOptions {
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
async function searchWithin(question: string, options: FaqOptions) {
	const search = wani.kb.search(question, searchOptions(options));
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

export function faqTool(options: FaqOptions = {}) {
	return {
		config: {
			name: "faq",
			title: "FAQ",
			description:
				"Answer frequently asked questions. Use this when users ask general questions about the product or service — coverage, pricing, eligibility, policy details, and the like. Search the knowledge base before answering, and base your answer only on what comes back. Do NOT invent facts that aren't in the results.",
			inputSchema,
			outputSchema,
			annotations: {
				title: "Answer a question from the knowledge base",
				readOnlyHint: true,
				openWorldHint: false,
				destructiveHint: false,
			},
		},
		handler: async ({ question }: { question: string }) => {
			const results = await searchWithin(question, options);

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
