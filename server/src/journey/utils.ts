export const INSTRUCTORS = [
	{ name: "Léa Rochette", style: "French technique, 12 yrs in Chamonix" },
	{
		name: "Marcus Keller",
		style: "Swiss freeride specialist, ex-national team",
	},
	{ name: "Elsa Lindqvist", style: "Scandinavian all-mountain coach" },
	{ name: "Tom Whitfield", style: "British patient beginner coach" },
	{ name: "Hiroki Tanaka", style: "Powder + carving, multilingual" },
];

export const MEETING_POINTS = [
	"Bottom of Bochard Gondola, Chamonix",
	"Le Brévent Telecabine main entrance",
	"Grands Montets ski school flag",
	"Flégère base, meeting point Blue",
];

export const WEATHER_FORECASTS = [
	"Bluebird · -4°C · 20cm fresh snow",
	"Partly cloudy · -2°C · packed powder",
	"Light snowfall · -6°C · 10cm overnight",
	"Sunny · 1°C · spring conditions",
];

// Deterministic pick so the same inputs always map to the same picks.
export function pick<T>(list: T[], seed: string): T {
	const hash = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
	return list[hash % list.length];
}

export function generateBookingRef(seed: string): string {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let hash = seed.split("").reduce((a, c) => a + c.charCodeAt(0) * 31, 7);
	let ref = "";
	for (let i = 0; i < 4; i++) {
		ref += alphabet[hash % alphabet.length];
		hash =
			Math.floor(hash / alphabet.length) + seed.charCodeAt(i % seed.length);
	}
	return `SKI-${ref}`;
}
