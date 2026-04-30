import { createFlow, END, START } from "@waniwani/sdk/mcp";
import { z } from "zod";
import {
	generateBookingRef,
	INSTRUCTORS,
	MEETING_POINTS,
	pick,
	WEATHER_FORECASTS,
} from "./utils.js";

// ---------- Lesson plan catalog ----------

type LessonPlanId = "private" | "small_group" | "family";

type LessonPlan = {
	id: LessonPlanId;
	name: string;
	tagline: string;
	durationMinutes: number;
	priceEur: number;
	perks: string[];
};

function buildPlans(groupSize: number, level: string): LessonPlan[] {
	return [
		{
			id: "private",
			name: "Private Masterclass",
			tagline: "1-on-1 coaching, fully tailored",
			durationMinutes: 180,
			priceEur: 320,
			perks: [
				"Dedicated senior instructor",
				"Video review of your runs",
				"Flexible meeting point",
			],
		},
		{
			id: "small_group",
			name: "Small Group Workshop",
			tagline: `Max 4 skiers · all ${level}`,
			durationMinutes: 150,
			priceEur: 145,
			perks: [
				"Grouped by level, not by age",
				"Technique drills + guided runs",
				"Après-ski hot chocolate",
			],
		},
		{
			id: "family",
			name: "Family Adventure",
			tagline:
				groupSize > 1
					? `Perfect for your group of ${groupSize}`
					: "Kids + parents, one crew",
			durationMinutes: 210,
			priceEur: 280,
			perks: [
				"Mixed-ability friendly",
				"Photo stop at the panoramic lookout",
				"Kid-sized lunch included",
			],
		},
	];
}

// ---------- Flow ----------

export const skiLessonsFlow = createFlow({
	id: "ski_lessons",
	title: "Book a Ski Lesson",
	description:
		"Book a personalized ski lesson from an alpine concierge. Use whenever a user mentions wanting to book, reserve, or plan ski lessons — solo, with a partner, or as a family. TONE: warm, knowledgeable, slightly upscale alpine concierge. React with genuine enthusiasm to what the user shares ('Chamonix in February — great call!', 'Love that your kids are ready to carve!'). Never feel like a form. Match the user's language.",
	state: {
		level: z
			.enum(["beginner", "intermediate", "advanced", "expert"])
			.describe(
				"The skier's self-reported level. Infer from context when possible (e.g. 'first time on skis' → beginner, 'I ski blacks' → advanced).",
			),
		groupSize: z
			.number()
			.int()
			.min(1)
			.max(12)
			.describe(
				"Number of people in the lesson. Infer from mentions of family members, couples, solo, etc. Defaults to 1 if the user is clearly alone.",
			),
		date: z
			.string()
			.describe(
				"The date of the lesson, in human-readable form (e.g. 'Saturday 14 Feb', 'next weekend', 'Feb 14'). Keep it the way the user said it.",
			),
		time: z
			.enum(["morning", "afternoon"])
			.describe("Preferred time of day for the lesson."),
		goals: z
			.string()
			.describe(
				"What the skier wants to work on or get out of the lesson (e.g. 'work on carving', 'build confidence on reds', 'first time on snow'). Short sentence, user's words.",
			),
		lessonPlan: z
			.enum(["private", "small_group", "family"])
			.describe(
				"The lesson plan the user picked from the selector widget. Do NOT set this before the user clicks a plan or says which one they want.",
			),
	},
})
	// Step 1: open-ended welcome — extract as much as possible in one shot
	.addNode("welcome", ({ interrupt }) => {
		return interrupt({
			goals: {
				question:
					"Tell me about your ski trip — who's skiing and what are you hoping to work on?",
				context: `This is the first message of a premium ski-school concierge experience. Greet the user warmly and ask ONE open-ended question — do NOT list fields, do NOT ask multiple questions in a row.

Something like: "Welcome to Alpine School! I'd love to help you book a lesson. Tell me a bit about your trip — who's skiing, what level you're at, when you're there, and what you'd love to work on. Share as much or as little as you'd like :)"

From the user's response, extract into stateUpdates whatever they naturally share:
- level: "beginner" | "intermediate" | "advanced" | "expert" — infer from their words ("never skied" → beginner, "I ski blacks no problem" → advanced, "I can link turns on blues" → intermediate)
- groupSize: number of people (couples → 2, "me and my two kids" → 3, solo → 1). Infer confidently.
- date: the date as the user said it — keep it natural ("next Saturday", "Feb 14", "this weekend")
- time: "morning" or "afternoon" if mentioned
- goals: a short sentence describing what they want to work on, in the user's own words (e.g. "work on carving", "build confidence on reds", "first time on snow with the kids")

Only extract fields the user clearly mentioned — do NOT guess. The next step will ask naturally for anything missing.`,
			},
		});
	})

	// Step 2: conversational follow-up for whatever's missing
	.addNode("gather_details", ({ state, interrupt }) => {
		return interrupt(
			{
				...(!state.level
					? {
							level: {
								question: "What level would you say you're at?",
								suggestions: ["beginner", "intermediate", "advanced", "expert"],
							},
						}
					: {}),
				...(!state.groupSize
					? {
							groupSize: {
								question: "How many people will be skiing?",
							},
						}
					: {}),
				...(!state.date
					? {
							date: {
								question: "What day were you thinking?",
							},
						}
					: {}),
				...(!state.time
					? {
							time: {
								question: "Morning or afternoon session?",
								suggestions: ["morning", "afternoon"],
							},
						}
					: {}),
				...(!state.goals
					? {
							goals: {
								question: "And what would you love to get out of the lesson?",
							},
						}
					: {}),
			},
			{
				context: `You're having a natural conversation — NOT filling out a form. React warmly to what the user shared in the welcome step before asking the next thing. Ask only ONE OR TWO of the missing questions at a time, weave them in conversationally.

Good follow-ups:
- "Chamonix next weekend — great pick! Who's skiing with you?"
- "Got it, three of you. And are you all at a similar level, or mixed?"
- "Love it! Morning or afternoon — when does the family usually get going?"

FORMATTING: flowing prose, never bullet points or numbered lists. Each question should feel like part of a natural paragraph.`,
			},
		);
	})

	// Step 3: show the lesson plan picker widget
	.addNode("show_lesson_plans", ({ state, showWidget }) => {
		const plans = buildPlans(
			state.groupSize ?? 1,
			state.level ?? "intermediate",
		);

		return showWidget("select-lesson-plan", {
			field: "lessonPlan",
			description:
				"IMPORTANT: You MUST now call the select-lesson-plan tool with the lesson data above to display the plan selector. Build a little excitement — something like 'Here are three options I picked out for you — take a look and tell me which feels right!' Then call select-lesson-plan immediately. The widget displays all the plan details, prices, and perks so do NOT list or repeat them yourself.\n\nPLAN NAMES: Always refer to plans by their display names (Private Masterclass, Small Group Workshop, Family Adventure), NEVER by their IDs ('private', 'small_group', 'family').\n\nWait for the user to click a card or name a plan. When they do, set lessonPlan to 'private', 'small_group', or 'family' in stateUpdates. Do NOT set lessonPlan before the user has made their choice.",
			data: {
				level: state.level,
				groupSize: state.groupSize,
				date: state.date,
				time: state.time,
				goals: state.goals,
				plans,
			},
		});
	})

	// Step 4: confirm booking — generate resort details and show the ski pass
	.addNode("confirm_booking", ({ state, showWidget }) => {
		const seed = `${state.level}|${state.groupSize}|${state.date}|${state.time}|${state.lessonPlan}`;
		const bookingRef = generateBookingRef(seed);
		const instructor = pick(INSTRUCTORS, seed);
		const meetingPoint = pick(MEETING_POINTS, `${seed}m`);
		const weather = pick(WEATHER_FORECASTS, `${seed}w`);

		const plans = buildPlans(
			state.groupSize ?? 1,
			state.level ?? "intermediate",
		);
		const selectedPlan =
			plans.find((p) => p.id === state.lessonPlan) ?? plans[0];

		return showWidget("ski-pass-confirmation", {
			description: `IMPORTANT: You MUST now call the ski-pass-confirmation tool with the booking data above to display the ski pass. Celebrate briefly — something like 'You're all set! Your pass is ready above ☃️' — then wish them a great day on the mountain. Then call ski-pass-confirmation immediately. The widget displays all booking details, QR code, instructor info, and meeting point so do NOT list or repeat any of them yourself.\n\nTONE: Keep it short and celebratory. One or two sentences max. The pass speaks for itself.`,
			data: {
				bookingRef,
				level: state.level,
				groupSize: state.groupSize,
				date: state.date,
				time: state.time,
				goals: state.goals,
				lessonPlan: selectedPlan.name,
				lessonTagline: selectedPlan.tagline,
				durationMinutes: selectedPlan.durationMinutes,
				priceEur: selectedPlan.priceEur,
				instructor: instructor.name,
				instructorStyle: instructor.style,
				meetingPoint,
				weather,
			},
		});
	})

	.addEdge(START, "welcome")
	.addEdge("welcome", "gather_details")
	.addEdge("gather_details", "show_lesson_plans")
	.addEdge("show_lesson_plans", "confirm_booking")
	.addEdge("confirm_booking", END)
	.compile();
