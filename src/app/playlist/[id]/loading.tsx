export default function Loading() {
  return (
    <div>
      {/* 歌单头部骨架 */}
      <div className="relative h-72 overflow-hidden bg-surface/50">
        <div className="absolute inset-0 animate-skeleton opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-12 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-16 h-3.5 rounded animate-skeleton" />
          </div>
          <div className="w-72 h-9 rounded-lg animate-skeleton mb-2" />
          <div className="w-96 h-4 rounded animate-skeleton mb-3" />
          <div className="flex items-center gap-4">
            <div className="w-16 h-3 rounded animate-skeleton" />
            <div className="w-20 h-3 rounded animate-skeleton" />
            <div className="w-16 h-3 rounded animate-skeleton" />
          </div>
        </div>
      </div>

      {/* 内容区域骨架 */}
      <div className="px-12 py-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-28 h-10 rounded-lg animate-skeleton" />
        </div>

        {/* 表头骨架 */}
        <div className="flex items-center px-4 py-2 border-b border-border/20 mb-2">
          <div className="w-8 h-3 rounded animate-skeleton" />
          <div className="w-10 ml-3" />
          <div className="flex-1 ml-3 w-16 h-3 rounded animate-skeleton" />
          <div className="w-48 h-3 rounded animate-skeleton" />
          <div className="w-16 h-3 rounded animate-skeleton" />
        </div>

        {/* 歌曲行骨架 */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex items-center px-4 py-2.5 rounded-lg">
            <div className="w-8 h-3.5 rounded animate-skeleton" />
            <div className="w-9 h-9 rounded ml-3 animate-skeleton" />
            <div className="flex-1 ml-3">
              <div className="w-36 h-3.5 rounded animate-skeleton mb-1.5" />
              <div className="w-28 h-3 rounded animate-skeleton" />
            </div>
            <div className="w-40 h-3 rounded animate-skeleton" />
            <div className="w-12 h-3 rounded animate-skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
