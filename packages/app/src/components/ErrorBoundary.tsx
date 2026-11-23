import { Component, type ErrorInfo, type ReactNode } from "react";
import { debugLog } from "#/lib/debugLogger";

interface ErrorBoundaryProps {
	/** What this boundary guards, for the log and the fallback's message. */
	name: string;
	/** What to show instead of the children; `reset` retries them. */
	fallback: (args: { error: Error; reset: () => void }) => ReactNode;
	children: ReactNode;
}

interface ErrorBoundaryState {
	error: Error | null;
}

/**
 * Keeps a render error in one part of the screen from taking down the rest.
 *
 * React unmounts everything up to the nearest boundary when a component throws,
 * and with none the whole app goes blank. Each panel gets its own so that a bug
 * in one leaves the others usable. `reset` clears the error, which remounts the
 * children from scratch.
 *
 * A class because React has no hook for catching render errors.
 */
export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	override state: ErrorBoundaryState = { error: null };

	static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
		return { error: error instanceof Error ? error : new Error(String(error)) };
	}

	override componentDidCatch(error: Error, info: ErrorInfo): void {
		debugLog("ui", `${this.props.name} crashed: ${error.message}`);
		console.error(`${this.props.name} crashed`, error, info.componentStack);
	}

	reset = (): void => {
		this.setState({ error: null });
	};

	override render(): ReactNode {
		const { error } = this.state;
		if (error) return this.props.fallback({ error, reset: this.reset });
		return this.props.children;
	}
}
