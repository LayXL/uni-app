export function removeBreakingElements(input: string): string {
	return input
		.replaceAll(
			'id="withReplacements_subgroupNum_0""',
			'id="withReplacements_subgroupNum_0"',
		)
		.replaceAll('style="display: none;""', 'style="display: none;"')
		.replaceAll('class="table-danger";>', 'class="table-danger">')
}
