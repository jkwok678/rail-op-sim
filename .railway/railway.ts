import { defineRailway, github, project, service } from "railway/iac";

export default defineRailway(() => {
	const app = service("@rail-op-sim/app", {
		source: github("jkwok678/rail-op-sim", { branch: "master" }),
		build: {
			buildCommand: "pnpm --filter @rail-op-sim/app build",
			watchPatterns: ["/packages/app/**"],
		},
		start: "pnpm --filter @rail-op-sim/app start",
		replicas: { "europe-west4-drams3a": 1 },
	});

	return project("grateful-forgiveness", {
		resources: [app],
	});
});
