import { SignalAspect, subtypeWithAspect } from "@rail-op-sim/shared";
import { InlineSvg, useRecoloredSvg } from "#/components/sim/InlineSvg";
import { loadRawSvg, loadRawSvgByFilename, SHUNT_SVG_MAP } from "#/lib/svgMap";

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
	aspect?: number | undefined;
}) {
	const shuntFile =
		aspect === SignalAspect.SHUNT ? SHUNT_SVG_MAP[subtype] : undefined;
	const markup = useRecoloredSvg(
		shuntFile ?? subtype,
		shuntFile ? loadRawSvgByFilename : loadRawSvg,
	);

	if (!markup) return <span className="block size-7" aria-hidden="true" />;

	return (
		<InlineSvg
			markup={markup}
			className="block size-7 text-foreground [&_svg]:size-full"
			title={subtypeWithAspect(subtype, aspect)}
		/>
	);
}
