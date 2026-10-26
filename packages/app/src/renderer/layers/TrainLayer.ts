import type { SimView, TrainView } from "@rail-op-sim/shared";
import { Container, Graphics, Text } from "pixi.js";
import { CELL_SIZE } from "#/lib/grid";
import { trainColor, trainPoints } from "#/renderer/operateGeometry";

const BODY_WIDTH = CELL_SIZE * 0.42;

export interface TrainLayer {
	container: Container;
	sync(view: SimView | null): void;
}

/** Every train as a thick line along the track, its headcode by its front. */
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
					fontSize: CELL_SIZE * 0.36,
					fill: 0x0f172a,
					stroke: { color: 0xffffff, width: 3 },
				},
			});
			text.anchor.set(0.5, 1.2);
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
				const points = trainPoints(train);
				if (points.length < 2) continue;
				seen.add(train.id);
				bodies.moveTo(points[0].x, points[0].y);
				for (const p of points.slice(1)) bodies.lineTo(p.x, p.y);
				bodies.stroke({
					width: BODY_WIDTH,
					color: trainColor(train),
					cap: "round",
					join: "round",
				});
				const front = points[points.length - 1];
				bodies
					.circle(front.x, front.y, BODY_WIDTH * 0.35)
					.fill({ color: 0xdc2626 });
				label(train).position.set(front.x, front.y);
			}
			for (const [id, text] of texts) {
				if (seen.has(id)) continue;
				text.destroy();
				texts.delete(id);
			}
		},
	};
}
