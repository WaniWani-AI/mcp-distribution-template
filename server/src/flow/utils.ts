type PortfolioId = "conservative" | "balanced" | "growth";

type Portfolio = {
    id: PortfolioId;
    name: string;
    tagline: string;
    targetReturn: string;
    riskLevel: string;
    assetMix: string;
    highlights: string[];
};

export const PORTFOLIOS: Portfolio[] = [
    {
        id: "conservative",
        name: "Conservative",
        tagline: "Steady growth, lower volatility",
        targetReturn: "~4% / yr",
        riskLevel: "Low",
        assetMix: "70% bonds · 30% equities",
        highlights: [
            "Capital preservation focus",
            "Investment-grade bond portfolio",
            "Quarterly automatic rebalancing",
        ],
    },
    {
        id: "balanced",
        name: "Balanced",
        tagline: "Even mix of growth and stability",
        targetReturn: "~7% / yr",
        riskLevel: "Medium",
        assetMix: "55% equities · 35% bonds · 10% alternatives",
        highlights: [
            "Globally diversified equities",
            "Defensive bond allocation",
            "Dynamic risk management",
        ],
    },
    {
        id: "growth",
        name: "Growth",
        tagline: "Long-term wealth, higher volatility",
        targetReturn: "~10% / yr",
        riskLevel: "High",
        assetMix: "85% equities · 10% alternatives · 5% bonds",
        highlights: [
            "Heavy equity tilt for compounding",
            "Emerging markets and small-cap exposure",
            "Built for 10+ year horizons",
        ],
    },
];