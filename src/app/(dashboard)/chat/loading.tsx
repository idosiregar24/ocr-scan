import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-[4.5rem] rounded-2xl" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-12 w-2/3 self-end rounded-2xl" />
        <Skeleton className="h-28 w-3/4 rounded-2xl" />
        <Skeleton className="h-10 w-1/2 self-end rounded-2xl" />
      </div>
      <Skeleton className="h-24 rounded-2xl" />
    </div>
  );
}
