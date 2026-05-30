export default function Loading() {
  return (
    <div className="px-12 py-10">
      {/* 标题骨架 */}
      <div className="mb-8">
        <div className="w-28 h-7 rounded-lg animate-skeleton mb-1.5" />
        <div className="w-40 h-3.5 rounded animate-skeleton" />
      </div>

      {/* 表单骨架 */}
      <div className="max-w-2xl">
        <div className="bg-surface/50 border border-border/20 rounded-xl p-6">
          <div className="w-20 h-5 rounded animate-skeleton mb-6" />

          {/* 输入框骨架 */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-5">
              <div className="w-16 h-3.5 rounded animate-skeleton mb-2" />
              <div className="w-full h-10 rounded-lg animate-skeleton" />
            </div>
          ))}

          {/* 下拉框骨架 */}
          <div className="mb-5">
            <div className="w-12 h-3.5 rounded animate-skeleton mb-2" />
            <div className="w-full h-10 rounded-lg animate-skeleton" />
          </div>

          {/* 按钮骨架 */}
          <div className="w-28 h-10 rounded-lg animate-skeleton mt-2" />
        </div>
      </div>
    </div>
  );
}
