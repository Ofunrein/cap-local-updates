import { JSDOM } from "jsdom";
import { type ComponentProps, createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { JsonLdScript } from "@/components/json-ld-script";
import { LogoSection } from "@/components/pages/_components/LogoSection";
import HeaderBg from "@/components/pages/HomePage/HeaderBg";
import LeftBlueHue from "@/components/pages/HomePage/LeftBlueHue";
import LeftLight from "@/components/pages/HomePage/LeftLight";
import * as toolContent from "@/components/tools/content";
import { ToolRichText } from "@/components/tools/tool-rich-text";
import { LogoMarquee } from "@/components/ui/LogoMarquee";
import { escapeJsonForScript } from "@/lib/json-ld";

vi.mock("next/script", async () => {
	const { createElement } = await import("react");
	return {
		default: ({
			strategy: _strategy,
			...props
		}: ComponentProps<"script"> & { strategy?: string }) =>
			createElement("script", props),
	};
});

const fragment = (node: ReactNode) =>
	JSDOM.fragment(renderToStaticMarkup(node));

describe("structured data rendering", () => {
	it("preserves JSON values while preventing script termination", () => {
		const data = {
			"@type": "FAQPage",
			text: '</script><img src=x onerror="alert(1)"> & <tag>  ',
			count: 2,
		};
		const dom = fragment(
			createElement(
				"script",
				{ type: "application/ld+json" },
				escapeJsonForScript(JSON.stringify(data)),
			),
		);
		expect(dom.querySelectorAll("script")).toHaveLength(1);
		expect(dom.querySelector("img")).toBeNull();
		expect(JSON.parse(dom.querySelector("script")?.textContent ?? "")).toEqual(
			data,
		);
	});

	it("gives repeated Next script components unique IDs and intact payloads", () => {
		const dom = fragment(
			createElement(
				"div",
				null,
				createElement(JsonLdScript, {
					json: '{"name":"one"}',
					idPrefix: "faq",
				}),
				createElement(JsonLdScript, {
					json: '{"name":"two"}',
					idPrefix: "faq",
				}),
			),
		);
		const scripts = [...dom.querySelectorAll("script")];
		expect(new Set(scripts.map((script) => script.id)).size).toBe(2);
		expect(
			scripts.map((script) => JSON.parse(script.textContent ?? "")),
		).toEqual([{ name: "one" }, { name: "two" }]);
	});
});

describe("background SVG instance IDs", () => {
	it("keeps every gradient/filter reference within its own SVG", () => {
		const backgrounds = [HeaderBg, LeftBlueHue, LeftLight];
		const dom = fragment(
			createElement(
				"div",
				null,
				...backgrounds.flatMap((Background) => [
					createElement(Background, { key: `${Background.name}-one` }),
					createElement(Background, { key: `${Background.name}-two` }),
				]),
			),
		);
		const ids = [...dom.querySelectorAll("[id]")].map((node) => node.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const svg of dom.querySelectorAll("svg")) {
			for (const node of svg.querySelectorAll("*")) {
				for (const attribute of node.attributes) {
					const reference = /^url\(#(.+)\)$/.exec(attribute.value)?.[1];
					if (reference) {
						expect(
							[...svg.querySelectorAll("[id]")].some((n) => n.id === reference),
						).toBe(true);
					}
				}
			}
		}
	});
});

describe("tool copy rendering", () => {
	it("preserves text, links and link styling for all current tool copy", () => {
		const strings: string[] = [];
		const collect = (value: unknown) => {
			if (typeof value === "string") strings.push(value);
			else if (value && typeof value === "object") {
				for (const child of Object.values(value)) collect(child);
			}
		};
		collect(toolContent);
		expect(strings.length).toBeGreaterThan(100);
		for (const content of strings) {
			const before = JSDOM.fragment(
				`<span>${content.replace(/<a\s/g, '<a class="font-semibold text-blue-500 transition-colors hover:text-blue-600" ')}</span>`,
			);
			const after = fragment(createElement(ToolRichText, { content }));
			expect(after.textContent).toBe(before.textContent);
			const links = (dom: DocumentFragment) =>
				[...dom.querySelectorAll("a")].map((link) => ({
					href: link.getAttribute("href"),
					className: link.className,
					text: link.textContent,
				}));
			expect(links(after)).toEqual(links(before));
		}
	});

	it("renders unsupported markup as text rather than executable HTML", () => {
		const content = '<img src=x onerror="alert(1)">';
		const dom = fragment(createElement(ToolRichText, { content }));
		expect(dom.querySelector("img")).toBeNull();
		expect(dom.textContent).toBe(content);
	});
});

describe("SVG logo loading", () => {
	it("retains direct local SVG URLs and their explicit dimensions", () => {
		const dom = fragment(
			createElement(
				"div",
				null,
				createElement(LogoSection),
				createElement(LogoMarquee),
			),
		);
		const logos = [...dom.querySelectorAll("img")];
		expect(logos).toHaveLength(21);
		for (const logo of logos) {
			expect(logo.getAttribute("src")).toMatch(/^\/logos\/.+\.svg$/);
			expect(logo.getAttribute("srcset")).toBeNull();
			expect(Number(logo.width)).toBeGreaterThan(0);
			expect(Number(logo.height)).toBeGreaterThan(0);
			expect(logo.alt).not.toBe("");
			expect(logo.getAttribute("loading")).toBe("lazy");
		}
	});
});
