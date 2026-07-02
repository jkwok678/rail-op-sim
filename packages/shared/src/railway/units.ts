// ============================================================================
// Unit conversion utilities
// ============================================================================

/** Round a number to 1 decimal place. */
export function round1(n: number): number {
	return Math.round(n * 10) / 10;
}

/** Convert km/h to mph. */
export function kmhToMph(kmh: number): number {
	return round1(kmh / 1.609344);
}

/** Convert metres to miles, chains, and yards (railway imperial units). */
export function metresToImperial(m: number): {
	miles: number;
	chains: number;
	yards: number;
} {
	const YARDS_PER_CHAIN = 22;
	const CHAINS_PER_MILE = 80;
	const METRES_PER_YARD = 0.9144;

	const totalYards = m / METRES_PER_YARD;
	const totalChains = totalYards / YARDS_PER_CHAIN;
	const miles = Math.floor(totalChains / CHAINS_PER_MILE);
	const chains = Math.floor(totalChains % CHAINS_PER_MILE);
	const yards = round1(
		(totalChains - miles * CHAINS_PER_MILE - chains) * YARDS_PER_CHAIN,
	);

	return { miles, chains, yards };
}

/** Format imperial length as a human-readable string. */
export function formatImperialLength(m: number): string {
	const { miles, chains, yards } = metresToImperial(m);
	const parts: string[] = [];
	if (miles > 0) parts.push(`${miles} mi`);
	if (chains > 0 || miles > 0) parts.push(`${chains} ch`);
	parts.push(`${yards} yd`);
	return parts.join(" ");
}
