"use client";

import Script, { type ScriptProps } from "next/script";
import { useId } from "react";
import { escapeJsonForScript } from "@/lib/json-ld";

export const JsonLdScript = ({
	json,
	id,
	idPrefix = "structured-data",
	strategy,
}: {
	json: string;
	id?: string;
	idPrefix?: string;
	strategy?: ScriptProps["strategy"];
}) => {
	const generatedId = useId();
	return (
		<Script
			id={id ?? `${idPrefix}-${generatedId}`}
			type="application/ld+json"
			strategy={strategy}
		>
			{escapeJsonForScript(json)}
		</Script>
	);
};
