import { describe, expect, it } from "vitest";
import { defined, firstOf, itemAt, lastOf } from "../checked";

describe("checked access", () => {
	it("returns the element when the index is in range", () => {
		expect(itemAt(["a", "b"], 1)).toBe("b");
		expect(firstOf([3, 4])).toBe(3);
		expect(lastOf([3, 4])).toBe(4);
	});

	it("throws a RangeError naming the lookup when out of range", () => {
		expect(() => itemAt([1], 5, "node")).toThrow(
			new RangeError("node 5 out of range (length 1)"),
		);
		expect(() => firstOf([], "segment")).toThrow(RangeError);
		expect(() => lastOf([], "segment")).toThrow(RangeError);
	});

	it("keeps falsy values that are present", () => {
		expect(itemAt([0], 0)).toBe(0);
		expect(defined("", "text")).toBe("");
	});

	it("throws when a value is missing", () => {
		expect(() => defined(undefined, "location")).toThrow("missing location");
	});
});
