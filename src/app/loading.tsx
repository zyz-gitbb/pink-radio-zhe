export default function Loading() {
  return (
    <div className="min-h-screen">
      {/* Hero 骨架 */}
      <section className="relative w-full overflow-hidden">
        <div className="from-accent/5 via-background to-elevated absolute inset-0 bg-gradient-to-br" />
        <div className="relative px-12 pt-14 pb-12">
          <div className="max-w-3xl">
            {/* 标签骨架 */}
            <div className="mb-4 flex items-center gap-2">
              <div className="animate-skeleton h-7 w-7 rounded-lg" />
              <div className="animate-skeleton h-3 w-20 rounded" />
            </div>
            {/* 标题骨架 */}
            <div className="animate-skeleton mb-3 h-10 w-80 rounded-lg" />
            {/* 描述骨架 */}
            <div className="animate-skeleton mb-2 h-5 w-96 rounded" />
            <div className="animate-skeleton h-5 w-72 rounded" />
            {/* 按钮骨架 */}
            <div className="mt-6 flex items-center gap-3">
              <div className="animate-skeleton h-10 w-28 rounded-lg" />
              <div className="animate-skeleton h-10 w-32 rounded-lg" />
            </div>
            {/* 统计骨架 */}
            <div className="border-border/30 mt-10 flex items-center gap-8 border-t pt-6">
              <div className="flex items-center gap-2.5">
                <div className="animate-skeleton h-4 w-4 rounded" />
                <div>
                  <div className="animate-skeleton mb-1 h-6 w-8 rounded" />
                  <div className="animate-skeleton h-3 w-10 rounded" />
                </div>
              </div>
              <div className="bg-border/30 h-8 w-px" />
              <div className="flex items-center gap-2.5">
                <div className="animate-skeleton h-4 w-4 rounded" />
                <div>
                  <div className="animate-skeleton mb-1 h-6 w-10 rounded" />
                  <div className="animate-skeleton h-3 w-10 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 频道列表骨架 */}
      <section className="w-full px-12 py-10">
        {/* 标题栏骨架 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="animate-skeleton mb-1.5 h-6 w-24 rounded" />
            <div className="animate-skeleton h-3.5 w-32 rounded" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-skeleton h-8 w-16 rounded-lg" />
            ))}
          </div>
        </div>

        {/* 卡片网格骨架 */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-surface/50 border-border/20 overflow-hidden rounded-xl border"
            >
              <div className="animate-skeleton aspect-square" />
              <div className="p-4">
                <div className="animate-skeleton mb-2 h-4 w-3/4 rounded" />
                <div className="animate-skeleton mb-3 h-3.5 w-full rounded" />
                <div className="flex items-center gap-2">
                  <div className="animate-skeleton h-5 w-14 rounded-md" />
                  <div className="animate-skeleton h-3.5 w-10 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
