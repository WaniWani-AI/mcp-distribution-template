import "@/index.css";

import { mountWidget, useSendFollowUpMessage } from "skybridge/web";
import { useToolInfo } from "../helpers.js";

type PlanId = "private" | "small_group" | "family";

const PLAN_ICONS: Record<PlanId, string> = {
	private: "◆",
	small_group: "▲",
	family: "●",
};

const PLAN_ACCENTS: Record<PlanId, string> = {
	private: "lesson-card--private",
	small_group: "lesson-card--group",
	family: "lesson-card--family",
};

function formatDuration(minutes: number): string {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	if (m === 0) {
		return `${h}h`;
	}
	return `${h}h${m}`;
}

function SelectLessonPlan() {
	const { output } = useToolInfo<"select-lesson-plan">();
	const sendFollowUp = useSendFollowUpMessage();

	if (!output) {
		return (
			<div className="lesson-shell">
				<div className="lesson-loading">Curating your options…</div>
			</div>
		);
	}

	const { plans, level, date, time } = output;

	const handlePick = async (planId: PlanId, planName: string) => {
		await sendFollowUp(
			`I'd like to go with the ${planName} (${planId}). Please continue and confirm the booking.`,
		);
	};

	return (
		<div className="lesson-shell">
			<div className="lesson-header">
				<div className="lesson-eyebrow">Alpine School · Tailored picks</div>
				<div className="lesson-summary">
					{level ? <span className="lesson-chip">{level}</span> : null}
					{date ? <span className="lesson-chip">{date}</span> : null}
					{time ? <span className="lesson-chip">{time}</span> : null}
				</div>
			</div>

			<div
				className="lesson-grid"
				data-llm={`Showing ${plans.length} lesson plans for a ${level ?? "skier"}: ${plans.map((p) => p.name).join(", ")}`}
			>
				{plans.map((plan) => (
					<button
						type="button"
						key={plan.id}
						className={`lesson-card ${PLAN_ACCENTS[plan.id as PlanId]}`}
						onClick={() => handlePick(plan.id as PlanId, plan.name)}
						data-llm={`Plan: ${plan.name} — ${plan.priceEur}€ for ${formatDuration(plan.durationMinutes)}`}
					>
						<div className="lesson-card__icon" aria-hidden>
							{PLAN_ICONS[plan.id as PlanId]}
						</div>

						<div className="lesson-card__body">
							<div className="lesson-card__name">{plan.name}</div>
							<div className="lesson-card__tagline">{plan.tagline}</div>

							<ul className="lesson-card__perks">
								{plan.perks.map((perk: string) => (
									<li key={perk}>{perk}</li>
								))}
							</ul>
						</div>

						<div className="lesson-card__footer">
							<div className="lesson-card__price">
								<span className="lesson-card__price-amount">
									{plan.priceEur}€
								</span>
								<span className="lesson-card__price-meta">
									{formatDuration(plan.durationMinutes)}
								</span>
							</div>
							<div className="lesson-card__cta">Choose ↗</div>
						</div>
					</button>
				))}
			</div>

			<div className="lesson-footnote">
				Pick a card or tell me in chat — I'll take care of the rest.
			</div>
		</div>
	);
}

export default SelectLessonPlan;

mountWidget(<SelectLessonPlan />);
