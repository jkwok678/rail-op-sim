import { ArrowLeft, X } from "@phosphor-icons/react";
import {
	aspectToLabel,
	BridgeUnderpassType,
	BufferType,
	CrossoverType,
	CurvedType,
	DirectedType,
	ExitType,
	FlyoverType,
	kindToShortLabel,
	LinkedType,
	ParapetType,
	SignalAspect,
	type SignalAspectValue,
	SignalType,
	StraightType,
	SwitchType,
	subtypeWithAspect,
	type TrackKind,
} from "@rail-op-sim/shared";
import { Button } from "#/components/ui/button";
import { Separator } from "#/components/ui/separator";
import { ASPECT_SVG_MAP } from "#/lib/svgMap";
import { type ElementKind, useEditorStore } from "#/store/editor-store";
import { AspectPreview } from "./AspectPreview";
import { TrackPreview } from "./TrackPreview";

/**
 * Track categories in display order (most common first). The order is a
 * palette concern and lives here; the wording is shared with the hover tooltip
 * and the undo labels, so it comes from the track vocabulary in `shared`.
 */
const CATEGORY_KINDS: TrackKind[] = [
	"straight",
	"curved",
	"switch",
	"signal",
	"buffer",
	"exit",
	"directed",
	"crossover",
	"flyover",
	"linked",
	"bridgeUnderpass",
];

const CATEGORIES: { kind: TrackKind; label: string }[] = CATEGORY_KINDS.map(
	(kind) => ({ kind, label: kindToShortLabel(kind) }),
);

const CATEGORY_LABELS: Record<TrackKind, string> = Object.fromEntries(
	CATEGORIES.map((c) => [c.kind, c.label]),
) as Record<TrackKind, string>;

/** Element types shown in the Elements section. */
const ELEMENT_TYPES: {
	kind: ElementKind;
	label: string;
	hasSubtypes: boolean;
}[] = [
	{ kind: "namedLocation", label: "Named Location", hasSubtypes: false },
	{ kind: "concourse", label: "Concourse", hasSubtypes: false },
	{ kind: "parapet", label: "Parapet", hasSubtypes: true },
	{ kind: "platform", label: "Platform", hasSubtypes: true },
	{ kind: "levelCrossing", label: "Level Crossing", hasSubtypes: false },
];

const ELEMENT_LABELS: Record<ElementKind, string> = Object.fromEntries(
	ELEMENT_TYPES.map((e) => [e.kind, e.label]),
) as Record<ElementKind, string>;

/** Label lookup for all categories (tracks + elements). */
const ALL_LABELS: Record<string, string> = {
	...CATEGORY_LABELS,
	...ELEMENT_LABELS,
};

/** Subtype enum values for each kind (both tracks and elements with subtypes). */
const SUBTYPE_VALUES: Record<string, string[]> = {
	// ── Tracks ──
	straight: Object.values(StraightType),
	directed: Object.values(DirectedType),
	curved: Object.values(CurvedType),
	linked: Object.values(LinkedType),
	exit: Object.values(ExitType),
	buffer: Object.values(BufferType),
	signal: Object.values(SignalType),
	bridgeUnderpass: Object.values(BridgeUnderpassType),
	switch: Object.values(SwitchType),
	crossover: Object.values(CrossoverType),
	flyover: Object.values(FlyoverType),
	// ── Elements ──
	parapet: Object.values(ParapetType),
	platform: [
		"PLATFORM_LEFT_SET",
		"PLATFORM_RIGHT_SET",
		"PLATFORM_UP_SET",
		"PLATFORM_DOWN_SET",
	],
	// Single-entry sentinel subtypes for elements without variants
	namedLocation: ["NAMEDLOCATION_SET"],
	concourse: ["CONCOURSE_SET"],
	levelCrossing: ["LEVELCROSSING"],
};

/**
 * Sentinel subtype to auto-select when the user clicks a non-subtype element.
 * (Parapet and platform have real subtype grids — these are for one-click elements.)
 */
const SENTINEL_SUBTYPE: Record<ElementKind, string> = {
	namedLocation: "NAMEDLOCATION_SET",
	concourse: "CONCOURSE_SET",
	parapet: "", // not used — user picks from subtype grid
	platform: "", // not used — user picks from subtype grid
	levelCrossing: "LEVELCROSSING",
};

/** Aspect type options shown below the signal subtype grid. */
const ASPECT_OPTIONS: {
	value: SignalAspectValue;
	label: string;
	filename: string;
}[] = [
	{
		value: SignalAspect.FOUR_ASPECT,
		label: aspectToLabel(SignalAspect.FOUR_ASPECT),
		filename: ASPECT_SVG_MAP[SignalAspect.FOUR_ASPECT],
	},
	{
		value: SignalAspect.THREE_ASPECT,
		label: aspectToLabel(SignalAspect.THREE_ASPECT),
		filename: ASPECT_SVG_MAP[SignalAspect.THREE_ASPECT],
	},
	{
		value: SignalAspect.TWO_ASPECT,
		label: aspectToLabel(SignalAspect.TWO_ASPECT),
		filename: ASPECT_SVG_MAP[SignalAspect.TWO_ASPECT],
	},
	{
		value: SignalAspect.SHUNT,
		label: aspectToLabel(SignalAspect.SHUNT),
		filename: ASPECT_SVG_MAP[SignalAspect.SHUNT],
	},
];

/**
 * Slides out beside the toolbar while the Add tool is active. Shows two sections
 * — Tracks and Elements — at the top level, with subtype grids for track kinds,
 * parapets, and platforms. Non-subtype elements auto-select a sentinel and show
 * a single-item grid so the ghost appears immediately.
 */
export function AddPalette() {
	const tool = useEditorStore((s) => s.tool);
	const selectedKind = useEditorStore((s) => s.selectedKind);
	const selectedSubtype = useEditorStore((s) => s.selectedSubtype);
	const selectedAspect = useEditorStore((s) => s.selectedAspect);
	const selectKind = useEditorStore((s) => s.selectKind);
	const selectSubtype = useEditorStore((s) => s.selectSubtype);
	const setAspect = useEditorStore((s) => s.setAspect);
	const setTool = useEditorStore((s) => s.setTool);
	const toolbarPos = useEditorStore((s) => s.toolbarPos);

	if (tool !== "add") return null;

	// Pass aspect to directional previews so shunt signals show shunt art.
	const previewAspect = selectedKind === "signal" ? selectedAspect : undefined;

	/** Handle clicking an element type button in the Elements section. */
	const handleElementClick = (kind: ElementKind, hasSubtypes: boolean) => {
		if (hasSubtypes) {
			// parapet, platform — drill into subtype grid
			selectKind(kind);
		} else {
			// namedLocation, concourse, levelCrossing — direct placement
			selectKind(kind);
			selectSubtype(SENTINEL_SUBTYPE[kind]);
		}
	};

	/** Whether the current selectedKind has a subtype grid to show. */
	const hasSubtypeGrid =
		selectedKind != null && SUBTYPE_VALUES[selectedKind] != null;
	const subtypeValues = selectedKind ? SUBTYPE_VALUES[selectedKind] : [];
	const isSingleSubtype = subtypeValues.length === 1;

	// Title for the header bar
	const headerTitle = selectedKind
		? (ALL_LABELS[selectedKind] ?? selectedKind)
		: "Add";

	return (
		<div
			className="absolute z-10 max-h-[75vh] min-w-[220px] overflow-y-auto rounded-xl border bg-background/95 p-3 shadow-sm backdrop-blur-sm"
			style={{ left: toolbarPos.x + 56, top: toolbarPos.y }}
		>
			<div className="mb-2 flex items-center justify-between gap-2">
				{selectedKind ? (
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Back to categories"
						onClick={() => selectKind(null)}
					>
						<ArrowLeft size={16} />
					</Button>
				) : (
					<div className="size-7" />
				)}
				<span className="text-sm font-medium">{headerTitle}</span>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Close palette"
					onClick={() => setTool("select")}
				>
					<X size={16} />
				</Button>
			</div>

			{hasSubtypeGrid ? (
				<>
					{isSingleSubtype ? (
						<div className="py-2 text-center text-xs text-muted-foreground">
							Click on canvas to place.
						</div>
					) : (
						<div className="grid grid-cols-3 gap-1">
							{subtypeValues.map((subtype) => (
								<Button
									key={subtype}
									variant={selectedSubtype === subtype ? "secondary" : "ghost"}
									size="icon-lg"
									// Same name the tile's hover title uses, so the two can't
									// disagree about which aspect is selected.
									aria-label={subtypeWithAspect(subtype, previewAspect)}
									aria-pressed={selectedSubtype === subtype}
									onClick={() => selectSubtype(subtype)}
								>
									<TrackPreview subtype={subtype} aspect={previewAspect} />
								</Button>
							))}
						</div>
					)}

					{selectedKind === "signal" && (
						<>
							<Separator className="my-2" />
							<div className="mb-1.5 text-xs font-medium text-muted-foreground">
								Signal type
							</div>
							<div className="flex flex-wrap gap-1">
								{ASPECT_OPTIONS.map(({ value, label, filename }) => (
									<Button
										key={value}
										variant={selectedAspect === value ? "secondary" : "ghost"}
										size="icon-lg"
										aria-label={label}
										aria-pressed={selectedAspect === value}
										onClick={() => setAspect(value)}
									>
										<AspectPreview filename={filename} />
									</Button>
								))}
							</div>
						</>
					)}
				</>
			) : (
				<>
					{/* ── Tracks section ── */}
					<div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Tracks
					</div>
					<div className="grid grid-cols-2 gap-1">
						{CATEGORIES.map(({ kind, label }) => (
							<Button
								key={kind}
								variant="ghost"
								size="sm"
								className="justify-start"
								onClick={() => selectKind(kind)}
							>
								{label}
							</Button>
						))}
					</div>

					<Separator className="my-2" />

					{/* ── Elements section ── */}
					<div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Elements
					</div>
					<div className="grid grid-cols-2 gap-1">
						{ELEMENT_TYPES.map(({ kind, label, hasSubtypes }) => (
							<Button
								key={kind}
								variant="ghost"
								size="sm"
								className="justify-start"
								onClick={() => handleElementClick(kind, hasSubtypes)}
							>
								{label}
							</Button>
						))}
					</div>
				</>
			)}
		</div>
	);
}
