export const escapeJsonForScript = (json: string) =>
	json.replace(/</g, "\\u003c");
