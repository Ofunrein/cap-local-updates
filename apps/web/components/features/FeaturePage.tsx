"use client";

import { type JSX, useId } from "react";
import { JsonLdScript } from "@/components/json-ld-script";
import { SeoPageTemplate } from "@/components/seo/SeoPageTemplate";
import {
	createFeaturePageStructuredData,
	transformFeaturePageToSeo,
} from "@/lib/features/transform";
import type { FeaturePageConfig } from "@/lib/features/types";

interface FeaturePageProps {
	config: FeaturePageConfig;
	customIcons?: Record<string, JSX.Element>;
	showVideo?: boolean;
	showLogosInHeader?: boolean;
	showLoomComparisonSlider?: boolean;
	skipHero?: boolean;
}

export const FeaturePage = ({
	config,
	customIcons,
	showVideo = true,
	showLogosInHeader = false,
	showLoomComparisonSlider = false,
	skipHero = false,
}: FeaturePageProps) => {
	const seoContent = transformFeaturePageToSeo(config, customIcons);
	const structuredData = createFeaturePageStructuredData(config);
	const scriptId = useId();

	const finalShowVideo = config.customSections?.showVideo ?? showVideo;

	return (
		<>
			<JsonLdScript
				id={`faq-structured-data-${scriptId}`}
				json={JSON.stringify(structuredData)}
			/>
			<SeoPageTemplate
				content={seoContent}
				showVideo={finalShowVideo}
				showLogosInHeader={showLogosInHeader}
				showLoomComparisonSlider={showLoomComparisonSlider}
				skipHero={skipHero}
			/>
		</>
	);
};
