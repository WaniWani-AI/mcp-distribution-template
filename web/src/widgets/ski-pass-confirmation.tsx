import "@/index.css";

import { QRCodeSVG } from "qrcode.react";
import { mountWidget, useOpenExternal } from "skybridge/web";
import { useToolInfo } from "../helpers.js";

const QR_TARGET_URL = "https://waniwani.ai";

function formatDuration(minutes: number): string {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	if (m === 0) {
		return `${h}h`;
	}
	return `${h}h${m}`;
}

function SkiPassConfirmation() {
	const { output } = useToolInfo<"ski-pass-confirmation">();
	const openExternal = useOpenExternal();

	if (!output) {
		return (
			<div className="pass-shell">
				<div className="pass-loading">Printing your ski pass…</div>
			</div>
		);
	}

	const {
		bookingRef,
		level,
		groupSize,
		date,
		time,
		lessonPlan,
		lessonTagline,
		durationMinutes,
		priceEur,
		instructor,
		instructorStyle,
		meetingPoint,
		weather,
	} = output;

	return (
		<div
			className="pass-shell"
			data-llm={`Ski pass ${bookingRef} confirmed — ${lessonPlan} with ${instructor}, ${date} ${time}`}
		>
			<div className="pass">
				{/* Alpine backdrop */}
				<svg
					className="pass__mountains"
					viewBox="0 0 400 160"
					preserveAspectRatio="none"
					aria-hidden
					role="img"
					aria-label="Alpine mountains"
				>
					<defs>
						<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#ffd6c4" />
							<stop offset="45%" stopColor="#d1c5f2" />
							<stop offset="100%" stopColor="#8ec9e5" />
						</linearGradient>
					</defs>
					<rect width="400" height="160" fill="url(#sky)" />
					<polygon
						points="0,160 60,90 120,130 180,70 240,115 300,60 360,120 400,95 400,160"
						fill="#1b2e6b"
						opacity="0.85"
					/>
					<polygon
						points="0,160 40,120 90,140 140,105 190,135 240,100 300,130 350,110 400,135 400,160"
						fill="#0a1334"
						opacity="0.9"
					/>
				</svg>

				{/* Drifting snowflakes */}
				<div className="pass__snow" aria-hidden>
					{Array.from({ length: 22 }).map((_, i) => (
						<span
							key={i}
							className="pass__snowflake"
							style={{
								left: `${(i * 4.7) % 100}%`,
								animationDelay: `${(i * 0.5) % 6}s`,
								animationDuration: `${6 + (i % 4)}s`,
								fontSize: `${0.5 + (i % 3) * 0.25}rem`,
							}}
						>
							❋
						</span>
					))}
				</div>

				<div className="pass__content">
					<div className="pass__head">
						<div className="pass__brand">
							<button
								type="button"
								className="pass__qr"
								onClick={() => openExternal(QR_TARGET_URL)}
								aria-label="Scan to learn more"
							>
								<QRCodeSVG
									value={QR_TARGET_URL}
									size={40}
									bgColor="#ffffff"
									fgColor="#0a1334"
									level="M"
									marginSize={1}
								/>
							</button>
							<div>
								<div className="pass__brand-name">Alpine School</div>
								<div className="pass__brand-sub">Concierge Pass</div>
							</div>
						</div>
						<div className="pass__ref">
							<div className="pass__ref-label">Booking</div>
							<div className="pass__ref-code">{bookingRef}</div>
						</div>
					</div>

					<div className="pass__title">
						<div className="pass__plan">{lessonPlan}</div>
						<div className="pass__tagline">{lessonTagline}</div>
					</div>

					<div className="pass__divider" aria-hidden />

					<div className="pass__rows">
						<div className="pass__row">
							<div className="pass__row-label">Date</div>
							<div className="pass__row-value">{date}</div>
						</div>
						<div className="pass__row">
							<div className="pass__row-label">Time</div>
							<div className="pass__row-value">
								{time} · {formatDuration(durationMinutes)}
							</div>
						</div>
						<div className="pass__row">
							<div className="pass__row-label">Skiers</div>
							<div className="pass__row-value">
								{groupSize} · {level}
							</div>
						</div>
						<div className="pass__row">
							<div className="pass__row-label">Instructor</div>
							<div className="pass__row-value">
								{instructor}
								<div className="pass__row-meta">{instructorStyle}</div>
							</div>
						</div>
						<div className="pass__row">
							<div className="pass__row-label">Meet at</div>
							<div className="pass__row-value">{meetingPoint}</div>
						</div>
						<div className="pass__row">
							<div className="pass__row-label">Forecast</div>
							<div className="pass__row-value">{weather}</div>
						</div>
					</div>

					<div className="pass__foot">
						<div className="pass__price">
							<div className="pass__price-label">Total</div>
							<div className="pass__price-amount">{priceEur}€</div>
						</div>
					</div>
				</div>

				{/* Perforated stub edge */}
				<div className="pass__perforation" aria-hidden>
					{Array.from({ length: 16 }).map((_, i) => (
						<span key={i} className="pass__perf-dot" />
					))}
				</div>
			</div>
		</div>
	);
}

export default SkiPassConfirmation;

mountWidget(<SkiPassConfirmation />);
