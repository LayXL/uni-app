export const transformToGroupName = ({
  displayName,
}: { displayName: string }) => displayName.replace(/\s\(.+\)/, "")
