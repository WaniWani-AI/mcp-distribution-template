import "@/index.css";

import { mountWidget, useSendFollowUpMessage } from "skybridge/web";
import { useToolInfo } from "../helpers.js";

type PortfolioId = "conservative" | "balanced" | "growth";

const ACCENTS: Record<PortfolioId, string> = {
	conservative: "portfolio-card--conservative",
	balanced: "portfolio-card--balanced",
	growth: "portfolio-card--growth",
};

function SelectPortfolio() {
	const { output } = useToolInfo<"select-portfolio">();
	const sendFollowUp = useSendFollowUpMessage();

	if (!output) {
		return (
			<div className="portfolio-shell">
				<div className="portfolio-loading">Loading portfolio options…</div>
			</div>
		);
	}

	const { portfolios, goal, horizon, riskTolerance } = output;

	const handlePick = async (id: PortfolioId, name: string) => {
		await sendFollowUp(
			`I'd like to go with the ${name} portfolio (${id}).`,
		);
	};

	return (
		<div className="portfolio-shell">
			<div className="portfolio-header">
				<div className="portfolio-eyebrow">Your matches</div>
				<div className="portfolio-summary">
					{goal ? <span className="portfolio-chip">{goal}</span> : null}
					{horizon ? (
						<span className="portfolio-chip">{horizon}-term</span>
					) : null}
					{riskTolerance ? (
						<span className="portfolio-chip">{riskTolerance}</span>
					) : null}
				</div>
			</div>

			<div
				className="portfolio-grid"
				data-llm={`Showing ${portfolios.length} portfolios: ${portfolios.map((p) => p.name).join(", ")}`}
			>
				{portfolios.map((portfolio) => (
					<button
						type="button"
						key={portfolio.id}
						className={`portfolio-card ${ACCENTS[portfolio.id as PortfolioId]}`}
						onClick={() =>
							handlePick(portfolio.id as PortfolioId, portfolio.name)
						}
						data-llm={`${portfolio.name} — ${portfolio.targetReturn}, ${portfolio.riskLevel} risk`}
					>
						<div className="portfolio-card__head">
							<div className="portfolio-card__name">{portfolio.name}</div>
							<div className="portfolio-card__risk">
								{portfolio.riskLevel} risk
							</div>
						</div>

						<div className="portfolio-card__tagline">{portfolio.tagline}</div>

						<div className="portfolio-card__return">
							<span className="portfolio-card__return-amount">
								{portfolio.targetReturn}
							</span>
							<span className="portfolio-card__return-meta">target return</span>
						</div>

						<div className="portfolio-card__mix">{portfolio.assetMix}</div>

						<ul className="portfolio-card__highlights">
							{portfolio.highlights.map((highlight: string) => (
								<li key={highlight}>{highlight}</li>
							))}
						</ul>

						<div className="portfolio-card__cta">Choose ↗</div>
					</button>
				))}
			</div>

			<div className="portfolio-footnote">
				Pick a card or tell me in chat — I'll take care of the rest.
			</div>
		</div>
	);
}

export default SelectPortfolio;

mountWidget(<SelectPortfolio />);
