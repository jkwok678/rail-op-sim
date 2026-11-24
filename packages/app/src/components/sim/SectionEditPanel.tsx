import {
	DEFAULT_MAIN_LENGTH,
	DEFAULT_MAIN_SPEED,
	formatImperialLength,
	hasSecondaryPath,
	round1,
	TRACK_COLOR_BOTH,
	TRACK_COLOR_LENGTH,
	TRACK_COLOR_SPEED,
} from "@rail-op-sim/shared";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { KbdGroup } from "#/components/ui/kbd";
import { PlacementController } from "#/editor/PlacementController";
import { SHORTCUTS, shortcutKeys } from "#/lib/shortcuts";
import { useEditorStore } from "#/store/editor-store";

/** A PixiJS 0xRRGGBB colour as a CSS hex string. */
const cssHex = (color: number): string =>
	`#${color.toString(16).padStart(6, "0")}`;

/**
 * What each track colour on the map means. Mirrors `getTrackColorState` in the
 * shared package — a track is tinted only where it deviates from the defaults,
 * so an untinted track is the fourth (colourless) case.
 */
const COLOR_LEGEND: { color: string | null; label: string; meaning: string }[] =
	[
		{
			color: cssHex(TRACK_COLOR_SPEED),
			label: "Red",
			meaning: `speed differs from ${DEFAULT_MAIN_SPEED} km/h`,
		},
		{
			color: cssHex(TRACK_COLOR_LENGTH),
			label: "Yellow",
			meaning: `length differs from ${DEFAULT_MAIN_LENGTH} m`,
		},
		{
			color: cssHex(TRACK_COLOR_BOTH),
			label: "Blue",
			meaning: "both speed and length differ",
		},
		{ color: null, label: "Untinted", meaning: "still at the defaults" },
	];

const MPH_PER_KMH = 1 / 1.609344;
const M_PER_CHAIN = 20.1168;
const YARDS_PER_CHAIN = 22;
const CHAINS_PER_MILE = 80;
const M_PER_YARD = 0.9144;

interface SectionValues {
	mainSpeed: string;
	mainLength: string;
	secondarySpeed: string;
	secondaryLength: string;
}

const DEFAULT_SECTION_VALUES: SectionValues = {
	mainSpeed: "200",
	mainLength: "100",
	secondarySpeed: "200",
	secondaryLength: "100",
};

interface SectionEditPayload {
	mainSpeed: number;
	mainLength: number;
	secondarySpeed?: number;
	secondaryLength?: number;
}

function parsePositiveNumber(raw: string): number | null {
	const n = Number(raw);
	return !Number.isNaN(n) && n > 0 ? n : null;
}

function parseNonNegativeNumber(raw: string): number | null {
	const n = Number(raw);
	return !Number.isNaN(n) && n >= 0 ? n : null;
}

function parsePositivePair(a: string, b: string): [number, number] | null {
	const first = parsePositiveNumber(a);
	const second = parsePositiveNumber(b);
	return first !== null && second !== null ? [first, second] : null;
}

function parseSectionEditPayload(
	values: SectionValues,
	trackCount: number,
	hasSecondary: boolean,
): SectionEditPayload | null {
	const main = parsePositivePair(values.mainSpeed, values.mainLength);
	if (!main) return null;
	const payload: SectionEditPayload = {
		mainSpeed: main[0],
		mainLength: Math.round(main[1] / trackCount),
	};
	const secondary = hasSecondary
		? parsePositivePair(values.secondarySpeed, values.secondaryLength)
		: null;
	if (secondary) {
		payload.secondarySpeed = secondary[0];
		payload.secondaryLength = secondary[1];
	}
	return payload;
}

function computeSectionMetrics(sectionTracks: { gx: number; gy: number }[]): {
	hasSecondary: boolean;
	totalLength: number;
} {
	const map = PlacementController.instance?.map;
	if (!map) return { hasSecondary: false, totalLength: 0 };
	const tracks = sectionTracks
		.map((c) => map.getTrackAt(c.gx, c.gy))
		.filter((t): t is NonNullable<typeof t> => t !== null);
	return {
		hasSecondary: tracks.some((t) => hasSecondaryPath(t.data.kind)),
		totalLength: tracks.reduce((sum, t) => sum + t.getTrackMainLength(), 0),
	};
}

function useSectionMetrics(
	visible: boolean,
	sectionTracks: { gx: number; gy: number }[],
): { hasSecondary: boolean; totalLength: number } {
	return useMemo(
		() =>
			visible
				? computeSectionMetrics(sectionTracks)
				: { hasSecondary: false, totalLength: 0 },
		[visible, sectionTracks],
	);
}

function SectionField({
	id,
	label,
	value,
	onChange,
}: {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<>
			<label htmlFor={id} className="block mb-1 text-muted-foreground">
				{label}
			</label>
			<Input
				id={id}
				type="number"
				min={1}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="mb-2"
			/>
		</>
	);
}

interface ConverterInputSpec {
	id: string;
	label: string;
	value: string;
	step?: string;
	onChange: (v: string) => void;
}

function ConverterInput({
	id,
	label,
	value,
	step,
	onChange,
}: ConverterInputSpec) {
	return (
		<div>
			<label
				htmlFor={id}
				className="block mb-0.5 text-muted-foreground text-[10px]"
			>
				{label}
			</label>
			<Input
				id={id}
				type="number"
				min={0}
				step={step}
				value={value}
				onChange={(e) => onChange(e.target.value)}
			/>
		</div>
	);
}

function ConverterPairRow({
	left,
	right,
	className,
}: {
	left: ConverterInputSpec;
	right: ConverterInputSpec;
	className: string;
}) {
	return (
		<div
			className={`grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 ${className}`}
		>
			<ConverterInput {...left} />
			<span className="text-muted-foreground pt-3.5">=</span>
			<ConverterInput {...right} />
		</div>
	);
}

function lengthFieldsFromMetres(m: number) {
	const totalYards = m / M_PER_YARD;
	const totalChains = totalYards / YARDS_PER_CHAIN;
	return {
		ch: String(round1(totalChains)),
		yd: String(round1(totalYards)),
		mi: String(round1(totalChains / CHAINS_PER_MILE)),
	};
}

function useUnitConverterState() {
	const [convKmh, setConvKmh] = useState("200");
	const [convMph, setConvMph] = useState("124");
	const [len, setLen] = useState({
		m: "100",
		ch: "5.0",
		yd: "109.4",
		mi: "0.06",
	});

	const updateKmh = (v: string) => {
		setConvKmh(v);
		const n = parseNonNegativeNumber(v);
		if (n !== null) setConvMph(String(round1(n * MPH_PER_KMH)));
	};

	const updateMph = (v: string) => {
		setConvMph(v);
		const n = parseNonNegativeNumber(v);
		if (n !== null) setConvKmh(String(round1(n / MPH_PER_KMH)));
	};

	const updateLength = (
		v: string,
		field: "m" | "ch" | "yd" | "mi",
		factorToM: number,
	) => {
		const n = parseNonNegativeNumber(v);
		if (n === null) {
			setLen((prev) => ({ ...prev, [field]: v }));
			return;
		}
		const m = field === "m" ? n : Math.round(n * factorToM);
		setLen({
			...lengthFieldsFromMetres(m),
			m: String(m),
			[field]: v,
		});
	};

	return { convKmh, convMph, len, updateKmh, updateMph, updateLength };
}

function SectionUnitConverter() {
	const { convKmh, convMph, len, updateKmh, updateMph, updateLength } =
		useUnitConverterState();

	return (
		<>
			<div className="border-t border-border my-2" />
			<div className="text-muted-foreground mb-2 font-medium">Converter</div>
			<ConverterPairRow
				left={{
					id: "section-conv-kmh",
					label: "km/h",
					value: convKmh,
					onChange: updateKmh,
				}}
				right={{
					id: "section-conv-mph",
					label: "mph",
					value: convMph,
					onChange: updateMph,
				}}
				className="mb-2"
			/>
			<ConverterPairRow
				left={{
					id: "section-conv-m",
					label: "metres",
					value: len.m,
					onChange: (v) => updateLength(v, "m", 1),
				}}
				right={{
					id: "section-conv-ch",
					label: "chains",
					value: len.ch,
					step: "0.1",
					onChange: (v) => updateLength(v, "ch", M_PER_CHAIN),
				}}
				className="mb-1.5"
			/>
			<ConverterPairRow
				left={{
					id: "section-conv-yd",
					label: "yards",
					value: len.yd,
					step: "0.1",
					onChange: (v) => updateLength(v, "yd", M_PER_YARD),
				}}
				right={{
					id: "section-conv-mi",
					label: "miles",
					value: len.mi,
					step: "0.01",
					onChange: (v) => updateLength(v, "mi", CHAINS_PER_MILE * M_PER_CHAIN),
				}}
				className="mb-1"
			/>
			<div className="text-[10px] text-muted-foreground mb-1 tabular-nums">
				{formatImperialLength(Number(len.m) || 0)}
			</div>
		</>
	);
}

function TrackStatusLegend() {
	return (
		<>
			<div className="border-t border-border my-2" />
			<div className="mb-1 font-medium">Track Status</div>
			<div className="text-[10px] text-muted-foreground mb-1.5">
				While a section is selected, track on the map is coloured by how it
				differs from the defaults ({DEFAULT_MAIN_SPEED} km/h,{" "}
				{DEFAULT_MAIN_LENGTH} m per track):
			</div>
			<div className="space-y-1 text-[10px] text-muted-foreground">
				{COLOR_LEGEND.map(({ color, label, meaning }) => (
					<div key={label} className="flex items-center gap-1.5">
						<span
							className="inline-block size-2.5 rounded-sm shrink-0 border border-border"
							style={color ? { backgroundColor: color } : undefined}
						/>
						<span className="text-foreground">{label}</span>
						<span>— {meaning}</span>
					</div>
				))}
			</div>
		</>
	);
}

function SectionEditFormFields({
	values,
	hasSecondary,
	onChange,
}: {
	values: SectionValues;
	hasSecondary: boolean;
	onChange: (patch: Partial<SectionValues>) => void;
}) {
	return (
		<>
			<SectionField
				id="section-main-speed"
				label="Main Speed (km/h)"
				value={values.mainSpeed}
				onChange={(mainSpeed) => onChange({ mainSpeed })}
			/>
			<SectionField
				id="section-main-length"
				label="Main Length — total (m)"
				value={values.mainLength}
				onChange={(mainLength) => onChange({ mainLength })}
			/>
			{hasSecondary && (
				<>
					<div className="border-t border-border my-2" />
					<div className="text-muted-foreground mb-1 font-medium">
						Secondary Path
					</div>
					<SectionField
						id="section-secondary-speed"
						label="Secondary Speed (km/h)"
						value={values.secondarySpeed}
						onChange={(secondarySpeed) => onChange({ secondarySpeed })}
					/>
					<SectionField
						id="section-secondary-length"
						label="Secondary Length (m)"
						value={values.secondaryLength}
						onChange={(secondaryLength) => onChange({ secondaryLength })}
					/>
				</>
			)}
		</>
	);
}

function useSectionForm(
	visible: boolean,
	sectionTracks: { gx: number; gy: number }[],
	totalLength: number,
	hasSecondary: boolean,
	clearSectionSelection: () => void,
) {
	const [values, setValues] = useState<SectionValues>(DEFAULT_SECTION_VALUES);
	const confirmingRef = useRef(false);

	// Pre-fill from the first track in the section when the panel becomes visible.
	useEffect(() => {
		if (!visible) return;
		const first = sectionTracks[0];
		const track = first
			? PlacementController.instance?.map.getTrackAt(first.gx, first.gy)
			: null;
		if (!track) return;
		setValues((prev) => ({
			mainSpeed: String(track.getTrackMainSpeed()),
			// Main length shows total section length, not per-track.
			mainLength: String(totalLength),
			secondarySpeed: hasSecondaryPath(track.data.kind)
				? String(track.getTrackSecondarySpeed())
				: prev.secondarySpeed,
			secondaryLength: hasSecondaryPath(track.data.kind)
				? String(track.getTrackSecondaryLength())
				: prev.secondaryLength,
		}));
	}, [visible, sectionTracks, totalLength]);

	const handleApply = useCallback(() => {
		if (confirmingRef.current) return;
		confirmingRef.current = true;
		const ctrl = PlacementController.instance;
		const payload = ctrl
			? parseSectionEditPayload(values, sectionTracks.length, hasSecondary)
			: null;
		if (ctrl && payload) {
			ctrl.applySectionEdit(payload);
			// The edit is done: close the panel and drop the selection (route
			// tint + endpoint outlines). The speed/length colours stay on, so
			// the result of the edit is what is left on screen.
			ctrl.clearSectionHighlight();
			clearSectionSelection();
		}
		confirmingRef.current = false;
	}, [values, hasSecondary, sectionTracks.length, clearSectionSelection]);

	const handleDefaults = useCallback(() => {
		const ctrl = PlacementController.instance;
		if (!ctrl) return;
		ctrl.restoreSection();
		setValues({
			mainSpeed: "200",
			mainLength: String(200 * sectionTracks.length),
			secondarySpeed: "200",
			secondaryLength: "100",
		});
	}, [sectionTracks.length]);

	const handleCancel = useCallback(() => {
		clearSectionSelection();
		PlacementController.instance?.clearSectionHighlight();
	}, [clearSectionSelection]);

	return { values, setValues, handleApply, handleDefaults, handleCancel };
}

/** Floating sidepanel for editing speed/length of a selected section. */
export function SectionEditPanel() {
	const sectionStart = useEditorStore((s) => s.sectionStart);
	const sectionEnd = useEditorStore((s) => s.sectionEnd);
	const sectionTracks = useEditorStore((s) => s.sectionTracks);
	const clearSectionSelection = useEditorStore((s) => s.clearSectionSelection);
	const panelRef = useRef<HTMLDivElement>(null);

	const visible = Boolean(sectionStart && sectionEnd && sectionTracks.length);
	const { hasSecondary, totalLength } = useSectionMetrics(
		visible,
		sectionTracks,
	);
	const form = useSectionForm(
		visible,
		sectionTracks,
		totalLength,
		hasSecondary,
		clearSectionSelection,
	);

	// Enter applies the edit. Bound here rather than globally because the values
	// being applied are this component's local state.
	//
	// `ignoreInputs: false` is the load-bearing option — Enter defaults to
	// ignoring input-originated events, and the cursor sitting in a speed field is
	// exactly where you want Enter to mean "apply". Scoping to the panel keeps it
	// from firing anywhere else; element listeners also run before the document
	// one and stop propagation by default, so this beats any global binding for
	// free. `handleApply`'s `confirmingRef` latch makes key-repeat safe.
	useHotkey(SHORTCUTS.applySection.hotkey, form.handleApply, {
		target: panelRef,
		ignoreInputs: false,
		enabled: visible,
	});

	if (!visible || !sectionStart || !sectionEnd) return null;

	return (
		<div
			ref={panelRef}
			className="absolute right-4 top-16 z-10 w-80 rounded-none border border-border bg-background/95 p-3 shadow-sm backdrop-blur-sm text-xs"
		>
			<div className="font-medium mb-2">Section Editor</div>
			<div className="text-muted-foreground mb-2 space-y-0.5">
				<div>
					{sectionTracks.length} track{sectionTracks.length !== 1 ? "s" : ""}{" "}
					selected — total {totalLength} m
				</div>
				<div>
					Start ({sectionStart.gx}, {sectionStart.gy}) → End ({sectionEnd.gx},{" "}
					{sectionEnd.gy})
				</div>
			</div>
			<SectionEditFormFields
				values={form.values}
				hasSecondary={hasSecondary}
				onChange={(patch) => form.setValues((prev) => ({ ...prev, ...patch }))}
			/>
			<SectionUnitConverter />
			<TrackStatusLegend />
			<div className="flex gap-1.5 mt-3">
				<Button variant="outline" size="xs" onClick={form.handleDefaults}>
					Defaults
				</Button>
				<Button variant="outline" size="xs" onClick={form.handleCancel}>
					Cancel
					<KbdGroup className="ml-1" keys={shortcutKeys("escape")} />
				</Button>
				<Button variant="default" size="xs" onClick={form.handleApply}>
					Apply
					<KbdGroup className="ml-1" keys={shortcutKeys("applySection")} />
				</Button>
			</div>
		</div>
	);
}
