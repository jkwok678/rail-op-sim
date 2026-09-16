import { SignalAspect } from "@rail-op-sim/shared";
import { useEffect, useState } from "react";
import { InlineSvg } from "#/components/sim/InlineSvg";
import { buildDomColorMap, recolorSvg } from "#/lib/svgColors";
import { loadRawSvg, loadRawSvgByFilename, SHUNT_SVG_MAP } from "#/lib/svgMap";

const DOM_COLOR_MAP = buildDomColorMap();

/**
 * Renders a track subtype's actual SVG art (recoloured for the theme) as inline
 * markup — the same source art the canvas uses, so the palette matches the
 * placed tiles.
 *
 * For signal subtypes, pass {@link aspect} to show the shunt variant when
 * {@link SignalAspect.SHUNT} is selected.
 */
export function TrackPreview({
	subtype,
	aspect,
}: {
	subtype: string;
	/** Signal aspect — when SHUNT, loads the shunt SVG variant. */
	aspect?: number;
}) {
	const [markup, setMarkup] = useState<string | null>(null);

	useEffect(() => {
		let active = true;

		const loader =
			aspect === SignalAspect.SHUNT && SHUNT_SVG_MAP[subtype]
				? loadRawSvgByFilename(SHUNT_SVG_MAP[subtype])
				: loadRawSvg(subtype);

		loader
			.then((svg) => {
				if (active) setMarkup(recolorSvg(svg, DOM_COLOR_MAP));
			})
			.catch(() => {
				if (active) setMarkup(null);
			});
		return () => {
			active = false;
		};
	}, [subtype, aspect]);

	if (!markup) return <span className="block size-7" aria-hidden="true" />;

	return (
		<InlineSvg
			markup={markup}
			className="block size-7 text-foreground [&_svg]:size-full"
			title={aspect ? `${subtype} (shunt)` : subtype}
		/>
	);
}
