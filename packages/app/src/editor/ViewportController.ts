import type { Application, Container, Ticker } from "pixi.js";

export interface ViewportState {
	x: number;
	y: number;
	zoom: number;
}

import { PAN_KEY_SPEED } from "./panConstants";
import {
	DEFAULT_MAX_ZOOM,
	DEFAULT_MIN_ZOOM,
	ZOOM_FACTOR,
} from "./zoomConstants";

export interface ViewportControllerOptions {
	world: Container;
	app: Application;
	onChange?: () => void;
	minZoom?: number;
	maxZoom?: number;
}

/**
 * Handles pan (middle-mouse drag or Space+LMB drag),
 * zoom (scroll wheel, centered on cursor), and fit-to-view
 * by directly manipulating a PixiJS Container's scale and position.
 */
export class ViewportController {
	private world: Container;
	private app: Application;
	private canvas: HTMLCanvasElement;
	private onChange: (() => void) | undefined;
	private minZoom: number;
	private maxZoom: number;

	private panning = false;
	private spaceHeld = false;
	private lastX = 0;
	private lastY = 0;

	/** Arrow keys currently held down, for continuous keyboard panning. */
	private heldKeys = new Set<string>();

	private onPointerDown: (e: PointerEvent) => void;
	private onPointerMove: (e: PointerEvent) => void;
	private onPointerUp: (e: PointerEvent) => void;
	private onPointerCancel: (e: PointerEvent) => void;
	private onPointerLeave: (e: PointerEvent) => void;
	private onWheel: (e: WheelEvent) => void;
	private onKeyDown: (e: KeyboardEvent) => void;
	private onKeyUp: (e: KeyboardEvent) => void;
	private onTick: (ticker: Ticker) => void;

	constructor(opts: ViewportControllerOptions) {
		this.world = opts.world;
		this.app = opts.app;
		this.canvas = opts.app.canvas;
		this.onChange = opts.onChange;
		this.minZoom = opts.minZoom ?? DEFAULT_MIN_ZOOM;
		this.maxZoom = opts.maxZoom ?? DEFAULT_MAX_ZOOM;

		this.onPointerDown = this.handlePointerDown.bind(this);
		this.onPointerMove = this.handlePointerMove.bind(this);
		this.onPointerUp = this.handlePointerUp.bind(this);
		this.onPointerCancel = this.handlePointerUp.bind(this);
		this.onPointerLeave = this.handlePointerUp.bind(this);
		this.onWheel = this.handleWheel.bind(this);
		this.onKeyDown = this.handleKeyDown.bind(this);
		this.onKeyUp = this.handleKeyUp.bind(this);
		this.onTick = this.handleTick.bind(this);
	}

	// Dynamically imported by usePixiApp, so static class-member tracking misses these.
	// fallow-ignore-next-line unused-class-member
	get state(): ViewportState {
		return {
			x: this.world.position.x,
			y: this.world.position.y,
			zoom: this.world.scale.x,
		};
	}

	/** Whether a pan drag is currently in progress. */
	get isPanning(): boolean {
		return this.panning;
	}

	/** Attach DOM event listeners. Call after the canvas is in the DOM. */
	// fallow-ignore-next-line unused-class-member
	attach(): void {
		this.canvas.addEventListener("pointerdown", this.onPointerDown);
		this.canvas.addEventListener("pointermove", this.onPointerMove);
		this.canvas.addEventListener("pointerup", this.onPointerUp);
		this.canvas.addEventListener("pointercancel", this.onPointerCancel);
		this.canvas.addEventListener("pointerleave", this.onPointerLeave);
		this.canvas.addEventListener("wheel", this.onWheel, { passive: false });
		window.addEventListener("keydown", this.onKeyDown);
		window.addEventListener("keyup", this.onKeyUp);
		this.app.ticker.add(this.onTick);
	}

	/** Remove all DOM event listeners. Call before destroying the app. */
	// fallow-ignore-next-line unused-class-member
	detach(): void {
		this.canvas.removeEventListener("pointerdown", this.onPointerDown);
		this.canvas.removeEventListener("pointermove", this.onPointerMove);
		this.canvas.removeEventListener("pointerup", this.onPointerUp);
		this.canvas.removeEventListener("pointercancel", this.onPointerCancel);
		this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
		this.canvas.removeEventListener("wheel", this.onWheel);
		window.removeEventListener("keydown", this.onKeyDown);
		window.removeEventListener("keyup", this.onKeyUp);
		this.app.ticker.remove(this.onTick);
		this.heldKeys.clear();
	}

	/** Reset transform so the grid extent fits the screen. */
	// fallow-ignore-next-line unused-class-member
	fitToView(extent = 5000, padding = 40): void {
		const availableWidth = this.app.screen.width - padding * 2;
		const availableHeight = this.app.screen.height - padding * 2;
		const worldWidth = extent * 2;
		const worldHeight = extent * 2;

		const zoom = Math.min(
			availableWidth / worldWidth,
			availableHeight / worldHeight,
		);
		const clampedZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));

		this.world.scale.set(clampedZoom);
		// Center the world origin (0,0) on the screen.
		this.world.position.set(
			this.app.screen.width / 2,
			this.app.screen.height / 2,
		);

		this.notify();
	}

	/** Set zoom centered on a screen point (defaults to screen center). */
	// fallow-ignore-next-line unused-class-member
	zoomTo(zoom: number, screenX?: number, screenY?: number): void {
		const sx = screenX !== undefined ? screenX : this.app.screen.width / 2;
		const sy = screenY !== undefined ? screenY : this.app.screen.height / 2;
		const clamped = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
		this.applyZoom(clamped, sx, sy);
		this.notify();
	}

	/** Pan so the world point `(wx, wy)` sits in the middle of the screen. */
	centreOn(wx: number, wy: number): void {
		const scale = this.world.scale.x;
		this.world.position.set(
			this.app.screen.width / 2 - wx * scale,
			this.app.screen.height / 2 - wy * scale,
		);
		this.notify();
	}

	/** Nudge the view by a screen-pixel delta. */
	panBy(dx: number, dy: number): void {
		this.world.position.x += dx;
		this.world.position.y += dy;
		this.notify();
	}

	private notify(): void {
		this.onChange?.();
	}

	// --- Pointer events ---

	private handlePointerDown(e: PointerEvent): void {
		const shouldPan = e.button === 1 || (e.button === 0 && this.spaceHeld);

		if (shouldPan) {
			this.panning = true;
			this.lastX = e.clientX;
			this.lastY = e.clientY;
			this.canvas.setPointerCapture(e.pointerId);
			e.preventDefault();
		}
	}

	private handlePointerMove(e: PointerEvent): void {
		if (!this.panning) return;

		const dx = e.clientX - this.lastX;
		const dy = e.clientY - this.lastY;
		this.lastX = e.clientX;
		this.lastY = e.clientY;

		this.world.position.x += dx;
		this.world.position.y += dy;
		this.notify();
	}

	private handlePointerUp(e: PointerEvent): void {
		if (!this.panning) return;

		this.panning = false;
		this.canvas.releasePointerCapture(e.pointerId);
		this.updateCursor();
	}

	// --- Wheel / zoom ---

	private handleWheel(e: WheelEvent): void {
		e.preventDefault();

		const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
		const newZoom = Math.max(
			this.minZoom,
			Math.min(this.maxZoom, this.world.scale.x * factor),
		);
		this.applyZoom(newZoom, e.offsetX, e.offsetY);
		this.notify();
	}

	private applyZoom(newZoom: number, screenX: number, screenY: number): void {
		const oldZoom = this.world.scale.x;

		// World position under the cursor before zoom
		const worldX = (screenX - this.world.position.x) / oldZoom;
		const worldY = (screenY - this.world.position.y) / oldZoom;

		this.world.scale.set(newZoom);

		// Adjust position so the same world point stays under the cursor
		this.world.position.x = screenX - worldX * newZoom;
		this.world.position.y = screenY - worldY * newZoom;
	}

	// --- Keyboard ---

	private handleKeyDown(e: KeyboardEvent): void {
		// Ignore keyboard panning while the user is typing in a form field.
		if (this.isTypingTarget(e.target)) return;

		if (e.code === "Space" && !e.repeat) {
			e.preventDefault();
			this.spaceHeld = true;
			this.updateCursor();
			return;
		}

		// Unmodified arrows pan. Alt, Ctrl, and Meta are editor chords — timetable
		// action reorder among them — and must not also scroll the map.
		if (this.isArrowKey(e.code) && !e.altKey && !e.ctrlKey && !e.metaKey) {
			e.preventDefault();
			this.heldKeys.add(e.code);
		}
	}

	private handleKeyUp(e: KeyboardEvent): void {
		if (e.code === "Space") {
			this.spaceHeld = false;
			this.updateCursor();
		}

		this.heldKeys.delete(e.code);
	}

	private isArrowKey(code: string): boolean {
		return (
			code === "ArrowLeft" ||
			code === "ArrowRight" ||
			code === "ArrowUp" ||
			code === "ArrowDown"
		);
	}

	private isTypingTarget(target: EventTarget | null): boolean {
		const el = target as HTMLElement | null;
		if (!el) return false;
		const tag = el.tagName;
		return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
	}

	// --- Ticker: continuous keyboard panning ---

	private handleTick(ticker: Ticker): void {
		if (this.heldKeys.size === 0) return;

		const step = PAN_KEY_SPEED * ticker.deltaTime;
		let dx = 0;
		let dy = 0;

		// An arrow reveals content in its direction, so the world shifts opposite.
		if (this.heldKeys.has("ArrowLeft")) dx += step;
		if (this.heldKeys.has("ArrowRight")) dx -= step;
		if (this.heldKeys.has("ArrowUp")) dy += step;
		if (this.heldKeys.has("ArrowDown")) dy -= step;

		if (dx !== 0 || dy !== 0) {
			this.panBy(dx, dy);
		}
	}

	private updateCursor(): void {
		if (this.panning) {
			this.canvas.style.cursor = "grabbing";
		} else if (this.spaceHeld) {
			this.canvas.style.cursor = "grab";
		} else {
			this.canvas.style.cursor = "";
		}
	}
}
