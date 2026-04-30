import { withWaniwani } from "@waniwani/sdk/mcp";
import "dotenv/config";
import { McpServer } from "skybridge/server";
import { z } from "zod";
import { skiLessonsFlow } from "./journey/index.js";

const lessonPlanSchema = z.object({
	id: z.enum(["private", "small_group", "family"]),
	name: z.string(),
	tagline: z.string(),
	durationMinutes: z.number(),
	priceEur: z.number(),
	perks: z.array(z.string()),
});

export const server = new McpServer(
	{
		name: "alpic-x-waniwani-app",
		version: "0.0.1",
	},
	{ capabilities: {} },
)
	.registerWidget(
		"select-lesson-plan",
		{
			description:
				"You MUST call this tool to display the lesson plan selector widget. It shows three curated ski lesson plans for the skier to pick from. The widget renders all plan details, prices, and perks — do NOT list or repeat them in text.",
		},
		{
			inputSchema: {
				level: z.string().describe("The skier's level."),
				groupSize: z.number().describe("How many people are skiing."),
				date: z.string().describe("The lesson date."),
				time: z.string().describe("Morning or afternoon."),
				goals: z.string().describe("What the skier wants to work on."),
				plans: z
					.array(lessonPlanSchema)
					.describe("Three curated lesson plans."),
			},
			annotations: {
				readOnlyHint: true,
				openWorldHint: false,
				destructiveHint: false,
			},
		},
		async ({ level, groupSize, date, time, goals, plans }) => {
			return {
				structuredContent: { level, groupSize, date, time, goals, plans },
				content: [
					{
						type: "text",
						text: `Showing ${plans.length} lesson plan options.`,
					},
				],
				isError: false,
			};
		},
	)
	.registerWidget(
		"ski-pass-confirmation",
		{
			description:
				"You MUST call this tool to display the finalized ski pass confirmation card. The widget renders the full booking details, QR code, instructor, meeting point, and weather — do NOT repeat any of these in text.",
		},
		{
			inputSchema: {
				bookingRef: z.string().describe("Booking reference code."),
				level: z.string().describe("The skier's level."),
				groupSize: z.number().describe("How many people are skiing."),
				date: z.string().describe("Lesson date."),
				time: z.string().describe("Morning or afternoon."),
				goals: z.string().describe("What the skier wants to work on."),
				lessonPlan: z.string().describe("The selected lesson plan name."),
				lessonTagline: z.string().describe("The plan's tagline."),
				durationMinutes: z.number().describe("Lesson duration in minutes."),
				priceEur: z.number().describe("Price in euros."),
				instructor: z.string().describe("Assigned instructor name."),
				instructorStyle: z
					.string()
					.describe("Short blurb about the instructor."),
				meetingPoint: z.string().describe("Where to meet the instructor."),
				weather: z.string().describe("Weather forecast line."),
			},
			annotations: {
				readOnlyHint: true,
				openWorldHint: false,
				destructiveHint: false,
			},
		},
		async (input) => {
			return {
				structuredContent: input,
				content: [
					{
						type: "text",
						text: `Booking ${input.bookingRef} confirmed — ${input.lessonPlan} with ${input.instructor} on ${input.date}.`,
					},
				],
				isError: false,
			};
		},
	)
	.registerTool(
		skiLessonsFlow.name,
		skiLessonsFlow.config,
		skiLessonsFlow.handler,
	);

withWaniwani(server);

export type AppType = typeof server;
