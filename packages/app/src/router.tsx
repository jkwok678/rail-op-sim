import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import {
	RouteError,
	RouteNotFound,
	RoutePending,
} from "#/components/RouteFallbacks";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
	const router = createTanStackRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		defaultErrorComponent: RouteError,
		defaultNotFoundComponent: RouteNotFound,
		defaultPendingComponent: RoutePending,
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
