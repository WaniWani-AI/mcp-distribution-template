import { withWaniwani } from "@waniwani/sdk/mcp";
import "dotenv/config";
import { McpServer } from "skybridge/server";
import { z } from "zod";
import { faqTool } from "./faq/index.js";
import { portfolioPickerFlow } from "./flow/index.js";

const portfolioSchema = z.object({
	id: z.enum(["conservative", "balanced", "growth"]),
	name: z.string(),
	tagline: z.string(),
	targetReturn: z.string(),
	riskLevel: z.string(),
	assetMix: z.string(),
	highlights: z.array(z.string()),
});

export const server = new McpServer(
	{
		name: "mcp-distribution-template",
		version: "0.0.1",
	},
	{ capabilities: {} },
)
	.registerWidget(
		"select-portfolio",
		{
			description:
				"Displays the investment portfolio picker — three portfolio options for the user to choose from. Frame it warmly before calling, e.g. 'Here are three portfolios that fit your profile — take a look and tell me which one feels right.' The widget renders all portfolio details (target return, risk, asset mix, highlights) — do NOT list or repeat them in text.",
		},
		{
			inputSchema: {
				goal: z
					.string()
					.optional()
					.describe("What the user is investing for, in their own words."),
				horizon: z
					.string()
					.optional()
					.describe("Investment time horizon: short, medium, or long."),
				riskTolerance: z
					.string()
					.optional()
					.describe(
						"User's risk tolerance: conservative, balanced, or growth.",
					),
				portfolios: z
					.array(portfolioSchema)
					.describe("Three portfolio options to display."),
			},
			annotations: {
				readOnlyHint: true,
				openWorldHint: false,
				destructiveHint: false,
			},
		},
		async ({ goal, horizon, riskTolerance, portfolios }) => {
			return {
				structuredContent: { goal, horizon, riskTolerance, portfolios },
				content: [
					{
						type: "text",
						text: `Showing ${portfolios.length} portfolio options. The widget displays all portfolio details (returns, risk, asset mix, highlights) — do NOT list or repeat them yourself.

PORTFOLIO NAMES: Always refer to portfolios by their display names (Conservative, Balanced, Growth) — never by their IDs.

Wait for the user to click a card or name a portfolio. When they do, set selectedPortfolio to 'conservative', 'balanced', or 'growth' in stateUpdates, then briefly congratulate them on the choice — one short sentence, no recap of the details.`,
					},
				],
				isError: false,
			};
		},
	)
	.registerTool(faqTool.name, faqTool.config, faqTool.handler)
	.registerTool(
		portfolioPickerFlow.name,
		portfolioPickerFlow.config,
		portfolioPickerFlow.handler,
	);

withWaniwani(server);

export type AppType = typeof server;
