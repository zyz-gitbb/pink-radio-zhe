"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();
  
  return (
    <button
      onClick={() => router.back()}
      className="group flex items-center gap-2 text-sm text-stone-400 transition-colors hover:text-stone-700"
    >
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
      <span>返回</span>
    </button>
  );
}
