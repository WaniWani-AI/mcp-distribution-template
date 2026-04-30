import { withWaniwani } from "@waniwani/sdk/mcp";
import "dotenv/config";
import { McpServer } from "skybridge/server";
import { z } from "zod";
import { portfolioPickerFlow } from "./journey/index.js";

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
				"You MUST call this tool to display the investment portfolio picker. It shows three portfolio options for the user to pick from. The widget renders all portfolio details (target return, risk, asset mix, highlights) — do NOT list or repeat them in text.",
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
					.describe("User's risk tolerance: conservative, balanced, or growth."),
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
						text: `Showing ${portfolios.length} portfolio options.`,
					},
				],
				isError: false,
			};
		},
	)
	.registerTool(
		portfolioPickerFlow.name,
		portfolioPickerFlow.config,
		portfolioPickerFlow.handler,
	);

withWaniwani(server);

export type AppType = typeof server;
