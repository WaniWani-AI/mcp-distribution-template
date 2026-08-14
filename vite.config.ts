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
	},
});
