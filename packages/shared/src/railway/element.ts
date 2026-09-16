import { recordField } from "./effect-journal";
import { ParapetType } from "./enums";
import type { FontInfo } from "./types";

// ============================================================================
// Element — abstract base class for all placeable items
// ============================================================================

/**
 * @brief Base class for all items the user can place on screen.
 * Ported from RailwayBuilder element.h / element.cpp.
 */
export abstract class Element {
	protected locationX: number;
	protected locationY: number;

	constructor();
	constructor(currentX: number, currentY: number);
	constructor(currentX?: number, currentY?: number) {
		if (currentX !== undefined) {
			this.locationX = currentX;
		} else {
			this.locationX = 0;
		}
		if (currentY !== undefined) {
			this.locationY = currentY;
		} else {
			this.locationY = 0;
		}
	}

	getLocationX(): number {
		return this.locationX;
	}

	setLocationX(newLocationX: number): void {
		recordField("locationX", this.locationX, newLocationX, (x) => {
			this.locationX = x;
		});
		this.locationX = newLocationX;
	}

	getLocationY(): number {
		return this.locationY;
	}

	setLocationY(newLocationY: number): void {
		recordField("locationY", this.locationY, newLocationY, (y) => {
			this.locationY = y;
		});
		this.locationY = newLocationY;
	}

	/** @returns "x,y" — replaces locationToQString() */
	locationToString(): string {
		return `${this.locationX},${this.locationY}`;
	}

	/** @returns human-readable string representation */
	abstract toString(): string;

	/** @returns file-save format string representation */
	abstract toSaveString(): string;
}

// ============================================================================
// Text — editable text on canvas
// ============================================================================

/**
 * @brief A block of text that appears on the canvas with an editable bounding point.
 * Ported from RailwayBuilder element.h Text class.
 */
export class Text extends Element {
	private editableX: number;
	private editableY: number;
	private fontSize: number;
	private readableText: string;
	private font: FontInfo;

	constructor(
		newLocationX: number,
		newLocationY: number,
		newReadableText: string,
		newFont: FontInfo,
	) {
		super(newLocationX, newLocationY);
		this.readableText = newReadableText;
		this.fontSize = 12;
		this.editableX = this.locationX + this.fontSize;
		this.editableY = this.locationY + this.fontSize;
		this.font = newFont;
	}

	getEditableX(): number {
		return this.editableX;
	}

	setEditableX(newEditableX: number): void {
		recordField("editableX", this.editableX, newEditableX, (x) => {
			this.editableX = x;
		});
		this.editableX = newEditableX;
	}

	getEditableY(): number {
		return this.editableY;
	}

	setEditableY(newEditableY: number): void {
		recordField("editableY", this.editableY, newEditableY, (y) => {
			this.editableY = y;
		});
		this.editableY = newEditableY;
	}

	getFontSize(): number {
		return this.fontSize;
	}

	setFontSize(newFontSize: number): void {
		recordField("fontSize", this.fontSize, newFontSize, (n) => {
			this.fontSize = n;
		});
		this.fontSize = newFontSize;
	}

	getReadableText(): string {
		return this.readableText;
	}

	setReadableText(newReadableText: string): void {
		recordField("readableText", this.readableText, newReadableText, (t) => {
			this.readableText = t;
		});
		this.readableText = newReadableText;
	}

	getFont(): FontInfo {
		return this.font;
	}

	setFont(newFont: FontInfo): void {
		recordField("font", this.font, newFont, (f) => {
			this.font = f;
		});
		this.font = newFont;
	}

	/** @returns "Text,x,y,readableText,family,pointSize" */
	toString(): string {
		return `Text,${this.locationToString()},${this.readableText},${this.font.family},${this.font.pointSize}`;
	}

	/** @returns "x,y,readableText,family,pointSize" */
	toSaveString(): string {
		return `${this.locationToString()},${this.readableText},${this.font.family},${this.font.pointSize}`;
	}
}

// ============================================================================
// NamedElement — abstract element with an optional Text label
// ============================================================================

/**
 * @brief Intermediate class for elements that can have an associated Text label.
 * Ported from RailwayBuilder element.h NamedElement class.
 */
export abstract class NamedElement extends Element {
	protected text: Text | null = null;

	constructor();
	constructor(currentX: number, currentY: number);
	constructor(currentX?: number, currentY?: number) {
		if (currentX !== undefined && currentY !== undefined) {
			super(currentX, currentY);
		} else {
			super();
		}
		this.text = null;
	}

	/** @returns true if the element has an associated Text label */
	getNamed(): boolean {
		return this.text !== null;
	}

	/** @returns the linked Text object, or null */
	getText(): Text | null {
		return this.text;
	}

	/**
	 * Sets the linked Text object.
	 *
	 * Every text link and unlink in the package funnels through here, including
	 * the unbounded neighbour recursion in linkLocalText and the global unlink in
	 * deleteTextFromAllElements. Journalling this one method is therefore what
	 * makes naming and deletion invertible without predicting their blast radius.
	 */
	setText(newText: Text | null): void {
		recordField("setText", this.text, newText, (x) => {
			this.text = x;
		});
		this.text = newText;
	}

	/** @returns "NamedElement,x,y[,Text,...]" */
	toString(): string {
		let result = `NamedElement,${this.locationToString()}`;
		const txt = this.getText();
		if (txt) {
			result += `,${txt.toString()}`;
		}
		return result;
	}

	abstract toSaveString(): string;
}

// ============================================================================
// NamedLocation — blue block, concourse-like, must be named
// ============================================================================

/**
 * @brief A blue block on the canvas that acts like a concourse and needs a text name.
 * Ported from RailwayBuilder element.h NamedLocation class.
 */
export class NamedLocation extends NamedElement {
	constructor(newLocationX: number, newLocationY: number) {
		super(newLocationX, newLocationY);
		this.text = null;
	}

	/** @returns "NamedLocation,x,y[,Text,...]" */
	toString(): string {
		let result = `NamedLocation,${this.locationToString()}`;
		const txt = this.getText();
		if (txt) {
			result += `,${txt.toString()}`;
		}
		return result;
	}

	/** @returns "x,y[,readableText]" */
	toSaveString(): string {
		let result = this.locationToString();
		const txt = this.getText();
		if (txt) {
			result += `,${txt.getReadableText()}`;
		}
		return result;
	}
}

// ============================================================================
// Concourse — red block (like platforms)
// ============================================================================

/**
 * @brief A red block on the canvas (like platforms).
 * Ported from RailwayBuilder element.h Concourse class.
 */
export class Concourse extends NamedElement {
	constructor(newLocationX: number, newLocationY: number) {
		super(newLocationX, newLocationY);
		this.text = null;
	}

	/** @returns "Concourse,x,y[,Text,...]" */
	toString(): string {
		let result = `Concourse,${this.locationToString()}`;
		const txt = this.getText();
		if (txt) {
			result += `,${txt.toString()}`;
		}
		return result;
	}

	/** @returns "x,y[,readableText]" */
	toSaveString(): string {
		let result = this.locationToString();
		const txt = this.getText();
		if (txt) {
			result += `,${txt.getReadableText()}`;
		}
		return result;
	}
}

// ============================================================================
// Parapet — decorative structure, 28 types, not nameable
// ============================================================================

/**
 * @brief A structure on the canvas that cannot be named.
 * Ported from RailwayBuilder element.h Parapet class.
 */
export class Parapet extends Element {
	private parapetType: ParapetType;

	constructor(
		newParapetType: ParapetType,
		newLocationX: number,
		newLocationY: number,
	) {
		super(newLocationX, newLocationY);
		this.parapetType = newParapetType;
	}

	getParapetType(): ParapetType {
		return this.parapetType;
	}

	setParapetType(newParapetType: ParapetType): void {
		this.parapetType = newParapetType;
	}

	/** @returns "P1" through "P28" */
	parapetTypeToString(): string {
		return `P${this.parapetType.slice(7)}`;
	}

	/** @returns "Parapet,<type>,x,y" */
	toString(): string {
		return `Parapet,${this.parapetTypeToString()},${this.locationToString()}`;
	}

	/** @returns "<type>,x,y" */
	toSaveString(): string {
		return `${this.parapetTypeToString()},${this.locationToString()}`;
	}
}
