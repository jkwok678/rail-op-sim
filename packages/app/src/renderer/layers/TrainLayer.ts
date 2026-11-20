import type { SimView, TrainView } from "@rail-op-sim/shared";
import { Container, Graphics, Text } from "pixi.js";
import { CELL_SIZE } from "#/lib/grid";
import {
	labelAnchor,
	pathTail,
	trainColor,
	trainPaths,
} from "#/renderer/operateGeometry";

const BODY_WIDTH = CELL_SIZE * 0.42;
const FONT_SIZE = CELL_SIZE * 0.36;
const PLATE_PADDING = CELL_SIZE * 0.12;
// The headcode font is monospaced, so its width is known without measuring
// (which needs a canvas).
const GLYPH_WIDTH = FONT_SIZE * 0.6;

export interface TrainLayer {
	container: Container;
	sync(view: SimView | null): void;
}

/**
 * Every train as a square-ended band along the track, with a red block at its
 * front and its headcode on the body, turned to run along the rail. A plate in
 * the body colour sits under the headcode so it reads on a short train.
 */
function strokePolyline(
	bodies: Graphics,
	points: readonly { x: number; y: number }[],
	color: number,
): void {
	bodies.moveTo(points[0].x, points[0].y);
	for (const p of points.slice(1)) bodies.lineTo(p.x, p.y);
	bodies.stroke({ width: BODY_WIDTH, color, cap: "butt", join: "miter" });
}

function drawHeadcodePlate(
	bodies: Graphics,
	train: TrainView,
	anchor: { x: number; y: number; angle: number },
): void {
	const half = (train.headcode.length * GLYPH_WIDTH + PLATE_PADDING) / 2;
	const ux = Math.cos(anchor.angle) * half;
	const uy = Math.sin(anchor.angle) * half;
	const nx = -Math.sin(anchor.angle) * (BODY_WIDTH / 2);
	const ny = Math.cos(anchor.angle) * (BODY_WIDTH / 2);
	bodies
		.poly([
			anchor.x - ux - nx,
			anchor.y - uy - ny,
			anchor.x + ux - nx,
			anchor.y + uy - ny,
			anchor.x + ux + nx,
			anchor.y + uy + ny,
			anchor.x - ux + nx,
			anchor.y - uy + ny,
		])
		.fill({ color: trainColor(train) });
	if (train.signallerControl) {
		bodies.stroke({ width: 2, color: 0xd97706 });
	}
	if (train.reminder !== null) {
		bodies
			.circle(anchor.x + ux - nx * 0.65, anchor.y + uy - ny * 0.65, 3)
			.fill({ color: 0x0284c7 });
	}
}

export function createTrainLayer(): TrainLayer {
	const container = new Container();
	container.label = "trains";
	const bodies = new Graphics();
	const labels = new Container();
	container.addChild(bodies, labels);
	const texts = new Map<number, Text>();

	const label = (train: TrainView): Text => {
		let text = texts.get(train.id);
		if (!text) {
			text = new Text({
				text: train.headcode,
				style: {
					fontFamily: "JetBrains Mono Variable, monospace",
					fontSize: FONT_SIZE,
					fontWeight: "bold",
					fill: 0x0f172a,
				},
			});
			text.anchor.set(0.5, 0.5);
			texts.set(train.id, text);
			labels.addChild(text);
		}
		text.text = train.headcode;
		return text;
	};

	const drawTrain = (train: TrainView, seen: Set<number>): void => {
		// A train part way through a linked-track hop is two pieces, one
		// at each end, never a line across the map between them.
		const pieces = trainPaths(train).filter((p) => p.length >= 2);
		if (pieces.length === 0) return;
		seen.add(train.id);
		const color = trainColor(train);
		for (const points of pieces) strokePolyline(bodies, points, color);

		const anchor = labelAnchor(pieces);
		if (!anchor) return;
		const text = label(train);
		text.position.set(anchor.x, anchor.y);
		text.rotation = anchor.angle;
		drawHeadcodePlate(bodies, train, anchor);

		const head = pieces[pieces.length - 1];
		strokePolyline(bodies, pathTail(head, BODY_WIDTH * 0.35), 0xdc2626);
	};

	return {
		container,
		sync(view) {
			bodies.clear();
			const seen = new Set<number>();
			for (const train of view?.trains ?? []) drawTrain(train, seen);
			for (const [id, text] of texts) {
				if (seen.has(id)) continue;
				text.destroy();
				texts.delete(id);
			}
		},
	};
}
