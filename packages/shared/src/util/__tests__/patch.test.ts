import { describe, expect, it } from "vitest";
import { applyPatch } from "../patch";

interface Sample {
	ref: string;
	note?: string;
	count?: number;
}

describe("applyPatch", () => {
	it("overwrites the keys the patch sets", () => {
		const base: Sample = { ref: "1A01", count: 2 };
		expect(applyPatch(base, { count: 3 })).toEqual({ ref: "1A01", count: 3 });
	});

	it("removes a key the patch sets to undefined", () => {
		const result = applyPatch<Sample>(
			{ ref: "1A01", note: "x" },
			{ note: undefined },
		);
		expect(result).toEqual({ ref: "1A01" });
		expect("note" in result).toBe(false);
	});

	it("leaves the base object unchanged", () => {
		const base: Sample = { ref: "1A01", note: "x" };
		applyPatch(base, { note: undefined, ref: "2B02" });
		expect(base).toEqual({ ref: "1A01", note: "x" });
	});
});
