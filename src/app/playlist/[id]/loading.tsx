export default function Loading() {
  return (
    <div>
      {/* 歌单头部骨架 */}
      <div className="bg-surface/50 relative h-72 overflow-hidden">
        <div className="animate-skeleton absolute inset-0 opacity-30" />
        <div className="from-background via-background/70 absolute inset-0 bg-gradient-to-t to-transparent" />
        <div className="absolute right-0 bottom-0 left-0 px-12 pb-8">
          <div className="mb-3 flex items-center gap-2">
            <div className="animate-skeleton h-3.5 w-16 rounded" />
          </div>
          <div className="animate-skeleton mb-2 h-9 w-72 rounded-lg" />
          <div className="animate-skeleton mb-3 h-4 w-96 rounded" />
          <div className="flex items-center gap-4">
            <div className="animate-skeleton h-3 w-16 rounded" />
            <div className="animate-skeleton h-3 w-20 rounded" />
            <div className="animate-skeleton h-3 w-16 rounded" />
          </div>
        </div>
      </div>

      {/* 内容区域骨架 */}
      <div className="px-12 py-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="animate-skeleton h-10 w-28 rounded-lg" />
        </div>

        {/* 表头骨架 */}
        <div className="border-border/20 mb-2 flex items-center border-b px-4 py-2">
          <div className="animate-skeleton h-3 w-8 rounded" />
          <div className="ml-3 w-10" />
          <div className="animate-skeleton ml-3 h-3 w-16 flex-1 rounded" />
          <div className="animate-skeleton h-3 w-48 rounded" />
          <div className="animate-skeleton h-3 w-16 rounded" />
        </div>

        {/* 歌曲行骨架 */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex items-center rounded-lg px-4 py-2.5">
            <div className="animate-skeleton h-3.5 w-8 rounded" />
            <div className="animate-skeleton ml-3 h-9 w-9 rounded" />
            <div className="ml-3 flex-1">
              <div className="animate-skeleton mb-1.5 h-3.5 w-36 rounded" />
              <div className="animate-skeleton h-3 w-28 rounded" />
            </div>
            <div className="animate-skeleton h-3 w-40 rounded" />
            <div className="animate-skeleton h-3 w-12 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
