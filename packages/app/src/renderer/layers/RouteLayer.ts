import type { RouteKind, SimView } from "@rail-op-sim/shared";
import { Container, Graphics } from "pixi.js";
import { CELL_SIZE } from "#/lib/grid";
import { type Point, spanPoints } from "#/renderer/operateGeometry";

/** RailOS's route colours: blue automatic, green preferred, red unrestricted. */
const ROUTE_COLORS: Record<RouteKind, number> = {
	auto: 0x0ea5e9,
	preferred: 0x10b981,
	unrestricted: 0xef4444,
};
const ROUTE_ALPHA = 0.55;
const ROUTE_WIDTH = CELL_SIZE * 0.3;

export interface RouteLayer {
	container: Container;
	sync(view: SimView | null, flashOn: boolean): void;
}

function strokePath(g: Graphics, points: Point[]): void {
	g.moveTo(points[0].x, points[0].y);
	for (const p of points.slice(1)) g.lineTo(p.x, p.y);
}

/**
 * Routes set, and the one still setting: a band of colour along each, under
 * the trains. The setting route flashes, as RailOS's does.
 */
export function createRouteLayer(): RouteLayer {
	const container = new Container();
	container.label = "routes";
	const g = new Graphics();
	container.addChild(g);

	return {
		container,
		sync(view, flashOn) {
			g.clear();
			if (!view) return;
			const routes = [...view.routes];
			if (view.pendingRoute && flashOn) {
				routes.push({ id: "pending", ...view.pendingRoute });
			}
			for (const route of routes) {
				for (const seg of route.segs) strokePath(g, spanPoints(seg));
				g.stroke({
					width: ROUTE_WIDTH,
					color: ROUTE_COLORS[route.kind],
					alpha: ROUTE_ALPHA,
					cap: "round",
					join: "round",
				});
			}
		},
	};
}
