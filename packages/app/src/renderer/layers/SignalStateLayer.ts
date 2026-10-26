import type { SimView } from "@rail-op-sim/shared";
import { Container, Graphics } from "pixi.js";
import { CELL_SIZE, gridToWorld } from "#/lib/grid";
import { edgePoint, type Lamp, signalLamp } from "#/renderer/operateGeometry";

const LAMP_COLORS: Record<Exclude<Lamp, "doubleYellow">, number> = {
	red: 0xef4444,
	yellow: 0xfacc15,
	green: 0x22c55e,
	white: 0xf8fafc,
};
const LAMP_RADIUS = CELL_SIZE * 0.13;
/** Lamps sit in the cell's top-right corner, clear of the track. */
const LAMP_OFFSET = CELL_SIZE * 0.3;

export interface SignalStateLayer {
	container: Container;
	sync(view: SimView | null): void;
}

/**
 * What every signal shows, as lamps over the signal art, and which way every
 * set of points lies, as a stroke along the leg it is set for.
 */
export function createSignalStateLayer(): SignalStateLayer {
	const container = new Container();
	container.label = "signal-state";
	const points = new Graphics();
	const lamps = new Graphics();
	container.addChild(points, lamps);

	const drawLamp = (x: number, y: number, color: number): void => {
		lamps.circle(x, y, LAMP_RADIUS).fill({ color }).stroke({
			width: 1,
			color: 0x0f172a,
			alpha: 0.6,
		});
	};

	return {
		container,
		sync(view) {
			points.clear();
			lamps.clear();
			if (!view) return;
			for (const s of view.signals) {
				const centre = gridToWorld(s.gx, s.gy);
				const x = centre.x + LAMP_OFFSET;
				const y = centre.y - LAMP_OFFSET;
				const lamp = signalLamp(s.aspect, s.aspects);
				if (lamp === "doubleYellow") {
					drawLamp(x - LAMP_RADIUS * 2.2, y, LAMP_COLORS.yellow);
					drawLamp(x, y, LAMP_COLORS.yellow);
				} else {
					drawLamp(x, y, LAMP_COLORS[lamp]);
				}
			}
			for (const p of view.points) {
				const a = edgePoint(p.gx, p.gy, p.a);
				const centre = gridToWorld(p.gx, p.gy);
				const b = edgePoint(p.gx, p.gy, p.b);
				points.moveTo(a.x, a.y).lineTo(centre.x, centre.y).lineTo(b.x, b.y);
			}
			points.stroke({ width: 2, color: 0xf59e0b, alpha: 0.9, join: "round" });
		},
	};
}
