import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-4 sm:p-6 lg:flex-row lg:items-start lg:justify-center">
      <Skeleton className="aspect-square w-full max-w-[min(90vw,560px)]" />
      <Skeleton className="h-64 w-full lg:max-w-xs" />
      <span className="sr-only">Loading game</span>
    </main>
  );
}
