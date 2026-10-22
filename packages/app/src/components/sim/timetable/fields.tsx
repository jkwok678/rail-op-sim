import { Crosshair } from "@phosphor-icons/react";
import { formatSimTime, tryParseSimTime } from "@rail-op-sim/shared";
import { useEffect, useId, useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";

/**
 * The form controls the timetable editor builds every action row out of.
 *
 * They share one shape: a label, a control, and a commit that only fires on a
 * value the model can hold. Half-typed input never reaches the store, which is
 * what stops the validator reporting "06: is not a time" at every keystroke
 * while still re-running on every real change.
 */

function Label({ htmlFor, children }: { htmlFor: string; children: string }) {
	return (
		<label
			htmlFor={htmlFor}
			className="block text-[10px] text-muted-foreground"
		>
			{children}
		</label>
	);
}

/**
 * A clock-time field.
 *
 * Holds its own text while the user types and commits only when
 * `tryParseSimTime` accepts it, so "6" on the way to "06:30" is neither an
 * error nor a silent zero. Text the field rejects is left on screen and marked,
 * rather than snapped back — retyping a time you have half-entered is worse
 * than seeing it flagged.
 */
export function TimeField({
	label,
	value,
	onCommit,
	disabled,
}: {
	label: string;
	value: number | undefined;
	onCommit: (time: number) => void;
	disabled?: boolean;
}) {
	const id = useId();
	const asText = value === undefined ? "" : formatSimTime(value);
	const [text, setText] = useState(asText);

	// Follow the model when it changes underneath — a load, an undo, or the
	// user selecting another action into the same field.
	useEffect(() => setText(asText), [asText]);

	const parsed = tryParseSimTime(text);
	const invalid = text.trim() !== "" && parsed === null;

	return (
		<div className="flex flex-col gap-0.5">
			<Label htmlFor={id}>{label}</Label>
			<Input
				id={id}
				value={text}
				disabled={disabled}
				aria-invalid={invalid}
				placeholder="HH:MM"
				className="tabular-nums"
				onChange={(e) => {
					setText(e.target.value);
					const next = tryParseSimTime(e.target.value);
					if (next !== null) onCommit(next);
				}}
			/>
		</div>
	);
}

/** A plain text field that commits every keystroke. */
export function TextField({
	label,
	value,
	onCommit,
	placeholder,
	maxLength,
}: {
	label: string;
	value: string;
	onCommit: (value: string) => void;
	placeholder?: string;
	maxLength?: number;
}) {
	const id = useId();
	return (
		<div className="flex flex-col gap-0.5">
			<Label htmlFor={id}>{label}</Label>
			<Input
				id={id}
				value={value}
				placeholder={placeholder}
				maxLength={maxLength}
				onChange={(e) => onCommit(e.target.value)}
			/>
		</div>
	);
}

/**
 * A number field. Commits only a finite number, so a cleared box does not
 * become a zero the user did not type.
 */
export function NumberField({
	label,
	value,
	onCommit,
	min,
	step,
}: {
	label: string;
	value: number;
	onCommit: (value: number) => void;
	min?: number;
	step?: number;
}) {
	const id = useId();
	const [text, setText] = useState(String(value));
	useEffect(() => setText(String(value)), [value]);

	return (
		<div className="flex flex-col gap-0.5">
			<Label htmlFor={id}>{label}</Label>
			<Input
				id={id}
				type="number"
				min={min}
				step={step}
				value={text}
				className="tabular-nums"
				onChange={(e) => {
					setText(e.target.value);
					const next = Number(e.target.value);
					if (e.target.value.trim() !== "" && Number.isFinite(next)) {
						onCommit(next);
					}
				}}
			/>
		</div>
	);
}

/**
 * A field that chooses from a fixed list — a location on the railway, or
 * another service in the timetable.
 *
 * A value the list no longer offers is kept as an extra option rather than
 * dropped, so renaming a platform on the map leaves the service showing the
 * name it is booked to (and the validator reporting it) instead of silently
 * jumping to another station.
 */
export function ChoiceField({
	label,
	value,
	options,
	onCommit,
	emptyHint,
}: {
	label: string;
	value: string;
	options: string[];
	onCommit: (value: string) => void;
	emptyHint: string;
}) {
	const id = useId();
	const missing = value !== "" && !options.includes(value);
	const shown = missing ? [value, ...options] : options;

	if (options.length === 0 && !missing) {
		return (
			<div className="flex flex-col gap-0.5">
				<Label htmlFor={id}>{label}</Label>
				<p id={id} className="py-1.5 text-[10px] text-muted-foreground italic">
					{emptyHint}
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-0.5">
			<Label htmlFor={id}>{label}</Label>
			<Select value={value} onValueChange={onCommit}>
				<SelectTrigger
					id={id}
					size="sm"
					className="w-full"
					aria-invalid={missing}
				>
					<SelectValue placeholder="Choose…" />
				</SelectTrigger>
				<SelectContent>
					{shown.map((option) => (
						<SelectItem key={option} value={option}>
							{option}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

/**
 * A grid cell, with a button that arms the canvas for one click.
 *
 * The coordinates stay editable by hand as well — picking on the map is the
 * quick way, but a cell read off a saved file should not have to be clicked
 * for.
 */
export function CellField({
	label,
	value,
	onCommit,
	onPick,
	picking,
}: {
	label: string;
	value: { gx: number; gy: number };
	onCommit: (cell: { gx: number; gy: number }) => void;
	onPick: () => void;
	picking: boolean;
}) {
	const id = useId();
	return (
		<div className="flex flex-col gap-0.5">
			<Label htmlFor={`${id}-x`}>{label}</Label>
			<div className="flex items-center gap-1">
				<Input
					id={`${id}-x`}
					type="number"
					aria-label={`${label} x`}
					value={value.gx}
					className="tabular-nums"
					onChange={(e) => onCommit({ ...value, gx: Number(e.target.value) })}
				/>
				<Input
					type="number"
					aria-label={`${label} y`}
					value={value.gy}
					className="tabular-nums"
					onChange={(e) => onCommit({ ...value, gy: Number(e.target.value) })}
				/>
				<Button
					variant={picking ? "default" : "outline"}
					size="icon-sm"
					onClick={onPick}
					aria-pressed={picking}
					aria-label={
						picking
							? `Click the map to set ${label}`
							: `Pick ${label} on the map`
					}
					title={picking ? "Click the map, or press Escape" : "Pick on the map"}
				>
					<Crosshair />
				</Button>
			</div>
		</div>
	);
}
