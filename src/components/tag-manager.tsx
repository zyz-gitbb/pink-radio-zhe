"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Check, Tags } from "lucide-react";
import {
  addCategory,
  renameCategory,
  deleteCategory,
  getChannelCountByCategory,
} from "@/app/actions";
import { showToast } from "@/components/Toast";

interface TagManagerProps {
  open: boolean;
  onClose: () => void;
  categories: string[];
  onMutate?: () => void;
}

const OVERLAY_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const PANEL_VARIANTS = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 340, damping: 28, mass: 0.9 },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 10,
    transition: { duration: 0.18, ease: "easeIn" as const },
  },
};

export function TagManager({ open, onClose, categories, onMutate }: TagManagerProps) {
  const [tags, setTags] = useState<string[]>(categories);
  const [newTagName, setNewTagName] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // 当外部 categories 变化时同步
  useEffect(() => {
    setTags(categories);
  }, [categories]);

  useEffect(() => {
    if (open) {
      setNewTagName("");
      setEditingIndex(null);
      setEditingValue("");
    }
  }, [open]);

  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingIndex]);

  const handleAdd = async () => {
    const name = newTagName.trim();
    if (!name) return;
    if (tags.includes(name)) {
      showToast("这个标签已经存在啦~");
      return;
    }
    setSaving(true);
    try {
      const updated = await addCategory(name);
      setTags(updated);
      setNewTagName("");
      inputRef.current?.focus();
      onMutate?.();
    } catch {
      showToast("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleStartRename = (index: number) => {
    setEditingIndex(index);
    setEditingValue(tags[index]);
  };

  const handleConfirmRename = async () => {
    if (editingIndex === null) return;
    const oldName = tags[editingIndex];
    const newName = editingValue.trim();
    if (!newName) {
      setEditingIndex(null);
      return;
    }
    if (newName === oldName) {
      setEditingIndex(null);
      return;
    }
    if (tags.includes(newName)) {
      showToast("这个标签名已经存在啦~");
      return;
    }
    setSaving(true);
    try {
      const updated = await renameCategory(oldName, newName);
      setTags(updated);
      setEditingIndex(null);
      onMutate?.();
    } catch {
      showToast("重命名失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (index: number) => {
    const tagName = tags[index];
    const count = await getChannelCountByCategory(tagName);
    if (count > 0) {
      showToast("小宝请先清空频道再删除主题噢");
      return;
    }
    setSaving(true);
    try {
      const updated = await deleteCategory(tagName);
      setTags(updated);
      onMutate?.();
    } catch {
      showToast("删除失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: "add" | "rename") => {
    if (e.key === "Enter") {
      e.preventDefault();
      action === "add" ? handleAdd() : handleConfirmRename();
    }
    if (e.key === "Escape") {
      if (action === "rename") setEditingIndex(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          variants={OVERLAY_VARIANTS}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* 遮罩 */}
          <motion.div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* 弹窗面板 */}
          <motion.div
            className="relative z-10 w-full max-w-md mx-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_24px_80px_rgba(61,46,46,0.12),0_0_0_1px_rgba(223,218,209,0.5)] overflow-hidden"
            variants={PANEL_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* 顶部 */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Tags size={14} className="text-accent" />
                </div>
                <span className="text-[15px] font-semibold text-stone-800">
                  管理标签
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-all"
              >
                <X size={15} />
              </button>
            </div>

            {/* 新增输入区 */}
            <div className="px-6 pb-4">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, "add")}
                  placeholder="输入新标签名称…"
                  maxLength={12}
                  className="flex-1 px-3.5 py-2 bg-stone-100/80 border border-stone-200/60 rounded-lg text-stone-800 placeholder-stone-400/60 focus:outline-none focus:border-accent/40 focus:bg-white transition-all text-[13px]"
                />
                <button
                  onClick={handleAdd}
                  disabled={!newTagName.trim() || saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white text-[12px] font-medium rounded-lg hover:bg-accent-dim transition-all shadow-sm shadow-accent/15 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={13} />
                  新增
                </button>
              </div>
            </div>

            {/* 分隔线 */}
            <div className="mx-6 h-px bg-stone-200/60" />

            {/* 标签列表 */}
            <div className="px-6 py-3 max-h-72 overflow-y-auto">
              {tags.length === 0 ? (
                <p className="text-center text-stone-400 text-[13px] py-6">
                  暂无标签
                </p>
              ) : (
                <div className="space-y-0.5">
                  {tags.map((tag, index) => (
                    <div
                      key={tag}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-stone-100/60 transition-colors group"
                    >
                      {editingIndex === index ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, "rename")}
                            onBlur={handleConfirmRename}
                            maxLength={12}
                            className="flex-1 px-2.5 py-1 bg-white border border-accent/30 rounded-md text-stone-800 focus:outline-none text-[13px]"
                          />
                          <button
                            onClick={handleConfirmRename}
                            className="w-6 h-6 rounded-md flex items-center justify-center text-accent hover:bg-accent/10 transition-colors"
                          >
                            <Check size={13} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="text-[13px] text-stone-700">
                            {tag}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleStartRename(index)}
                              className="w-6 h-6 rounded-md flex items-center justify-center text-stone-400 hover:text-accent hover:bg-accent/10 transition-all"
                              title="重命名"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(index)}
                              disabled={saving}
                              className="w-6 h-6 rounded-md flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-40"
                              title="删除"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 底部提示 */}
            <div className="px-6 py-3 bg-stone-50/60 border-t border-stone-200/40">
              <p className="text-[11px] text-stone-400 text-center">
                标签已同步至数据库，刷新后依然保留
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
