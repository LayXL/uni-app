export const LiquidBorder = () => {
	return (
		<div
			className="absolute inset-0 rounded-[inherit] mix-blend-overlay backface-hidden pointer-events-none will-change-transform p-px bg-[linear-gradient(8deg,#fff0,#ffffffe6_35%,#ffffffe6_65%,#fff0)]"
			style={{
				mask: "linear-gradient(#000,#000 0) content-box,linear-gradient(#000,#000 0)",
				maskComposite: "exclude",
			}}
		/>
	)
}
