import { describe, expect, it } from "vitest";
import { moveActionTo, nextIssueTarget, stepService } from "#/lib/timetableNav";

const services = ["1A01", "1A02", "1A03"];

describe("stepService", () => {
	it("wraps in either direction", () => {
		expect(stepService(services, "1A03", 1)).toBe("1A01");
		expect(stepService(services, "1A01", -1)).toBe("1A03");
	});

	it("steps to the neighbour", () => {
		expect(stepService(services, "1A02", 1)).toBe("1A03");
		expect(stepService(services, "1A02", -1)).toBe("1A01");
	});

	it("lands on the only service when nothing is selected", () => {
		expect(stepService(["1A01"], null, 1)).toBe("1A01");
		expect(stepService(["1A01"], null, -1)).toBe("1A01");
	});

	it("stays put when that only service is already selected", () => {
		expect(stepService(["1A01"], "1A01", 1)).toBeNull();
	});

	it("treats a missing selection as none", () => {
		expect(stepService(services, "9Z99", 1)).toBe("1A01");
		expect(stepService(services, "9Z99", -1)).toBe("1A03");
	});

	it("does nothing with an empty timetable", () => {
		expect(stepService([], null, 1)).toBeNull();
	});
});

describe("nextIssueTarget", () => {
	const issues = [
		{ serviceRef: "1A01", actionIndex: 0 },
		{ serviceRef: "1A01", actionIndex: 0 },
		{ serviceRef: "1A01", actionIndex: 2 },
		{ serviceRef: "1A02" },
	];

	it("starts at the first problem when nothing is selected", () => {
		expect(nextIssueTarget(issues, null, null)).toEqual({
			serviceRef: "1A01",
			actionIndex: 0,
		});
	});

	it("skips a repeated problem on the same row and takes the next one down", () => {
		expect(nextIssueTarget(issues, "1A01", 0)).toEqual({
			serviceRef: "1A01",
			actionIndex: 2,
		});
	});

	it("wraps to the first problem in the selected service", () => {
		expect(nextIssueTarget(issues, "1A01", 2)).toEqual({
			serviceRef: "1A01",
			actionIndex: 0,
		});
	});

	it("stays inside the selected service", () => {
		expect(nextIssueTarget(issues, "1A01", 1)).toEqual({
			serviceRef: "1A01",
			actionIndex: 2,
		});
	});

	it("opens a service-level problem ahead of another service's", () => {
		expect(nextIssueTarget(issues, null, null)).toEqual({
			serviceRef: "1A01",
			actionIndex: 0,
		});
		expect(
			nextIssueTarget(
				[{ serviceRef: "1A02" }, { serviceRef: "1A01" }],
				null,
				null,
			),
		).toEqual({ serviceRef: "1A02", actionIndex: null });
	});

	it("does nothing when the only problem is the row already open", () => {
		expect(
			nextIssueTarget([{ serviceRef: "1A01", actionIndex: 1 }], "1A01", 1),
		).toBeNull();
	});

	it("does nothing when the selected service has no problems", () => {
		expect(nextIssueTarget(issues, "1A03", null)).toBeNull();
	});
});

describe("moveActionTo", () => {
	it("steps within the list", () => {
		expect(moveActionTo(3, 1, -1)).toBe(0);
		expect(moveActionTo(3, 1, 1)).toBe(2);
	});

	it("refuses either end, and a missing selection", () => {
		expect(moveActionTo(3, 0, -1)).toBeNull();
		expect(moveActionTo(3, 2, 1)).toBeNull();
		expect(moveActionTo(3, null, 1)).toBeNull();
	});
});
