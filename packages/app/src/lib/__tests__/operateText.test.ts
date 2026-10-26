import type { TrainView } from "@rail-op-sim/shared";
import { describe, expect, it } from "vitest";
import {
	needsAttention,
	runLabel,
	speedLabel,
	trainStatusLabel,
} from "#/lib/operateText";

const train = (over: Partial<TrainView>): TrainView => ({
	id: 1,
	headcode: "1A01",
	description: "",
	status: "running",
	wait: null,
	speedKmh: 0,
	segs: [],
	next: "",
	...over,
});

describe("operate panel words", () => {
	it("names the run state", () => {
		expect(runLabel("prestart")).toBe("Ready to start");
		expect(runLabel("running")).toBe("Running");
		expect(runLabel(undefined)).toBe("Loading");
	});

	it("writes speeds as multipliers", () => {
		expect([0.25, 0.5, 1, 16].map(speedLabel)).toEqual([
			"×¼",
			"×½",
			"×1",
			"×16",
		]);
	});

	it("says what a train is doing", () => {
		expect(trainStatusLabel(train({ speedKmh: 87.4 }))).toBe("87 km/h");
		expect(trainStatusLabel(train({ status: "waiting", wait: "signal" }))).toBe(
			"At signal",
		);
		expect(trainStatusLabel(train({ status: "dwelling" }))).toBe("At platform");
		expect(trainStatusLabel(train({ status: "spad" }))).toBe("SPAD");
	});

	it("flags trains that need the signaller", () => {
		expect(needsAttention(train({ status: "waiting", wait: "signal" }))).toBe(
			true,
		);
		expect(needsAttention(train({ status: "waiting", wait: "train" }))).toBe(
			false,
		);
		expect(needsAttention(train({ status: "crashed" }))).toBe(true);
		expect(needsAttention(train({}))).toBe(false);
	});
});
