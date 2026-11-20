import {
	type ErrorComponentProps,
	Link,
	useRouter,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";

/** Full-viewport centring shared by the three router fallbacks. */
function Screen({ children }: { children: ReactNode }) {
	return (
		<main className="flex min-h-dvh w-full flex-col items-center justify-center gap-3 bg-background p-6 text-center text-sm">
			{children}
		</main>
	);
}

/**
 * What the router shows when a route throws while rendering or loading. Rendered
 * inside the root `shellComponent`, so the stylesheet is already loaded.
 *
 * Reload is the dependable way out; "Try again" re-runs the route's loaders
 * first, which clears the error for a failure that was transient.
 */
export function RouteError({ error, reset }: ErrorComponentProps) {
	const router = useRouter();
	const message = error instanceof Error ? error.message : String(error);
	return (
		<Screen>
			<h1 className="text-base font-medium">Something went wrong</h1>
			<p className="max-w-md break-words text-xs text-muted-foreground">
				{message}
			</p>
			<div className="flex gap-2">
				<Button
					variant="outline"
					onClick={() => {
						reset();
						void router.invalidate();
					}}
				>
					Try again
				</Button>
				<Button onClick={() => window.location.reload()}>Reload</Button>
			</div>
		</Screen>
	);
}

/** What the router shows for a path nothing matches. */
export function RouteNotFound() {
	return (
		<Screen>
			<h1 className="text-base font-medium">Page not found</h1>
			<p className="text-xs text-muted-foreground">
				There is nothing at this address.
			</p>
			<Link to="/" className="text-primary underline underline-offset-4">
				Back to the simulator
			</Link>
		</Screen>
	);
}

/** What the router shows while a route is still loading. */
export function RoutePending() {
	return (
		<Screen>
			<Spinner label="Loading" className="size-6" />
		</Screen>
	);
}
