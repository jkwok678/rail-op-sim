import { createFileRoute } from "@tanstack/react-router";
import { SimLayout } from "#/components/sim/SimLayout";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return <SimLayout />;
}
