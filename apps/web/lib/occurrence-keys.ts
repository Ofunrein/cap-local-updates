export const withOccurrenceKeys = <T>(
	items: readonly T[],
	identity: (item: T) => string,
): { key: string; value: T }[] => {
	const occurrences = new Map<string, number>();
	return items.map((value) => {
		const id = identity(value);
		const occurrence = occurrences.get(id) ?? 0;
		occurrences.set(id, occurrence + 1);
		return { key: JSON.stringify([id, occurrence]), value };
	});
};
