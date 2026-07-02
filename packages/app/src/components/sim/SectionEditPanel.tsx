import {
	formatImperialLength,
	hasSecondaryPath,
	round1,
	TRACK_COLOR_BOTH,
	TRACK_COLOR_LENGTH,
	TRACK_COLOR_SPEED,
} from "@rail-op-sim/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { PlacementController } from "#/engine/PlacementController";
import { useEditorStore } from "#/store/editor-store";

const MPH_PER_KMH = 1 / 1.609344;
const M_PER_CHAIN = 20.1168;
const YARDS_PER_CHAIN = 22;
const CHAINS_PER_MILE = 80;
const M_PER_YARD = 0.9144;

/** Floating sidepanel for editing speed/length of a selected section. */
export function SectionEditPanel() {
	const sectionStart = useEditorStore((s) => s.sectionStart);
	const sectionEnd = useEditorStore((s) => s.sectionEnd);
	const sectionTracks = useEditorStore((s) => s.sectionTracks);
	const clearSectionSelection = useEditorStore((s) => s.clearSectionSelection);

	const [mainSpeed, setMainSpeed] = useState("200");
	const [mainLength, setMainLength] = useState("100");
	const [secondarySpeed, setSecondarySpeed] = useState("200");
	const [secondaryLength, setSecondaryLength] = useState("100");

	// Converter state
	const [convKmh, setConvKmh] = useState("200");
	const [convMph, setConvMph] = useState("124");
	const [convM, setConvM] = useState("100");
	const [convCh, setConvCh] = useState("5.0");
	const [convYd, setConvYd] = useState("109.4");
	const [convMi, setConvMi] = useState("0.06");
	const confirmingRef = useRef(false);

	const visible = sectionStart && sectionEnd && sectionTracks.length > 0;

	// Check if any track in the section has a secondary path
	const hasSecondary = useMemo(() => {
		if (!visible) return false;
		const ctrl = PlacementController.instance;
		if (!ctrl) return false;
		for (const c of sectionTracks) {
			const track = ctrl.map.getTrackAt(c.gx, c.gy);
			if (track && hasSecondaryPath(track.data.kind)) return true;
		}
		return false;
	}, [visible, sectionTracks]);

	// Total length across all tracks in the section
	const totalLength = useMemo(() => {
		if (!visible) return 0;
		const ctrl = PlacementController.instance;
		if (!ctrl) return 0;
		let sum = 0;
		for (const c of sectionTracks) {
			const track = ctrl.map.getTrackAt(c.gx, c.gy);
			if (track) sum += track.getTrackMainLength();
		}
		return sum;
	}, [visible, sectionTracks]);

	// Pre-fill from the first track in the section when the panel becomes visible
	useEffect(() => {
		if (!visible) return;
		const ctrl = PlacementController.instance;
		if (!ctrl) return;
		const first = sectionTracks[0];
		const track = ctrl.map.getTrackAt(first.gx, first.gy);
		if (track) {
			setMainSpeed(String(track.getTrackMainSpeed()));
			// Main length shows total section length, not per-track
			setMainLength(String(totalLength));
			if (hasSecondaryPath(track.data.kind)) {
				setSecondarySpeed(String(track.getTrackSecondarySpeed()));
				setSecondaryLength(String(track.getTrackSecondaryLength()));
			}
		}
	}, [visible, sectionTracks, totalLength]);

	// ── Converter handlers ──────────────────────────────────────────────

	const handleConvKmh = useCallback((v: string) => {
		setConvKmh(v);
		const n = Number(v);
		if (!Number.isNaN(n) && n >= 0) {
			setConvMph(String(round1(n * MPH_PER_KMH)));
		}
	}, []);

	const handleConvMph = useCallback((v: string) => {
		setConvMph(v);
		const n = Number(v);
		if (!Number.isNaN(n) && n >= 0) {
			setConvKmh(String(round1(n / MPH_PER_KMH)));
		}
	}, []);

	const syncLengthFromM = useCallback((m: number) => {
		const totalYards = m / M_PER_YARD;
		const totalChains = totalYards / YARDS_PER_CHAIN;
		setConvCh(String(round1(totalChains)));
		setConvYd(String(round1(totalYards)));
		setConvMi(String(round1(totalChains / CHAINS_PER_MILE)));
	}, []);

	const handleConvM = useCallback((v: string) => {
		setConvM(v);
		const n = Number(v);
		if (!Number.isNaN(n) && n >= 0) syncLengthFromM(n);
	}, [syncLengthFromM]);

	const handleConvCh = useCallback((v: string) => {
		setConvCh(v);
		const n = Number(v);
		if (!Number.isNaN(n) && n >= 0) {
			const m = Math.round(n * M_PER_CHAIN);
			setConvM(String(m));
			syncLengthFromM(m);
		}
	}, [syncLengthFromM]);

	const handleConvYd = useCallback((v: string) => {
		setConvYd(v);
		const n = Number(v);
		if (!Number.isNaN(n) && n >= 0) {
			const m = Math.round(n * M_PER_YARD);
			setConvM(String(m));
			syncLengthFromM(m);
		}
	}, [syncLengthFromM]);

	const handleConvMi = useCallback((v: string) => {
		setConvMi(v);
		const n = Number(v);
		if (!Number.isNaN(n) && n >= 0) {
			const m = Math.round(n * CHAINS_PER_MILE * M_PER_CHAIN);
			setConvM(String(m));
			syncLengthFromM(m);
		}
	}, [syncLengthFromM]);

	// ── Apply / Defaults / Cancel ────────────────────────────────────────

	const handleApply = useCallback(() => {
		if (confirmingRef.current) return;
		confirmingRef.current = true;
		const ctrl = PlacementController.instance;
		if (ctrl) {
			const ms = Number(mainSpeed);
			const ml = Number(mainLength);
			if (!Number.isNaN(ms) && !Number.isNaN(ml) && ms > 0 && ml > 0) {
				const n = sectionTracks.length;
				const values: {
					mainSpeed: number;
					mainLength: number;
					secondarySpeed?: number;
					secondaryLength?: number;
				} = { mainSpeed: ms, mainLength: Math.round(ml / n) };
				if (hasSecondary) {
					const ss = Number(secondarySpeed);
					const sl = Number(secondaryLength);
					if (!Number.isNaN(ss) && !Number.isNaN(sl) && ss > 0 && sl > 0) {
						values.secondarySpeed = ss;
						values.secondaryLength = sl;
					}
				}
				ctrl.applySectionEdit(values);
			}
		}
		confirmingRef.current = false;
	}, [mainSpeed, mainLength, secondarySpeed, secondaryLength, hasSecondary, sectionTracks.length]);

	const handleDefaults = useCallback(() => {
		const ctrl = PlacementController.instance;
		if (ctrl) {
			ctrl.restoreSection();
			setMainSpeed("200");
			setMainLength(String(200 * sectionTracks.length));
			setSecondarySpeed("200");
			setSecondaryLength("100");
		}
	}, [sectionTracks.length]);

	const handleCancel = useCallback(() => {
		clearSectionSelection();
		const ctrl = PlacementController.instance;
		if (ctrl) {
			ctrl.clearSectionHighlight();
		}
	}, [clearSectionSelection]);

	if (!visible) return null;

	const convImperial = formatImperialLength(Number(convM) || 0);

	return (
		<div className="absolute right-4 top-16 z-10 w-80 rounded-none border border-border bg-background/95 p-3 shadow-sm backdrop-blur-sm text-xs">
			<div className="font-medium mb-2">Section Editor</div>

			{/* Section info */}
			<div className="text-muted-foreground mb-2 space-y-0.5">
				<div>
					{sectionTracks.length} track{sectionTracks.length !== 1 ? "s" : ""}{" "}
					selected — total {totalLength} m
				</div>
				<div>
					Start ({sectionStart!.gx}, {sectionStart!.gy}) → End ({sectionEnd!.gx},{" "}
					{sectionEnd!.gy})
				</div>
			</div>

			{/* Main speed */}
			<label className="block mb-1 text-muted-foreground">
				Main Speed (km/h)
			</label>
			<Input
				type="number"
				min={1}
				value={mainSpeed}
				onChange={(e) => setMainSpeed(e.target.value)}
				className="mb-2"
			/>

			{/* Main length */}
			<label className="block mb-1 text-muted-foreground">
				Main Length — total (m)
			</label>
			<Input
				type="number"
				min={1}
				value={mainLength}
				onChange={(e) => setMainLength(e.target.value)}
				className="mb-2"
			/>

			{/* Secondary speed + length (only for tracks that support it) */}
			{hasSecondary && (
				<>
					<div className="border-t border-border my-2" />
					<div className="text-muted-foreground mb-1 font-medium">
						Secondary Path
					</div>

					<label className="block mb-1 text-muted-foreground">
						Secondary Speed (km/h)
					</label>
					<Input
						type="number"
						min={1}
						value={secondarySpeed}
						onChange={(e) => setSecondarySpeed(e.target.value)}
						className="mb-2"
					/>

					<label className="block mb-1 text-muted-foreground">
						Secondary Length (m)
					</label>
					<Input
						type="number"
						min={1}
						value={secondaryLength}
						onChange={(e) => setSecondaryLength(e.target.value)}
						className="mb-2"
					/>
				</>
			)}

			{/* ── Unit Converter ──────────────────────────────────────────── */}
			<div className="border-t border-border my-2" />
			<div className="text-muted-foreground mb-2 font-medium">Converter</div>

			{/* Speed converter */}
			<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 mb-2">
				<div>
					<label className="block mb-0.5 text-muted-foreground text-[10px]">
						km/h
					</label>
					<Input
						type="number"
						min={0}
						value={convKmh}
						onChange={(e) => handleConvKmh(e.target.value)}
					/>
				</div>
				<span className="text-muted-foreground pt-3.5">=</span>
				<div>
					<label className="block mb-0.5 text-muted-foreground text-[10px]">
						mph
					</label>
					<Input
						type="number"
						min={0}
						value={convMph}
						onChange={(e) => handleConvMph(e.target.value)}
					/>
				</div>
			</div>

			{/* Length converter — row 1: metres ↔ chains */}
			<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 mb-1.5">
				<div>
					<label className="block mb-0.5 text-muted-foreground text-[10px]">
						metres
					</label>
					<Input
						type="number"
						min={0}
						value={convM}
						onChange={(e) => handleConvM(e.target.value)}
					/>
				</div>
				<span className="text-muted-foreground pt-3.5">=</span>
				<div>
					<label className="block mb-0.5 text-muted-foreground text-[10px]">
						chains
					</label>
					<Input
						type="number"
						min={0}
						step="0.1"
						value={convCh}
						onChange={(e) => handleConvCh(e.target.value)}
					/>
				</div>
			</div>
			{/* Length converter — row 2: yards ↔ miles */}
			<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 mb-1">
				<div>
					<label className="block mb-0.5 text-muted-foreground text-[10px]">
						yards
					</label>
					<Input
						type="number"
						min={0}
						step="0.1"
						value={convYd}
						onChange={(e) => handleConvYd(e.target.value)}
					/>
				</div>
				<span className="text-muted-foreground pt-3.5">=</span>
				<div>
					<label className="block mb-0.5 text-muted-foreground text-[10px]">
						miles
					</label>
					<Input
						type="number"
						min={0}
						step="0.01"
						value={convMi}
						onChange={(e) => handleConvMi(e.target.value)}
					/>
				</div>
			</div>
			<div className="text-[10px] text-muted-foreground mb-1 tabular-nums">
				{convImperial}
			</div>

			{/* ── Colour Legend ──────────────────────────────────────────── */}
			<div className="border-t border-border my-2" />
			<div className="mb-1.5 font-medium">Track Status</div>
			<div className="flex gap-3 text-[10px] text-muted-foreground mb-0.5">
				<span className="flex items-center gap-1">
					<span
						className="inline-block size-2.5 rounded-sm shrink-0"
						style={{
							backgroundColor: `#${TRACK_COLOR_SPEED.toString(16).padStart(6, "0")}`,
						}}
					/>
					Speed
				</span>
				<span className="flex items-center gap-1">
					<span
						className="inline-block size-2.5 rounded-sm shrink-0"
						style={{
							backgroundColor: `#${TRACK_COLOR_LENGTH.toString(16).padStart(6, "0")}`,
						}}
					/>
					Length
				</span>
				<span className="flex items-center gap-1">
					<span
						className="inline-block size-2.5 rounded-sm shrink-0"
						style={{
							backgroundColor: `#${TRACK_COLOR_BOTH.toString(16).padStart(6, "0")}`,
						}}
					/>
					Both
				</span>
			</div>

			{/* Actions */}
			<div className="flex gap-1.5 mt-3">
				<Button variant="outline" size="xs" onClick={handleDefaults}>
					Defaults
				</Button>
				<Button variant="outline" size="xs" onClick={handleCancel}>
					Cancel
				</Button>
				<Button variant="default" size="xs" onClick={handleApply}>
					Apply
				</Button>
			</div>
		</div>
	);
}
