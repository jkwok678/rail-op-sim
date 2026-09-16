import { useEffect, useState } from "react";
import { InlineSvg } from "#/components/sim/InlineSvg";
import { buildDomColorMap, recolorSvg } from "#/lib/svgColors";
import { loadRawSvgByFilename } from "#/lib/svgMap";

const DOM_COLOR_MAP = buildDomColorMap();

/**
 * Renders an aspect preview SVG (loaded by direct filename) as inline markup.
 * Used in the signal aspect selector to show what each signal type looks like.
 */
export function AspectPreview({ filename }: { filename: string }) {
	const [markup, setMarkup] = useState<string | null>(null);

	useEffect(() => {
		let active = true;
		loadRawSvgByFilename(filename)
			.then((svg) => {
				if (active) setMarkup(recolorSvg(svg, DOM_COLOR_MAP));
			})
			.catch(() => {
				if (active) setMarkup(null);
			});
		return () => {
			active = false;
		};
	}, [filename]);

	if (!markup) return <span className="block size-6" aria-hidden="true" />;

	return (
		<InlineSvg
			markup={markup}
			className="block size-6 text-foreground [&_svg]:size-full"
			title={filename}
		/>
	);
}
