export default function Loading() {
  return (
    <div className="px-12 py-10">
      {/* 标题栏骨架 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="animate-skeleton mb-1.5 h-7 w-32 rounded-lg" />
          <div className="animate-skeleton h-3.5 w-28 rounded" />
        </div>
        <div className="animate-skeleton h-8 w-24 rounded-lg" />
      </div>

      {/* 推荐卡片网格骨架 */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-surface/50 border-border/20 overflow-hidden rounded-xl border">
            <div className="animate-skeleton aspect-square" />
            <div className="p-4">
              <div className="animate-skeleton mb-2 h-4 w-3/4 rounded" />
              <div className="animate-skeleton h-3 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
