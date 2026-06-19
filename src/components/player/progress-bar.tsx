"use client";

interface ProgressBarProps {
  progressRef: React.RefObject<HTMLDivElement | null>;
  progressPercentage: number;
  isDragging: boolean;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const ProgressBar = function ProgressBar({
  progressRef,
  progressPercentage,
  isDragging,
  onClick,
  onMouseDown,
}: ProgressBarProps) {
  return (
    <div
      ref={progressRef}
      className={`group absolute top-0 right-0 left-0 h-[3px] cursor-pointer ${
        isDragging ? "h-[5px] bg-accent/15" : "bg-accent/[0.08]"
      } transition-all`}
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      <div
        className="bg-accent h-full rounded-r-full transition-none"
        style={{ width: `${progressPercentage}%` }}
      />
      <div
        className={`bg-accent absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full shadow-[0_0_8px_rgba(212,133,138,0.4)] transition-opacity ${
          isDragging ? "opacity-100 scale-125" : "opacity-0 group-hover:opacity-100"
        }`}
        style={{ left: `calc(${progressPercentage}% - 6px)` }}
      />
    </div>
  );
};
