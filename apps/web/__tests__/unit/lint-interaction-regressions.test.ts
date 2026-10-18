// @vitest-environment jsdom
import {
	act,
	type ComponentProps,
	createElement,
	createRef,
	type RefCallback,
	useRef,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { composeRefs, useComposedRefs } from "@/app/lib/compose-refs";
import { TrimmingTool } from "@/components/tools/TrimmingTool";
import { withOccurrenceKeys } from "@/lib/occurrence-keys";
import { omitProps } from "@/lib/omit-props";

vi.mock("@cap/ui", async () => {
	const { createElement } = await import("react");
	return {
		Button: ({
			variant: _variant,
			...props
		}: ComponentProps<"button"> & { variant?: string }) =>
			createElement("button", { type: "button", ...props }),
	};
});
vi.mock("@/app/utils/analytics", () => ({ trackEvent: vi.fn() }));

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
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe("composed refs", () => {
	it("forwards mount and React 19 cleanup to callback and object refs", () => {
		const objectRef = createRef<HTMLDivElement>();
		const cleanup = vi.fn();
		const callback = vi.fn(() => cleanup);
		const ref = composeRefs(objectRef, callback);
		const node = document.createElement("div");
		const dispose = ref(node);
		expect(objectRef.current).toBe(node);
		expect(callback).toHaveBeenCalledWith(node);
		expect(typeof dispose).toBe("function");
		if (typeof dispose !== "function") throw new Error("Missing ref cleanup");
		dispose();
		expect(objectRef.current).toBeNull();
		expect(cleanup).toHaveBeenCalledOnce();
	});

	it("retains the callback across rerenders and replaces it when a ref changes", async () => {
		const refs: RefCallback<HTMLDivElement>[] = [];
		const first = vi.fn();
		const second = vi.fn();
		function Probe({ callback }: { callback: RefCallback<HTMLDivElement> }) {
			const object = useRef<HTMLDivElement>(null);
			const ref = useComposedRefs(object, callback);
			refs.push(ref);
			return createElement("div", { ref });
		}
		await act(() => root.render(createElement(Probe, { callback: first })));
		await act(() => root.render(createElement(Probe, { callback: first })));
		expect(refs[1]).toBe(refs[0]);
		await act(() => root.render(createElement(Probe, { callback: second })));
		expect(refs[2]).not.toBe(refs[1]);
		expect(first).toHaveBeenLastCalledWith(null);
		expect(second).toHaveBeenCalledWith(container.firstChild);
	});
});

describe("props and keyed content", () => {
	it("omits intentionally ignored props without mutating or changing other props", () => {
		const click = vi.fn();
		const input = {
			asChild: true,
			children: "ignored",
			className: "control",
			onClick: click,
		};
		expect(omitProps(input, ["asChild", "children"])).toEqual({
			className: "control",
			onClick: click,
		});
		expect(input.asChild).toBe(true);
		expect(input.children).toBe("ignored");
	});

	it("keeps content keys when distinct records move and disambiguates duplicates", () => {
		const before = withOccurrenceKeys(
			["same", "other", "same"],
			(value) => value,
		);
		const after = withOccurrenceKeys(
			["other", "same", "same"],
			(value) => value,
		);
		expect(new Set(before.map(({ key }) => key)).size).toBe(3);
		expect(after[0]?.key).toBe(before[1]?.key);
		expect(after[1]?.key).toBe(before[0]?.key);
		expect(after[2]?.key).toBe(before[2]?.key);
	});
});

describe("trimmer URL lifetime", () => {
	it("keeps a selected preview alive through metadata/time updates, then revokes it on replacement or unmount", async () => {
		vi.useFakeTimers();
		const createUrl = vi
			.fn()
			.mockReturnValueOnce("blob:first")
			.mockReturnValueOnce("blob:second");
		const revokeUrl = vi.fn();
		vi.stubGlobal(
			"URL",
			class extends URL {
				static createObjectURL = createUrl;
				static revokeObjectURL = revokeUrl;
			},
		);
		await act(() => root.render(createElement(TrimmingTool)));
		const select = async (name: string) => {
			const input = container.querySelector('input[type="file"]');
			if (!input) throw new Error("Missing upload control");
			Object.defineProperty(input, "files", {
				configurable: true,
				value: [new File(["video"], name, { type: "video/mp4" })],
			});
			await act(() =>
				input.dispatchEvent(new Event("change", { bubbles: true })),
			);
			await act(() => vi.advanceTimersByTime(10));
		};
		await select("first.mp4");
		const video = container.querySelector("video");
		if (!video) throw new Error("Missing preview");
		Object.defineProperty(video, "duration", { value: 60 });
		await act(() => video.dispatchEvent(new Event("loadedmetadata")));
		video.currentTime = 12;
		await act(() => video.dispatchEvent(new Event("timeupdate")));
		expect(video.getAttribute("src")).toBe("blob:first");
		expect(revokeUrl).not.toHaveBeenCalled();
		expect(container.textContent).toContain("Current: 0:12");
		const labels = [...container.querySelectorAll("label")];
		expect(labels).toHaveLength(2);
		for (const label of labels) expect(label.control?.tagName).toBe("INPUT");
		const choose = [...container.querySelectorAll("button")].find(
			(button) => button.textContent === "Choose Different Video",
		);
		if (!choose) throw new Error("Missing reset control");
		await act(() => choose.click());
		expect(revokeUrl).toHaveBeenCalledExactlyOnceWith("blob:first");
		await select("second.mp4");
		expect(video.getAttribute("src")).toBe("blob:second");
		await act(() => root.unmount());
		expect(revokeUrl).toHaveBeenCalledTimes(2);
		expect(revokeUrl).toHaveBeenLastCalledWith("blob:second");
	});
});
