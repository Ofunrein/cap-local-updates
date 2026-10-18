import { useId } from "react";

("use client");

const LeftLight = () => {
	const elementId = useId();

	return (
		<svg
			aria-hidden="true"
			focusable="false"
			className="absolute top-[250px] left-24 pointer-events-none z-[10]"
			width="739"
			style={{
				mixBlendMode: "plus-lighter",
			}}
			height="295"
			viewBox="0 0 739 295"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<g filter={`url(#${elementId}-filter0_f_459_2098)`}>
				<ellipse
					cx="293"
					cy="147"
					rx="700"
					ry="70"
					transform="rotate(180 293 147)"
					fill={`url(#${elementId}-paint0_linear_459_2098)`}
				/>
			</g>
			<defs>
				<filter
					id={`${elementId}-filter0_f_459_2098`}
					x="-152"
					y="0"
					width="891"
					height="295"
					filterUnits="userSpaceOnUse"
					colorInterpolationFilters="sRGB"
				>
					<feFlood floodOpacity="0" result="BackgroundImageFix" />
					<feBlend
						mode="normal"
						in="SourceGraphic"
						in2="BackgroundImageFix"
						result="shape"
					/>
					<feGaussianBlur
						stdDeviation="35"
						result="effect1_foregroundBlur_459_2098"
					/>
				</filter>
				<linearGradient
					id={`${elementId}-paint0_linear_459_2098`}
					x1="615.5"
					y1="168"
					x2="15.8448"
					y2="195.824"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="white" />
					<stop offset="1" stopColor="white" stopOpacity="0" />
				</linearGradient>
			</defs>
		</svg>
	);
};

export default LeftLight;
