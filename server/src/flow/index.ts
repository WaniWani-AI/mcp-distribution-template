import { createFlow, END, START } from "@waniwani/sdk/mcp";
import { z } from "zod";
import { PORTFOLIOS } from "./utils.js";

// ---------- Flow ----------

export const portfolioPickerFlow = createFlow({
	id: "investment_portfolio",
	title: "Pick an Investment Portfolio",
	description:
		"Help the user pick an investment portfolio that fits their goals, time horizon, and risk tolerance. Use whenever a user mentions wanting to invest, save toward a goal, or compare portfolio options. TONE: warm, knowledgeable, plain-English — never pushy or jargon-heavy. React naturally to what the user shares.",
	state: {
		goal: z
			.string()
			.describe(
				"What the user is investing for, in their own words (e.g. 'save for a house down payment', 'retirement', 'build long-term wealth'). Short sentence.",
			),
		horizon: z
			.enum(["short", "medium", "long"])
			.describe(
				"Investment time horizon. 'short' = under 3 years, 'medium' = 3 to 10 years, 'long' = 10+ years. Infer from context (e.g. 'house in 2 years' → short, 'retiring in 25 years' → long).",
			),
		riskTolerance: z
			.enum(["conservative", "balanced", "growth"])
			.describe(
				"How much volatility the user is comfortable with. Infer from their words: 'I don't want to lose money' → conservative, 'I'm OK with ups and downs' → balanced, 'I want max returns' → growth.",
			),
		selectedPortfolio: z
			.enum(["conservative", "balanced", "growth"])
			.describe(
				"The portfolio the user picked from the selector widget. Do NOT set this before the user clicks a card or names one.",
			),
	},
})
	// Step 1: open-ended welcome — extract whatever the user volunteers
	.addNode("welcome", ({ interrupt }) => {
		return interrupt({
			goal: {
				question:
					"What are you looking to invest for, and what's your timeline like?",
				context: `This is the first message of an investment-portfolio picker. Greet the user warmly and ask ONE open-ended question — do NOT list fields, do NOT ask multiple questions in a row.

Something like: "Hey! I'd love to help you find a portfolio that fits. What are you looking to invest for, and what's your timeline like?"

From the user's response, extract into stateUpdates whatever they naturally share:
- goal: a short sentence in their own words ("saving for a house", "retirement", "general wealth-building")
- horizon: "short" (<3y), "medium" (3-10y), or "long" (10y+) — infer from any timing they mention
- riskTolerance: "conservative" | "balanced" | "growth" — only set if they clearly signal it ("I don't want to lose money" → conservative, "I want max returns" → growth)

Only extract fields the user clearly mentioned — do NOT guess. The next step will gather what's missing.`,
			},
		});
	})

	// Step 2: single conversational follow-up for whatever's missing
	.addNode("clarify", ({ state, interrupt }) => {
		return interrupt(
			{
				...(!state.horizon
					? {
						horizon: {
							question: "When do you think you'll need the money?",
							suggestions: [
								"short (under 3 years)",
								"medium (3-10 years)",
								"long (10+ years)",
							],
						},
					}
					: {}),
				...(!state.riskTolerance
					? {
						riskTolerance: {
							question: "How do you feel about market ups and downs?",
							suggestions: ["conservative", "balanced", "growth"],
						},
					}
					: {}),
			},
			{
				context: `React warmly to what the user just shared, then ask only the missing pieces conversationally — NOT a form. Weave the questions into a natural follow-up.

Good follow-ups:
- "Saving for a house — love that. Are you thinking a couple of years out, or a bit further?"
- "30 years to retirement gives you a ton of room. How do you feel about market swings — would you rather play it safe or aim for higher returns?"

FORMATTING: flowing prose, never bullet points. Match the user's energy.`,
			},
		);
	})

	// Step 3: show the portfolio picker — terminal node
	.addNode("show_portfolios", ({ state, showWidget }) => {
		return showWidget("select-portfolio", {
			field: "selectedPortfolio",
			description:
				"IMPORTANT: You MUST now call the select-portfolio tool with the data above to display the portfolio picker. Frame it warmly — something like 'Here are three portfolios that fit your profile — take a look and tell me which one feels right.' Then call select-portfolio immediately. The widget displays all portfolio details (returns, risk, asset mix, highlights) so do NOT list or repeat them yourself.\n\nPORTFOLIO NAMES: Always refer to portfolios by their display names (Conservative, Balanced, Growth) — never by their IDs.\n\nWait for the user to click a card or name a portfolio. When they do, set selectedPortfolio to 'conservative', 'balanced', or 'growth' in stateUpdates, then briefly congratulate them on the choice — one short sentence, no recap of the details.",
			data: {
				goal: state.goal,
				horizon: state.horizon,
				riskTolerance: state.riskTolerance,
				portfolios: PORTFOLIOS,
			},
		});
	})

	.addEdge(START, "welcome")
	.addEdge("welcome", "clarify")
	.addEdge("clarify", "show_portfolios")
	.addEdge("show_portfolios", END)
	.compile();
