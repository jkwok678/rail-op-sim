import { defineRailway, github, project, service } from "railway/iac";

export default defineRailway(() => {
	const app = service("app", {
		source: github("jkwok678/rail-op-sim", { branch: "master" }),
		build: {
			buildCommand: "pnpm --filter @rail-op-sim/app build",
			watchPatterns: [
				"/packages/app/**",
				"/packages/shared/**",
				"/package.json",
				"/pnpm-lock.yaml",
				"/pnpm-workspace.yaml",
			],
		},
		start: "pnpm --filter @rail-op-sim/app start",
		healthcheck: "/",
		replicas: { "europe-west4-drams3a": 1 },
	});

	return project("rail-op-sim", {
		resources: [app],
	});
});
