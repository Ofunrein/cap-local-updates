// @vitest-environment jsdom
import { act, createElement, createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Button } from "../../../../packages/ui/src/components/Button";

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await act(() => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

describe("polymorphic Button refs", () => {
	it("preserves the native button ref, disabled prop and content", async () => {
		const ref = createRef<HTMLButtonElement>();
		const click = vi.fn();
		await act(() =>
			root.render(
				createElement(Button, { ref, disabled: true, onClick: click }, "Save"),
			),
		);
		expect(ref.current?.tagName).toBe("BUTTON");
		expect(ref.current?.disabled).toBe(true);
		expect(ref.current?.textContent).toBe("Save");
		await act(() => ref.current?.click());
		expect(click).not.toHaveBeenCalled();
		await act(() => root.unmount());
		expect(ref.current).toBeNull();
	});
	it("exposes an anchor ref for href and retains target and click behavior", async () => {
		const ref = createRef<HTMLAnchorElement>();
		const click = vi.fn((event: { preventDefault: () => void }) =>
			event.preventDefault(),
		);
		await act(() =>
			root.render(
				createElement(
					Button,
					{ ref, href: "/docs", target: "_blank", onClick: click },
					"Read docs",
				),
			),
		);
		expect(ref.current?.tagName).toBe("A");
		expect(ref.current?.getAttribute("href")).toBe("/docs");
		expect(ref.current?.target).toBe("_blank");
		await act(() => ref.current?.click());
		expect(click).toHaveBeenCalledOnce();
	});
	it("keeps Slot's child element and composed event handlers", async () => {
		const ref = createRef<HTMLAnchorElement>();
		const childClick = vi.fn((event: { preventDefault: () => void }) =>
			event.preventDefault(),
		);
		const buttonClick = vi.fn();
		await act(() =>
			root.render(
				createElement(
					Button,
					{
						ref,
						asChild: true,
						onClick: buttonClick,
						icon: createElement("span", { "data-icon": "" }, "+"),
						kbd: "R",
					},
					createElement(
						"a",
						{ href: "/record", onClick: childClick },
						"Record",
					),
				),
			),
		);
		expect(container.children).toHaveLength(1);
		expect(ref.current?.tagName).toBe("A");
		expect(ref.current?.getAttribute("href")).toBe("/record");
		expect(ref.current?.querySelector("[data-icon]")?.textContent).toBe("+");
		expect(ref.current?.querySelector("kbd")?.textContent).toBe("R");
		expect(ref.current?.textContent).toBe("+RecordR");
		await act(() => ref.current?.click());
		expect(childClick).toHaveBeenCalledOnce();
		expect(buttonClick).toHaveBeenCalledOnce();
	});
	it("forwards React 19 callback cleanup when the element unmounts", async () => {
		const cleanup = vi.fn();
		const ref = vi.fn(() => cleanup);
		await act(() =>
			root.render(createElement(Button, { ref, href: "/docs" }, "Docs")),
		);
		expect(ref).toHaveBeenCalledExactlyOnceWith(container.firstChild);
		await act(() => root.unmount());
		expect(cleanup).toHaveBeenCalledOnce();
		expect(ref).toHaveBeenCalledOnce();
	});
});
