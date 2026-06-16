export default function Loading() {
  return (
    <div className="px-12 py-10">
      {/* 标题骨架 */}
      <div className="mb-8">
        <div className="animate-skeleton mb-1.5 h-7 w-28 rounded-lg" />
        <div className="animate-skeleton h-3.5 w-40 rounded" />
      </div>

      {/* 表单骨架 */}
      <div className="max-w-2xl">
        <div className="bg-surface/50 border-border/20 rounded-xl border p-6">
          <div className="animate-skeleton mb-6 h-5 w-20 rounded" />

          {/* 输入框骨架 */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-5">
              <div className="animate-skeleton mb-2 h-3.5 w-16 rounded" />
              <div className="animate-skeleton h-10 w-full rounded-lg" />
            </div>
          ))}

          {/* 下拉框骨架 */}
          <div className="mb-5">
            <div className="animate-skeleton mb-2 h-3.5 w-12 rounded" />
            <div className="animate-skeleton h-10 w-full rounded-lg" />
          </div>

          {/* 按钮骨架 */}
          <div className="animate-skeleton mt-2 h-10 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
