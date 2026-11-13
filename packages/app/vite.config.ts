import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	// zod is only imported by the engine worker, which the dependency scan
	// at startup does not crawl. Found late, it is re-optimised mid-session and
	// the worker's import of the old bundle 504s, so operate mode never loads.
	optimizeDeps: { include: ["zod"] },
	plugins: [
		devtools(),
		tailwindcss(),
		tanstackStart(),
		nitro(),
		viteReact(),
		babel({ presets: [reactCompilerPreset()] }),
	],
});

export default config;
