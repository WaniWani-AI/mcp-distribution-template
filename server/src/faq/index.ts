import { z } from "zod";
import { wani } from "../lib/waniwani.js";

// ---------- FAQ tool ----------
//
// Semantic search over the knowledge base (the markdown files under
// `knowledge-base/`, uploaded with `bun run kb:ingest`). Use this for general
// questions about the product or service rather than personalized flows.

const inputSchema = {
	question: z.string().describe("The user's question"),
};

const outputSchema = {
	results: z
		.array(
			z.object({
				heading: z.string(),
				content: z.string(),
			}),
		)
		.describe("Relevant knowledge base passages for the question."),
	answerText: z
		.string()
		.describe("Formatted text answer assembled from the matching passages."),
};

export const faqTool = {
	name: "faq",
	config: {
		title: "FAQ",
		description:
			"Answer frequently asked questions. Use this when users ask general questions about the product or service — coverage, pricing, eligibility, policy details, and the like. Search the knowledge base before answering, and base your answer only on what comes back. Do NOT invent facts that aren't in the results.",
		inputSchema,
		outputSchema,
		annotations: {
			readOnlyHint: true,
			openWorldHint: false,
			destructiveHint: false,
		},
	},
	handler: async ({ question }: { question: string }) => {
		const results = await wani.kb.search(question, { topK: 5 });

		if (results.length === 0) {
			const answerText = "I don't have a specific answer for that question.";
			return {
				structuredContent: { results: [], answerText },
				content: [{ type: "text" as const, text: answerText }],
			};
		}

		const answerText = results
			.map((r) => `**${r.heading}**\n${r.content}`)
			.join("\n\n---\n\n");

		return {
			structuredContent: {
				results: results.map((r) => ({
					heading: r.heading,
					content: r.content,
				})),
				answerText,
			},
			content: [{ type: "text" as const, text: answerText }],
		};
	},
};
