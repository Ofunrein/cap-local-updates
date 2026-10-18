import type { ReactNode } from "react";

export const ToolRichText = ({ content }: { content: string }) => {
	const children: ReactNode[] = [];
	let cursor = 0;
	for (const match of content.matchAll(
		/<a href=(?:'([^']*)'|"([^"]*)")>([^<]*)<\/a>/g,
	)) {
		children.push(content.slice(cursor, match.index));
		children.push(
			<a
				key={match.index}
				href={match[1] ?? match[2]}
				className="font-semibold text-blue-500 transition-colors hover:text-blue-600"
			>
				{match[3]}
			</a>,
		);
		cursor = match.index + match[0].length;
	}
	children.push(content.slice(cursor));
	return <span>{children}</span>;
};
