/// <reference lib="webworker" />
/**
 * The Web Worker entry point: one engine, spoken to over `postMessage`.
 */

import { postMessageTransport } from "#/transport/postmessage-transport";
import type { EngineToHost, HostToEngine } from "#/transport/types";
import { startEngineHost } from "./engine-host";

const scope = self as unknown as DedicatedWorkerGlobalScope;

startEngineHost(
	postMessageTransport<HostToEngine, EngineToHost>(scope, () => scope.close()),
	{
		now: () => performance.now(),
		schedule: (fn, ms) => setTimeout(fn, ms),
		cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
	},
);
