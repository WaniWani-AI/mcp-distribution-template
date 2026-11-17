import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { skybridge } from "skybridge/vite";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [skybridge(), react(), tailwindcss()],
	server: {
		forwardConsole: {
			unhandledErrors: true,
			logLevels: ["error"],
		},
	},
	resolve: {
		alias: {
			"@": new URL("./src", import.meta.url).pathname,
		},
	},
	build: {
		// Vite's 500 kB default is calibrated for page bundles. A view bundle carries
		// react-dom plus the MCP app bridge and its zod dependency before the app
		// writes a line — around 300 kB of floor, and zod alone is half of it, reached
		// from a method on the bridge every view instantiates, so it cannot be shaken
		// out here. Code-splitting a single-entry view only moves those bytes between
		// files. The limit is raised rather than the warning disabled: at 800 kB it
		// still fires on a view that has genuinely grown.
		chunkSizeWarningLimit: 800,
		// Views are served publicly from `/assets`, so a map there hands the
		// widget's source to anyone who opens devtools on the host page. Only a
		// Vercel preview build (staging) emits them. Production, and every build
		// off Vercel (Docker, Alpic, a local `build`), has no `VERCEL_ENV` of
		// "preview" and ships none.
		sourcemap: process.env.VERCEL_ENV === "preview",
		// A font file is always emitted, never inlined as a `data:` URI, however
		// small. The MCP Apps widget CSP allows fonts from the server's origin but
		// has no `font-src data:`, so an inlined face is blocked. Other assets keep
		// Vite's 4 kB default.
		assetsInlineLimit: (file) =>
			/\.(woff2?|ttf|otf)$/i.test(file) ? false : undefined,
	},
});
