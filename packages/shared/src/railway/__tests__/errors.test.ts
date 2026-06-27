import { describe, expect, it } from "vitest";
import {
	ElementAlreadyExistsError,
	ElementNotFoundError,
	LinkedTrackError,
	RailwayError,
	TrackNotConnectedError,
	ZeroTrackError,
} from "../errors";

describe("RailwayError", () => {
	it("extends Error", () => {
		const err = new RailwayError("test");
		expect(err).toBeInstanceOf(Error);
	});

	it('has name "RailwayError"', () => {
		const err = new RailwayError("test");
		expect(err.name).toBe("RailwayError");
	});

	it("stores the message", () => {
		const err = new RailwayError("something went wrong");
		expect(err.message).toBe("something went wrong");
	});
});

describe("ElementAlreadyExistsError", () => {
	it("extends RailwayError", () => {
		const err = new ElementAlreadyExistsError(5, 10);
		expect(err).toBeInstanceOf(RailwayError);
	});

	it('has name "ElementAlreadyExistsError"', () => {
		const err = new ElementAlreadyExistsError(5, 10);
		expect(err.name).toBe("ElementAlreadyExistsError");
	});

	it("contains coordinates in message", () => {
		const err = new ElementAlreadyExistsError(5, 10);
		expect(err.message).toContain("(5, 10)");
		expect(err.message).toBe("An element already exists at (5, 10).");
	});

	it("exposes x and y as public readonly properties", () => {
		const err = new ElementAlreadyExistsError(3, 7);
		expect(err.x).toBe(3);
		expect(err.y).toBe(7);
	});
});

describe("ElementNotFoundError", () => {
	it("extends RailwayError", () => {
		const err = new ElementNotFoundError(2, 8);
		expect(err).toBeInstanceOf(RailwayError);
	});

	it('has name "ElementNotFoundError"', () => {
		const err = new ElementNotFoundError(2, 8);
		expect(err.name).toBe("ElementNotFoundError");
	});

	it("contains coordinates in message", () => {
		const err = new ElementNotFoundError(2, 8);
		expect(err.message).toBe("No element found at (2, 8).");
	});

	it("exposes x and y as public readonly properties", () => {
		const err = new ElementNotFoundError(10, 20);
		expect(err.x).toBe(10);
		expect(err.y).toBe(20);
	});
});

describe("TrackNotConnectedError", () => {
	it("extends RailwayError", () => {
		const err = new TrackNotConnectedError();
		expect(err).toBeInstanceOf(RailwayError);
	});

	it('has name "TrackNotConnectedError"', () => {
		const err = new TrackNotConnectedError();
		expect(err.name).toBe("TrackNotConnectedError");
	});

	it("has fixed message", () => {
		const err = new TrackNotConnectedError();
		expect(err.message).toBe("Not all tracks are connected.");
	});
});

describe("ZeroTrackError", () => {
	it("extends RailwayError", () => {
		const err = new ZeroTrackError();
		expect(err).toBeInstanceOf(RailwayError);
	});

	it('has name "ZeroTrackError"', () => {
		const err = new ZeroTrackError();
		expect(err.name).toBe("ZeroTrackError");
	});

	it("has fixed message", () => {
		const err = new ZeroTrackError();
		expect(err.message).toBe("There are zero tracks stored.");
	});
});

describe("LinkedTrackError", () => {
	it("extends RailwayError", () => {
		const err = new LinkedTrackError("odd number of linked tracks");
		expect(err).toBeInstanceOf(RailwayError);
	});

	it('has name "LinkedTrackError"', () => {
		const err = new LinkedTrackError("odd number of linked tracks");
		expect(err.name).toBe("LinkedTrackError");
	});

	it("stores custom message", () => {
		const err = new LinkedTrackError("custom validation error");
		expect(err.message).toBe("custom validation error");
	});
});

describe("instanceof checks", () => {
	it("all error types are instanceof Error", () => {
		expect(new RailwayError("")).toBeInstanceOf(Error);
		expect(new ElementAlreadyExistsError(0, 0)).toBeInstanceOf(Error);
		expect(new ElementNotFoundError(0, 0)).toBeInstanceOf(Error);
		expect(new TrackNotConnectedError()).toBeInstanceOf(Error);
		expect(new ZeroTrackError()).toBeInstanceOf(Error);
		expect(new LinkedTrackError("")).toBeInstanceOf(Error);
	});

	it("all domain error types extend RailwayError", () => {
		expect(new ElementAlreadyExistsError(0, 0)).toBeInstanceOf(RailwayError);
		expect(new ElementNotFoundError(0, 0)).toBeInstanceOf(RailwayError);
		expect(new TrackNotConnectedError()).toBeInstanceOf(RailwayError);
		expect(new ZeroTrackError()).toBeInstanceOf(RailwayError);
		expect(new LinkedTrackError("")).toBeInstanceOf(RailwayError);
	});
});
