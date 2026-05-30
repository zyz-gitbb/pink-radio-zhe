export default function Loading() {
  return (
    <div className="min-h-screen relative">
      {/* 沉浸式微光背景 */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,133,138,0.08),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(223,218,209,0.2),_transparent_60%)]" />
        <div className="absolute inset-0 bg-background" style={{ opacity: 0.9 }} />
      </div>

      {/* 频道头部骨架 */}
      <div className="px-12 pt-10 pb-8">
        <div className="flex items-end gap-8">
          {/* 封面骨架 */}
          <div className="flex-shrink-0">
            <div className="w-48 h-48 rounded-2xl animate-skeleton shadow-[0_20px_50px_rgba(0,0,0,0.06)]" />
          </div>

          {/* 信息骨架 */}
          <div className="flex-1 pb-2">
            <div className="w-12 h-3 rounded animate-skeleton mb-3" />
            <div className="w-64 h-9 rounded-lg animate-skeleton mb-2" />
            <div className="w-80 h-4 rounded animate-skeleton mb-4" />
            <div className="flex items-center gap-2">
              <div className="w-16 h-6 rounded-md animate-skeleton" />
              <div className="w-14 h-6 rounded-md animate-skeleton" />
              <div className="w-14 h-6 rounded-md animate-skeleton" />
              <div className="w-16 h-3.5 rounded animate-skeleton ml-1" />
            </div>
          </div>
        </div>
      </div>

      {/* 歌曲列表骨架 */}
      <div className="px-12 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="w-20 h-5 rounded animate-skeleton" />
          <div className="w-24 h-8 rounded-lg animate-skeleton" />
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
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex items-center px-4 py-2.5 rounded-lg">
            <div className="w-8 h-3.5 rounded animate-skeleton" />
            <div className="w-9 h-9 rounded ml-3 animate-skeleton" />
            <div className="flex-1 ml-3">
              <div className="w-32 h-3.5 rounded animate-skeleton mb-1.5" />
              <div className="w-24 h-3 rounded animate-skeleton" />
            </div>
            <div className="w-36 h-3 rounded animate-skeleton" />
            <div className="w-12 h-3 rounded animate-skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
