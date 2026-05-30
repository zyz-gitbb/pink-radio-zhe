export default function Loading() {
  return (
    <div className="px-12 py-10">
      {/* 标题栏骨架 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="w-32 h-7 rounded-lg animate-skeleton mb-1.5" />
          <div className="w-28 h-3.5 rounded animate-skeleton" />
        </div>
        <div className="w-24 h-8 rounded-lg animate-skeleton" />
      </div>

      {/* 推荐卡片网格骨架 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="rounded-xl overflow-hidden bg-surface/50 border border-border/20">
            <div className="aspect-square animate-skeleton" />
            <div className="p-4">
              <div className="w-3/4 h-4 rounded animate-skeleton mb-2" />
              <div className="w-20 h-3 rounded animate-skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
