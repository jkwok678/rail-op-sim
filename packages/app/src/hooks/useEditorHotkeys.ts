import { type UseHotkeyDefinition, useHotkeys } from "@tanstack/react-hotkeys";
import { PlacementController } from "#/engine/PlacementController";
import { loadDocument, saveDocument } from "#/lib/documentActions";
import { resolveEscape } from "#/lib/escape";
import {
	changeSpeed,
	chooseRouteKind,
	runOrPause,
	toggleLog,
	toggleRouteCancel,
} from "#/lib/operateActions";
import { liveShortcuts } from "#/lib/shortcutGates";
import { SHORTCUT_ORDER, SHORTCUTS, type ShortcutId } from "#/lib/shortcuts";
import { moveActionTo, nextIssueTarget, stepService } from "#/lib/timetableNav";
import { fitToView, zoomIn, zoomOut } from "#/lib/viewportActions";
import { useEditorStore } from "#/store/editor-store";
import {
	operateBlockedReason,
	timetableBlockedReason,
	useModeStore,
} from "#/store/mode-store";
import { useOperateStore } from "#/store/operate-store";
import { useTimetableStore } from "#/store/timetable-store";

/**
 * Bind the editor's keyboard shortcuts. Mount once, from the layout that owns
 * the canvas.
 *
 * Every key comes from the `SHORTCUTS` registry — this file says what a shortcut
 * *does*, never what it is called — so the keys, the toolbar badges and the `?`
 * overlay cannot disagree.
 *
 * Reaches the document through the singleton placement controller, the same way
 * the dialogs and the save/load controls do — the map lives there, not in the
 * store.
 *
 * Only the state that gates a binding is subscribed to; callbacks read the rest
 * through `getState()`, since the library re-syncs them every render and a
 * subscription to (say) the hovered track would re-render this on every pointer
 * move for nothing. The timetable list keys subscribe to selection for the same
 * reason: whether `]` or Alt+Down can fire depends on it.
 */
export function useEditorHotkeys(): void {
	const services = useTimetableStore((s) => s.timetable.services);
	const selectedServiceRef = useTimetableStore((s) => s.selectedServiceRef);
	const selectedActionIndex = useTimetableStore((s) => s.selectedActionIndex);
	const issues = useTimetableStore((s) => s.issues);
	const timetable = useTimetableStore((s) => s.timetable);
	const trackStatus = useEditorStore((s) => s.trackStatus);
	const timetablePicking = useTimetableStore((s) => s.pendingCellPick !== null);
	const selectedActionCount =
		services.find((service) => service.ref === selectedServiceRef)?.actions
			.length ?? 0;
	const serviceRefs = services.map((service) => service.ref);

	const enabled = liveShortcuts({
		mode: useModeStore((s) => s.mode),
		tool: useEditorStore((s) => s.tool),
		canUndo: useEditorStore((s) => s.canUndo),
		canRedo: useEditorStore((s) => s.canRedo),
		railwayConnected: useEditorStore((s) => Boolean(s.trackStatus?.connected)),
		timetableBlocked: timetableBlockedReason(trackStatus) !== null,
		operateBlocked:
			operateBlockedReason(trackStatus, timetable, issues) !== null,
		editDialogOpen: useEditorStore((s) =>
			Boolean(s.pendingText || s.pendingNameTarget),
		),
		shortcutsOpen: useEditorStore((s) => s.showShortcuts),
		timetableCanStep:
			stepService(serviceRefs, selectedServiceRef, 1) !== null ||
			stepService(serviceRefs, selectedServiceRef, -1) !== null,
		timetableCanMoveUp:
			moveActionTo(selectedActionCount, selectedActionIndex, -1) !== null,
		timetableCanMoveDown:
			moveActionTo(selectedActionCount, selectedActionIndex, 1) !== null,
		timetableCanNextIssue:
			nextIssueTarget(issues, selectedServiceRef, selectedActionIndex) !== null,
		timetablePicking,
	});

	/** Escape's target depends on state; `resolveEscape` decides, this applies. */
	const runEscape = (): void => {
		const state = useEditorStore.getState();
		const timetable = useTimetableStore.getState();
		const operate = useOperateStore.getState();
		const action = resolveEscape({
			...state,
			timetableCellPick: timetable.pendingCellPick,
			operateRouteStart: operate.routeStart,
			operateCancelArmed: operate.cancelArmed,
		});
		switch (action.type) {
			case "abandonRoute":
				operate.setRouteStart(null);
				break;
			case "disarmRouteCancel":
				operate.setCancelArmed(false);
				break;
			case "cancelCellPick":
				timetable.cancelCellPick();
				break;
			case "cancelSection":
				// Both halves: the store action alone leaves the pixi highlight on
				// screen, which is why the panel's Cancel button does the same pair.
				state.clearSectionSelection();
				PlacementController.instance?.clearSectionHighlight();
				break;
			case "cancelDirection":
				state.setDirectionStart(null);
				break;
			case "paletteBack":
				state.selectKind(null);
				break;
			case "resetTool":
				state.setTool("select");
				break;
			case "none":
				break;
		}
	};

	/** `[` / `]` — wrap through the service list. */
	const stepSelectedService = (direction: 1 | -1): void => {
		const timetable = useTimetableStore.getState();
		const next = stepService(
			timetable.timetable.services.map((service) => service.ref),
			timetable.selectedServiceRef,
			direction,
		);
		if (next) timetable.selectService(next);
	};

	/** `N` — open the next problem under the service on screen. */
	const jumpToNextIssue = (): void => {
		const timetable = useTimetableStore.getState();
		const target = nextIssueTarget(
			timetable.issues,
			timetable.selectedServiceRef,
			timetable.selectedActionIndex,
		);
		if (!target) return;
		if (
			target.serviceRef &&
			target.serviceRef !== timetable.selectedServiceRef
		) {
			timetable.selectService(target.serviceRef);
		}
		useTimetableStore.getState().selectAction(target.actionIndex);
	};

	/** Alt+arrows — reorder the selected action, and follow it. */
	const moveSelectedAction = (direction: -1 | 1): void => {
		const timetable = useTimetableStore.getState();
		const ref = timetable.selectedServiceRef;
		if (!ref) return;
		const service = timetable.timetable.services.find(
			(item) => item.ref === ref,
		);
		const to = moveActionTo(
			service?.actions.length ?? 0,
			timetable.selectedActionIndex,
			direction,
		);
		if (to === null || timetable.selectedActionIndex === null) return;
		timetable.moveAction(
			ref,
			timetable.selectedActionIndex,
			to,
			PlacementController.instance?.map ?? null,
		);
	};

	/** What each shortcut does. Keys live in the registry, behaviour lives here. */
	const run: Record<ShortcutId, () => void> = {
		toolSelect: () => useEditorStore.getState().setTool("select"),
		toolAdd: () => useEditorStore.getState().setTool("add"),
		toolText: () => useEditorStore.getState().setTool("text"),
		toolLink: () => useEditorStore.getState().setTool("link"),
		toolSection: () => useEditorStore.getState().setTool("section"),
		toolDirection: () => useEditorStore.getState().setTool("direction"),
		toggleEraseMode: () => {
			const s = useEditorStore.getState();
			s.setDirectionMode(s.directionMode === "erase" ? "set" : "erase");
		},

		toggleGrid: () => useEditorStore.getState().toggleShowGrid(),
		toggleLinkHighlights: () =>
			useEditorStore.getState().toggleLinkHighlights(),
		toggleDirections: () => useEditorStore.getState().toggleShowDirections(),
		toggleTrackInfo: () => useEditorStore.getState().toggleShowTrackInfo(),

		modeRailway: () => useModeStore.getState().setMode("railway"),
		modeTimetable: () => useModeStore.getState().setMode("timetable"),
		modeOperate: () => useModeStore.getState().setMode("operate"),

		operateRunPause: runOrPause,
		operateSlower: () => changeSpeed(-1),
		operateFaster: () => changeSpeed(1),
		routeAuto: () => chooseRouteKind("auto"),
		routePreferred: () => chooseRouteKind("preferred"),
		routeUnrestricted: () => chooseRouteKind("unrestricted"),
		routeCancel: toggleRouteCancel,
		operateLog: toggleLog,

		prevService: () => stepSelectedService(-1),
		nextService: () => stepSelectedService(1),
		nextIssue: jumpToNextIssue,
		moveActionUp: () => moveSelectedAction(-1),
		moveActionDown: () => moveSelectedAction(1),

		zoomIn: () => zoomIn(PlacementController.instance?.viewport),
		zoomOut: () => zoomOut(PlacementController.instance?.viewport),
		fitToView: () => fitToView(PlacementController.instance?.viewport),

		save: () => saveDocument(),
		load: () => void loadDocument(),

		undo: () => PlacementController.instance?.undo(),
		redo: () => PlacementController.instance?.redo(),

		help: () => useEditorStore.getState().toggleShortcuts(),
		escape: runEscape,

		// Bound by SectionEditPanel, which owns the values being applied.
		applySection: () => {},
	};

	// One row per registry entry, always, in registry order: `useHotkeys` keys
	// registrations by array index, so a row that disappears would re-register
	// every row after it. Conditionality goes through `enabled`, which only
	// suppresses firing.
	const definitions: UseHotkeyDefinition[] = SHORTCUT_ORDER.map((id) => {
		const shortcut = SHORTCUTS[id];
		return {
			hotkey: shortcut.hotkey,
			callback: () => run[id](),
			options: {
				// Has to be set explicitly: it defaults to false for Ctrl/Meta combos,
				// so without this Mod+Z would fire while the user is typing in the name
				// or text dialog and undo a map edit instead of their keystroke.
				// Escape is the deliberate exception — it must reach us from inside an
				// input to cancel the gesture the input belongs to.
				ignoreInputs: id !== "escape",
				enabled: enabled[id],
				meta: { name: shortcut.label, description: shortcut.label },
			},
		};
	});

	useHotkeys(definitions);
}
