import { ArrowSquareIn } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import type { DocumentFileFormat } from "#/lib/documentFile";
import {
	convertRailosFiles,
	downloadRailosImport,
	openRailosImport,
	pickRailosFiles,
	type RailosImport,
	railosDownloadNames,
} from "#/lib/railosImport";
import { useEditorStore } from "#/store/editor-store";
import { useModeStore } from "#/store/mode-store";
import { useTimetableStore } from "#/store/timetable-store";

type State =
	| { step: "pick" }
	| { step: "error"; message: string }
	| { step: "converted"; result: RailosImport };

const LABEL = "Import from RailOS (.rly / .ttb)";

const FORMATS: { format: DocumentFileFormat; label: string }[] = [
	{ format: "json", label: "JSON" },
	{ format: "yaml", label: "YAML" },
];

/**
 * Footer button that converts a legacy RailOS railway and/or timetable into
 * this app's documents. The result can be downloaded as JSON or YAML, opened
 * in the editor, or both. Nothing changes until one of those is chosen, so a
 * bad file or a cancelled pick leaves the session as it was. Hidden while
 * operating, like the other document controls.
 */
export function RailosImportControl() {
	const mode = useModeStore((s) => s.mode);
	const [open, setOpen] = useState(false);
	const [state, setState] = useState<State>({ step: "pick" });
	const [format, setFormat] = useState<DocumentFileFormat>(
		() => useEditorStore.getState().saveFormat,
	);
	if (mode === "operate") return null;

	const openDialog = () => {
		setFormat(useEditorStore.getState().saveFormat);
		setOpen(true);
	};

	const choose = async () => {
		try {
			const files = await pickRailosFiles();
			if (!files) return;
			setState({ step: "converted", result: convertRailosFiles(files) });
		} catch (err) {
			setState({
				step: "error",
				message: err instanceof Error ? err.message : String(err),
			});
		}
	};

	const openInEditor = (result: RailosImport) => {
		useTimetableStore.getState().setLoadError(openRailosImport(result, format));
		setOpen(false);
	};

	const onOpenChange = (next: boolean) => {
		setOpen(next);
		if (!next) setState({ step: "pick" });
	};

	const formatLabel = format === "yaml" ? "YAML" : "JSON";

	return (
		<>
			<Button
				variant="ghost"
				size="icon-xs"
				onClick={openDialog}
				aria-label={LABEL}
				title={LABEL}
			>
				<ArrowSquareIn />
			</Button>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent
					// Keep Escape from also reaching the editor's Escape cascade.
					onEscapeKeyDown={(e) => e.stopPropagation()}
				>
					<DialogHeader>
						<DialogTitle>Import from RailOS</DialogTitle>
						<DialogDescription>
							Convert a RailOS railway (.rly), timetable (.ttb), or both. Select
							both files together to convert them as a pair.
						</DialogDescription>
					</DialogHeader>
					{state.step === "converted" ? (
						<ConvertedSummary
							result={state.result}
							format={format}
							onFormatChange={setFormat}
						/>
					) : null}
					{state.step === "error" ? (
						<p role="alert" className="text-xs text-destructive">
							{state.message}
						</p>
					) : null}
					<DialogFooter>
						<Button variant="outline" size="sm" onClick={() => void choose()}>
							{state.step === "converted"
								? "Choose other files…"
								: "Choose files…"}
						</Button>
						{state.step === "converted" ? (
							<>
								<Button
									variant="outline"
									size="sm"
									onClick={() => downloadRailosImport(state.result, format)}
								>
									Download {formatLabel}
								</Button>
								<Button size="sm" onClick={() => openInEditor(state.result)}>
									Open in editor
								</Button>
							</>
						) : null}
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

/** What was converted, the format and files it will download as, and any warnings. */
function ConvertedSummary({
	result,
	format,
	onFormatChange,
}: {
	result: RailosImport;
	format: DocumentFileFormat;
	onFormatChange: (format: DocumentFileFormat) => void;
}) {
	const names = railosDownloadNames(result, format);
	const replaces = [
		result.railway ? "railway" : null,
		result.timetable ? "timetable" : null,
	]
		.filter(Boolean)
		.join(" and ");
	return (
		<div className="space-y-2 text-xs">
			<div className="flex items-center justify-between gap-2">
				<span id="railos-format-label" className="text-muted-foreground">
					Output format
				</span>
				<fieldset
					className="m-0 flex items-center gap-1 border-0 p-0"
					aria-labelledby="railos-format-label"
				>
					{FORMATS.map(({ format: option, label }) => (
						<label
							key={option}
							className={`cursor-pointer px-1.5 py-0.5 has-focus-visible:ring-1 has-focus-visible:ring-ring ${
								format === option
									? "bg-muted text-foreground"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							<input
								type="radio"
								name="railos-output-format"
								value={option}
								checked={format === option}
								onChange={() => onFormatChange(option)}
								className="sr-only"
							/>
							{label}
						</label>
					))}
				</fieldset>
			</div>
			<ul className="space-y-1">
				{result.railway ? (
					<li>
						<span className="font-medium">{result.railway.name}</span> →{" "}
						{names.railway} — {result.railway.summary}
					</li>
				) : null}
				{result.timetable ? (
					<li>
						<span className="font-medium">{result.timetable.name}</span> →{" "}
						{names.timetable} — {result.timetable.summary}
					</li>
				) : null}
			</ul>
			{result.warnings.length > 0 ? (
				<details>
					<summary className="cursor-pointer text-amber-600 dark:text-amber-400">
						{result.warnings.length === 1
							? "1 warning"
							: `${result.warnings.length} warnings`}
					</summary>
					<ul className="mt-1 max-h-40 list-disc space-y-0.5 overflow-y-auto pl-4 text-muted-foreground">
						{result.warnings.map((w) => (
							<li key={w}>{w}</li>
						))}
					</ul>
				</details>
			) : null}
			<p className="text-muted-foreground">
				Opening in the editor replaces the current {replaces}. Save first if you
				want to keep it.
			</p>
		</div>
	);
}
