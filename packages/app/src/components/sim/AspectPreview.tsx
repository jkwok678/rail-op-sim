import { useEffect, useState } from "react";
import { buildDomColorMap, recolorSvg } from "#/lib/svgColors";
import { loadRawSvgByFilename } from "#/lib/svgMap";

const DOM_COLOR_MAP = buildDomColorMap();

/** Sanitize SVG markup by removing `<script>` elements via DOMParser. */
function sanitizeSvg(markup: string): string {
	const parser = new DOMParser();
	const doc = parser.parseFromString(markup, "image/svg+xml");
	for (const el of doc.querySelectorAll("script")) el.remove();
	return doc.documentElement.outerHTML;
}

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
				if (active) setMarkup(sanitizeSvg(recolorSvg(svg, DOM_COLOR_MAP)));
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
		<span
			className="block size-6 text-foreground [&_svg]:size-full"
			title={filename}
			dangerouslySetInnerHTML={{ __html: markup }}
		/>
	);
}
