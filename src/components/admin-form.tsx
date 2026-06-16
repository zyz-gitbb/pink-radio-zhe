"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveChannel, deleteChannel } from "@/app/actions";
import { generateId } from "@/lib/utils";
import { SearchSongs } from "@/components/search-songs";
import { Music2, Plus, Pencil, Trash2, ImagePlus, X } from "lucide-react";
import { showToast } from "@/components/Toast";
import type { Channel, Song } from "@/types";

interface AdminFormProps {
  channels: Channel[];
  categories: string[];
}

export function AdminForm({ channels, categories }: AdminFormProps) {
  const router = useRouter();
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    coverUrl: "",
    category: "其他",
    tags: "",
    songIds: [] as number[],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFormData((prev) => ({
          ...prev,
          coverUrl: reader.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const channelData: Omit<Channel, "songIds"> = {
        id: editingChannel?.id || generateId(),
        name: formData.name,
        description: formData.description,
        coverUrl: formData.coverUrl,
        category: formData.category,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        createdAt: editingChannel?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      await saveChannel(channelData);
      resetForm();
      router.refresh();
    } catch {
      showToast("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (channel: Channel) => {
    setEditingChannel(channel);
    setFormData({
      name: channel.name,
      description: channel.description,
      coverUrl: channel.coverUrl,
      category: channel.category,
      tags: channel.tags.join(", "),
      songIds: [...channel.songIds],
    });
    setShowSearch(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("确定要删除这个频道吗？")) {
      await deleteChannel(id);
      if (editingChannel?.id === id) resetForm();
      router.refresh();
    }
  };

  const resetForm = () => {
    setEditingChannel(null);
    setFormData({
      name: "",
      description: "",
      coverUrl: "",
      category: "其他",
      tags: "",
      songIds: [],
    });
    setShowSearch(false);
  };

  const handleAddSong = (song: Song) => {
    if (formData.songIds.includes(song.id)) return;
    setFormData((prev) => ({
      ...prev,
      songIds: [...prev.songIds, song.id],
    }));
  };

  const handleRemoveSong = (songId: number) => {
    setFormData((prev) => ({
      ...prev,
      songIds: prev.songIds.filter((id) => id !== songId),
    }));
  };

  return (
    <div className="space-y-8">
      {/* 表单 */}
      <div className="bg-surface/70 border-border/40 rounded-xl border p-6 backdrop-blur-md">
        <h2 className="mb-5 text-base font-medium text-stone-800">
          {editingChannel ? "编辑频道" : "创建频道"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-stone-500">
              频道名称 *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="bg-elevated border-border/50 focus:border-accent/40 w-full rounded-lg border px-4 py-2.5 text-[13px] text-stone-800 placeholder-stone-400/50 transition-colors focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-stone-500">频道描述</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="bg-elevated border-border/50 focus:border-accent/40 w-full resize-none rounded-lg border px-4 py-2.5 text-[13px] text-stone-800 placeholder-stone-400/50 transition-colors focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-stone-500">封面图</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="coverUrl"
                value={formData.coverUrl}
                onChange={handleInputChange}
                placeholder="粘贴网络图片链接，或点击右侧按钮上传本地图片"
                className="bg-elevated border-border/50 focus:border-accent/40 flex-1 rounded-lg border px-4 py-2.5 text-[13px] text-stone-800 placeholder-stone-400/50 transition-colors focus:outline-none"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-elevated border-border/50 hover:text-accent hover:border-accent/40 hover:bg-accent/5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border text-stone-400 transition-all"
                title="上传本地图片"
              >
                <ImagePlus size={16} />
              </button>
              {formData.coverUrl && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, coverUrl: "" }))}
                  className="bg-elevated border-border/50 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border text-stone-400 transition-all hover:border-red-300/40 hover:bg-red-50 hover:text-red-400"
                  title="清除封面"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {formData.coverUrl && (
              <div className="mt-3 flex items-start gap-3">
                <img
                  src={formData.coverUrl}
                  alt="封面预览"
                  className="h-24 w-24 rounded-xl border border-stone-200/50 object-cover shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="pt-1">
                  <p className="text-[11px] text-stone-400">封面预览</p>
                  <p className="mt-0.5 text-[10px] text-stone-400/60">
                    {formData.coverUrl.startsWith("data:") ? "本地图片 (Base64)" : "网络链接"}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-stone-500">分类 *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="bg-elevated border-border/50 focus:border-accent/40 w-full rounded-lg border px-4 py-2.5 text-[13px] text-stone-800 transition-colors focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-stone-500">
              标签（逗号分隔）
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="例如: 轻音乐, 助眠, 放松"
              className="bg-elevated border-border/50 focus:border-accent/40 w-full rounded-lg border px-4 py-2.5 text-[13px] text-stone-800 placeholder-stone-400/50 transition-colors focus:outline-none"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-[11px] font-medium text-stone-500">
                歌曲列表 ({formData.songIds.length} 首)
              </label>
              <button
                type="button"
                onClick={() => setShowSearch(!showSearch)}
                className={`flex items-center gap-1 rounded-md px-3 py-1 text-[11px] font-medium transition-all ${
                  showSearch
                    ? "bg-accent/15 text-accent"
                    : "bg-accent/10 text-accent hover:bg-accent/15"
                }`}
              >
                <Plus size={11} />
                {showSearch ? "收起搜索" : "搜索添加歌曲"}
              </button>
            </div>

            {formData.songIds.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {formData.songIds.map((songId) => (
                  <span
                    key={songId}
                    className="inline-flex items-center rounded-md bg-stone-200/50 px-2.5 py-1 font-mono text-[11px] text-stone-600"
                  >
                    ID: {songId}
                    <button
                      type="button"
                      onClick={() => handleRemoveSong(songId)}
                      className="ml-1.5 text-stone-400 transition-colors hover:text-stone-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {showSearch && (
              <div className="mt-4">
                <SearchSongs onAddSong={handleAddSong} addedSongIds={formData.songIds} />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-accent hover:bg-accent-dim shadow-accent/20 rounded-lg px-6 py-2.5 text-[13px] font-semibold text-white shadow-md transition-all disabled:opacity-50"
            >
              {saving ? "保存中..." : editingChannel ? "保存修改" : "创建频道"}
            </button>
            {editingChannel && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg bg-stone-200/50 px-5 py-2.5 text-[13px] text-stone-600 transition-all hover:bg-stone-200 hover:text-stone-800"
              >
                取消
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 频道列表 */}
      <div className="bg-surface/70 border-border/40 rounded-xl border p-6 backdrop-blur-md">
        <h2 className="mb-5 text-base font-medium text-stone-800">频道列表</h2>

        {channels.length > 0 ? (
          <div className="space-y-1">
            {channels.map((channel) => (
              <div
                key={channel.id}
                className="hover:bg-accent/5 flex items-center justify-between rounded-lg p-3 transition-colors"
              >
                <div className="flex items-center">
                  {channel.coverUrl ? (
                    <img
                      src={channel.coverUrl}
                      alt={channel.name}
                      className="ring-border/20 h-10 w-10 rounded-lg ring-1"
                    />
                  ) : (
                    <div className="bg-elevated border-border/30 flex h-10 w-10 items-center justify-center rounded-lg border">
                      <Music2 size={16} className="text-stone-300" />
                    </div>
                  )}
                  <div className="ml-3">
                    <h3 className="text-[13px] font-medium text-stone-800">{channel.name}</h3>
                    <p className="text-[11px] text-stone-500">
                      {channel.category} · {channel.songIds.length} 首歌
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(channel)}
                    className="hover:bg-accent/10 hover:text-accent flex items-center gap-1 rounded-md bg-stone-200/50 px-3 py-1 text-[11px] font-medium text-stone-600 transition-all"
                  >
                    <Pencil size={11} />
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(channel.id)}
                    className="flex items-center gap-1 rounded-md bg-stone-200/50 px-3 py-1 text-[11px] font-medium text-stone-600 transition-all hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 size={11} />
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-stone-400/60">暂无频道</p>
        )}
      </div>
    </div>
  );
}
