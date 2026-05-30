export default function Loading() {
  return (
    <div className="min-h-screen">
      {/* Hero 骨架 */}
      <section className="relative w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-elevated" />
        <div className="relative px-12 pt-14 pb-12">
          <div className="max-w-3xl">
            {/* 标签骨架 */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg animate-skeleton" />
              <div className="w-20 h-3 rounded animate-skeleton" />
            </div>
            {/* 标题骨架 */}
            <div className="w-80 h-10 rounded-lg animate-skeleton mb-3" />
            {/* 描述骨架 */}
            <div className="w-96 h-5 rounded animate-skeleton mb-2" />
            <div className="w-72 h-5 rounded animate-skeleton" />
            {/* 按钮骨架 */}
            <div className="flex items-center gap-3 mt-6">
              <div className="w-28 h-10 rounded-lg animate-skeleton" />
              <div className="w-32 h-10 rounded-lg animate-skeleton" />
            </div>
            {/* 统计骨架 */}
            <div className="flex items-center gap-8 mt-10 pt-6 border-t border-border/30">
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded animate-skeleton" />
                <div>
                  <div className="w-8 h-6 rounded animate-skeleton mb-1" />
                  <div className="w-10 h-3 rounded animate-skeleton" />
                </div>
              </div>
              <div className="w-px h-8 bg-border/30" />
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded animate-skeleton" />
                <div>
                  <div className="w-10 h-6 rounded animate-skeleton mb-1" />
                  <div className="w-10 h-3 rounded animate-skeleton" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 频道列表骨架 */}
      <section className="w-full px-12 py-10">
        {/* 标题栏骨架 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="w-24 h-6 rounded animate-skeleton mb-1.5" />
            <div className="w-32 h-3.5 rounded animate-skeleton" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-16 h-8 rounded-lg animate-skeleton" />
            ))}
          </div>
        </div>

        {/* 卡片网格骨架 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="rounded-xl overflow-hidden bg-surface/50 border border-border/20">
              <div className="aspect-square animate-skeleton" />
              <div className="p-4">
                <div className="w-3/4 h-4 rounded animate-skeleton mb-2" />
                <div className="w-full h-3.5 rounded animate-skeleton mb-3" />
                <div className="flex items-center gap-2">
                  <div className="w-14 h-5 rounded-md animate-skeleton" />
                  <div className="w-10 h-3.5 rounded animate-skeleton" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
