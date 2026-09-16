import { useLayoutEffect, useRef } from "react";

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
