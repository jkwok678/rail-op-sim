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

	return {
		container,
		sync(view) {
			bodies.clear();
			const seen = new Set<number>();
			for (const train of view?.trains ?? []) {
				// A train part way through a linked-track hop is two pieces, one
				// at each end, never a line across the map between them.
				const pieces = trainPaths(train).filter((p) => p.length >= 2);
				if (pieces.length === 0) continue;
				seen.add(train.id);
				for (const points of pieces) {
					bodies.moveTo(points[0].x, points[0].y);
					for (const p of points.slice(1)) bodies.lineTo(p.x, p.y);
					bodies.stroke({
						width: BODY_WIDTH,
						color: trainColor(train),
						cap: "butt",
						join: "miter",
					});
				}
				const anchor = labelAnchor(pieces);
				if (!anchor) continue;
				const text = label(train);
				text.position.set(anchor.x, anchor.y);
				text.rotation = anchor.angle;
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
				const head = pieces[pieces.length - 1];
				const tail = pathTail(head, BODY_WIDTH * 0.35);
				bodies.moveTo(tail[0].x, tail[0].y);
				for (const p of tail.slice(1)) bodies.lineTo(p.x, p.y);
				bodies.stroke({
					width: BODY_WIDTH,
					color: 0xdc2626,
					cap: "butt",
					join: "miter",
				});
			}
			for (const [id, text] of texts) {
				if (seen.has(id)) continue;
				text.destroy();
				texts.delete(id);
			}
		},
	};
}
