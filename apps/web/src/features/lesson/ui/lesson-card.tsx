type LessonCardProps = {
  order?: number
  subject?: string
  classroom?: string
  teacherNames?: string[]
  groupNames?: string[]
}

export const LessonCard = (props: LessonCardProps) => {
  return (
    <div className="p-4 bg-neutral-2 flex flex-col gap-2 rounded-xl">
      <div className="text-sm text-neutral-11">
        <p children={`${props.order} пара`} />
      </div>
      <p className="font-medium" children={props.subject} />
      <p
        className="text-sm text-neutral-11"
        children={props.teacherNames?.join(", ")}
      />
      <p className="text-sm text-neutral-11" children={props.classroom} />
    </div>
  )
}
