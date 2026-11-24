import { InlineSvg, useRecoloredSvg } from "#/components/sim/InlineSvg";
import { loadRawSvgByFilename } from "#/lib/svgMap";

/**
 * Renders an aspect preview SVG (loaded by direct filename) as inline markup.
 * Used in the signal aspect selector to show what each signal type looks like.
 */
export function AspectPreview({ filename }: { filename: string }) {
	const markup = useRecoloredSvg(filename, loadRawSvgByFilename);

	if (!markup) return <span className="block size-6" aria-hidden="true" />;

	return (
		<InlineSvg
			markup={markup}
			className="block size-6 text-foreground [&_svg]:size-full"
			title={filename}
		/>
	);
}
