"use client";

import { useRef, useState } from "react";
import { omitProps } from "@/lib/omit-props";
import {
	CapCard,
	type CapCardProps,
} from "../../../caps/components/CapCard/CapCard";

type ClientCapCardProps = CapCardProps & {
	videoId: string;
	isLoadingAnalytics: boolean;
	analytics: number;
};

interface CapDragData {
	id: CapCardProps["cap"]["id"];
	name: string;
	type?: string;
}

// Interface for drop targets that will be registered for mobile drag and drop
interface DropTarget {
	element: HTMLElement;
	onDrop: (data: CapDragData) => void;
	onDragOver?: () => void;
	onDragLeave?: () => void;
}

// Global registry for drop targets
let dropTargets: DropTarget[] = [];

// Register a drop target element
export function registerDropTarget(
	element: HTMLElement,
	onDrop: (data: CapDragData) => void,
	onDragOver?: () => void,
	onDragLeave?: () => void,
) {
	dropTargets.push({ element, onDrop, onDragOver, onDragLeave });
	return () => {
		dropTargets = dropTargets.filter((target) => target.element !== element);
	};
}

export function ClientCapCard(props: ClientCapCardProps) {
	const { videoId, analytics, ...rest } = omitProps(props, [
		"isLoadingAnalytics",
	]);
	const [isDragging, setIsDragging] = useState(false);
	const cardRef = useRef<HTMLElement>(null);

	// Create a drag preview element with thumbnail
	const createDragPreview = (text: string): HTMLElement => {
		// Create the container element
		const container = document.createElement("div");
		container.className =
			"flex gap-2 items-center px-3 py-2 rounded-lg border shadow-md bg-gray-1 border-gray-4";
		container.style.position = "absolute";
		container.style.top = "-9999px";
		container.style.left = "-9999px";

		// Add the text
		const textElement = document.createElement("span");
		textElement.textContent = text;
		textElement.className = "text-sm font-medium text-gray-12";
		container.appendChild(textElement);

		return container;
	};

	// Handle drag start event for desktop
	const handleDragStart = (e: React.DragEvent<HTMLElement>) => {
		// Set the data transfer
		e.dataTransfer.setData(
			"application/cap",
			JSON.stringify({
				id: videoId,
				name: props.cap.name,
			}),
		);

		// Set drag effect to 'move'
		e.dataTransfer.effectAllowed = "move";

		// Set the drag image
		try {
			const dragPreview = createDragPreview(props.cap.name);
			document.body.appendChild(dragPreview);

			// Adjust offset based on whether we have a thumbnail
			e.dataTransfer.setDragImage(dragPreview, 10, 10);

			// Clean up after a short delay
			setTimeout(() => document.body.removeChild(dragPreview), 100);
		} catch (error) {
			console.error("Error setting drag image:", error);
		}

		setIsDragging(true);
	};

	const handleDragEnd = () => {
		setIsDragging(false);
	};

	return (
		<section
			aria-label="Draggable recording"
			ref={cardRef}
			draggable={true}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			className={isDragging ? "opacity-50" : ""}
		>
			<CapCard
				{...rest}
				isLoadingAnalytics={props.isLoadingAnalytics}
				analytics={analytics}
			/>
		</section>
	);
}
