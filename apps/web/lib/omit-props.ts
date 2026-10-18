export const omitProps = <T extends object, K extends keyof T>(
	props: T,
	keys: readonly K[],
): Omit<T, K> => {
	const result = { ...props };
	for (const key of keys) Reflect.deleteProperty(result, key);
	return result;
};
