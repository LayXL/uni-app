import { Icon } from "@/shared/ui/icon"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { Touchable } from "@/shared/ui/touchable"

import { formatFileSize, type HomeworkFile, isImageMimeType } from "../types"

type FileListProps = {
	files: HomeworkFile[]
}

export function FileList({ files }: FileListProps) {
	if (files.length === 0) return null

	return (
		<div className="flex flex-col gap-2">
			<span className="text-sm text-muted px-1">Файлы</span>
			{files.map((file) =>
				isImageMimeType(file.mimeType) ? (
					<Touchable key={file.key}>
						<a
							href={file.url}
							target="_blank"
							rel="noopener noreferrer"
							className="block relative rounded-3xl overflow-hidden"
						>
							<img
								src={file.url}
								alt={file.name}
								className="w-full max-h-64 object-cover"
							/>
						</a>
					</Touchable>
				) : (
					<Touchable key={file.key}>
						<a
							href={file.url}
							target="_blank"
							rel="noopener noreferrer"
							className="relative bg-card rounded-2xl p-3 flex items-center gap-3"
						>
							<LiquidBorder />
							<Icon
								name="iconify:material-symbols:attach-file"
								size={20}
								className="text-muted shrink-0"
							/>
							<div className="flex-1 min-w-0">
								<div className="text-sm truncate">{file.name}</div>
								<div className="text-xs text-muted">
									{formatFileSize(file.size)}
								</div>
							</div>
							<Icon
								name="iconify:material-symbols:download"
								size={20}
								className="text-muted shrink-0"
							/>
						</a>
					</Touchable>
				),
			)}
		</div>
	)
}
