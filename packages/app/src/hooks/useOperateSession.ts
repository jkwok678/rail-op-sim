import { serializeMap } from "@rail-op-sim/shared";
import { useEffect } from "react";
import { PlacementController } from "#/editor/PlacementController";
import { useModeStore } from "#/store/mode-store";
import { closeSimSession, openSimSession } from "#/store/sim-bridge";
import { useTimetableStore } from "#/store/timetable-store";

/**
 * Open an operate session when operate mode is entered, and close it when it
 * is left. Mount once, from the layout.
 *
 * The engine gets a snapshot of the railway and timetable as they stood on
 * entry. Neither can be edited in operate mode, so the snapshot cannot go
 * stale while the session runs.
 */
export function useOperateSession(): void {
	const mode = useModeStore((s) => s.mode);
	useEffect(() => {
		if (mode !== "operate") return;
		const map = PlacementController.instance?.map;
		if (!map) return;
		openSimSession(serializeMap(map), useTimetableStore.getState().timetable);
		return () => closeSimSession();
	}, [mode]);
}
