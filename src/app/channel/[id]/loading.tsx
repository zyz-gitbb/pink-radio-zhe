export default function Loading() {
  return (
    <div className="relative min-h-screen">
      {/* 沉浸式微光背景 */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,133,138,0.08),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(223,218,209,0.2),_transparent_60%)]" />
        <div className="bg-background absolute inset-0" style={{ opacity: 0.9 }} />
      </div>

      {/* 频道头部骨架 */}
      <div className="px-12 pt-10 pb-8">
        <div className="flex items-end gap-8">
          {/* 封面骨架 */}
          <div className="flex-shrink-0">
            <div className="animate-skeleton h-48 w-48 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.06)]" />
          </div>

          {/* 信息骨架 */}
          <div className="flex-1 pb-2">
            <div className="animate-skeleton mb-3 h-3 w-12 rounded" />
            <div className="animate-skeleton mb-2 h-9 w-64 rounded-lg" />
            <div className="animate-skeleton mb-4 h-4 w-80 rounded" />
            <div className="flex items-center gap-2">
              <div className="animate-skeleton h-6 w-16 rounded-md" />
              <div className="animate-skeleton h-6 w-14 rounded-md" />
              <div className="animate-skeleton h-6 w-14 rounded-md" />
              <div className="animate-skeleton ml-1 h-3.5 w-16 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* 歌曲列表骨架 */}
      <div className="px-12 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="animate-skeleton h-5 w-20 rounded" />
          <div className="animate-skeleton h-8 w-24 rounded-lg" />
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
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex items-center rounded-lg px-4 py-2.5">
            <div className="animate-skeleton h-3.5 w-8 rounded" />
            <div className="animate-skeleton ml-3 h-9 w-9 rounded" />
            <div className="ml-3 flex-1">
              <div className="animate-skeleton mb-1.5 h-3.5 w-32 rounded" />
              <div className="animate-skeleton h-3 w-24 rounded" />
            </div>
            <div className="animate-skeleton h-3 w-36 rounded" />
            <div className="animate-skeleton h-3 w-12 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
