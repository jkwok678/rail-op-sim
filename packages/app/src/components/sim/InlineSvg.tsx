import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { buildDomColorMap, recolorSvg } from "#/lib/svgColors";

const DOM_COLOR_MAP = buildDomColorMap();

/**
 * Load an SVG markup string asynchronously and recolour it for DOM previews.
 * Cancels stale updates if the key changes or the component unmounts.
 */
export function useRecoloredSvg(
	key: string,
	load: (key: string) => Promise<string>,
): string | null {
	const [markup, setMarkup] = useState<string | null>(null);

	useEffect(() => {
		let active = true;
		load(key)
			.then((svg) => {
				if (active) setMarkup(recolorSvg(svg, DOM_COLOR_MAP));
			})
			.catch(() => {
				if (active) setMarkup(null);
			});
		return () => {
			active = false;
		};
	}, [key, load]);

	return markup;
}

/**
 * Mount bundled SVG markup as real DOM nodes.
 *
 * Railway preview art is static files we recolour, not user HTML. Scripts are
 * stripped and the SVG is imported into the document so we never assign
 * `innerHTML`.
 */
export function InlineSvg({
	markup,
	className,
	title,
}: {
	markup: string;
	className?: string;
	title?: string;
}) {
	const ref = useRef<HTMLSpanElement>(null);

	useLayoutEffect(() => {
		const host = ref.current;
		if (!host) return;
		host.replaceChildren();

		const doc = new DOMParser().parseFromString(markup, "image/svg+xml");
		for (const el of doc.querySelectorAll("script")) el.remove();
		const svg = doc.documentElement;
		if (svg.localName !== "svg") return;
		host.appendChild(document.importNode(svg, true));
	}, [markup]);

	return <span ref={ref} className={className} title={title} />;
}
