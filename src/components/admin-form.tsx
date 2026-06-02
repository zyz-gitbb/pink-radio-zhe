"use client";

import { useState, useEffect, useRef } from "react";
import { saveChannel, deleteChannel, getChannels, getCategories, onCategoriesChanged } from "@/lib/storage";
import { generateId } from "@/lib/utils";
import { SearchSongs } from "@/components/search-songs";
import { Music2, Plus, Pencil, Trash2, ImagePlus, X } from "lucide-react";
import type { Channel, Song } from "@/types";

interface AdminFormProps {
  onChannelSaved?: () => void;
}

export function AdminForm({ onChannelSaved }: AdminFormProps) {
  const [channels, setChannels] = useState<Channel[]>(getChannels());
  const [categories, setCategories] = useState<string[]>(getCategories());
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [showSearch, setShowSearch] = useState(false);
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
        setFormData((prev) => ({ ...prev, coverUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
    // 重置 input 以允许重复上传同一文件
    e.target.value = "";
  };

  useEffect(() => {
    const unsubscribe = onCategoriesChanged(() => {
      setCategories(getCategories());
    });
    return unsubscribe;
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const channel: Channel = {
      id: editingChannel?.id || generateId(),
      name: formData.name,
      description: formData.description,
      coverUrl: formData.coverUrl,
      category: formData.category,
      tags: formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      songIds: formData.songIds,
      createdAt: editingChannel?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    saveChannel(channel);
    setChannels(getChannels());
    resetForm();
    onChannelSaved?.();
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

  const handleDelete = (id: string) => {
    if (confirm("确定要删除这个频道吗？")) {
      deleteChannel(id);
      setChannels(getChannels());
      if (editingChannel?.id === id) resetForm();
    }
  };

  const resetForm = () => {
    setEditingChannel(null);
    setFormData({ name: "", description: "", coverUrl: "", category: "其他", tags: "", songIds: [] });
    setShowSearch(false);
  };

  const handleAddSong = (song: Song) => {
    if (formData.songIds.includes(song.id)) return;
    setFormData((prev) => ({ ...prev, songIds: [...prev.songIds, song.id] }));
  };

  const handleRemoveSong = (songId: number) => {
    setFormData((prev) => ({ ...prev, songIds: prev.songIds.filter((id) => id !== songId) }));
  };

  return (
    <div className="space-y-8">
      {/* 表单 */}
      <div className="bg-surface/70 backdrop-blur-md border border-border/40 rounded-xl p-6">
        <h2 className="text-base font-medium text-stone-800 mb-5">
          {editingChannel ? "编辑频道" : "创建频道"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] text-stone-500 mb-1.5 font-medium">频道名称 *</label>
            <input
              type="text" name="name" value={formData.name} onChange={handleInputChange} required
              className="w-full px-4 py-2.5 bg-elevated border border-border/50 rounded-lg text-stone-800 placeholder-stone-400/50 focus:outline-none focus:border-accent/40 transition-colors text-[13px]"
            />
          </div>

          <div>
            <label className="block text-[11px] text-stone-500 mb-1.5 font-medium">频道描述</label>
            <textarea
              name="description" value={formData.description} onChange={handleInputChange} rows={3}
              className="w-full px-4 py-2.5 bg-elevated border border-border/50 rounded-lg text-stone-800 placeholder-stone-400/50 focus:outline-none focus:border-accent/40 transition-colors resize-none text-[13px]"
            />
          </div>

          <div>
            <label className="block text-[11px] text-stone-500 mb-1.5 font-medium">封面图</label>
            <div className="flex gap-2">
              <input
                type="text" name="coverUrl" value={formData.coverUrl} onChange={handleInputChange}
                placeholder="粘贴网络图片链接，或点击右侧按钮上传本地图片"
                className="flex-1 px-4 py-2.5 bg-elevated border border-border/50 rounded-lg text-stone-800 placeholder-stone-400/50 focus:outline-none focus:border-accent/40 transition-colors text-[13px]"
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
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-elevated border border-border/50 text-stone-400 hover:text-accent hover:border-accent/40 hover:bg-accent/5 transition-all"
                title="上传本地图片"
              >
                <ImagePlus size={16} />
              </button>
              {formData.coverUrl && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, coverUrl: "" }))}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-elevated border border-border/50 text-stone-400 hover:text-red-400 hover:border-red-300/40 hover:bg-red-50 transition-all"
                  title="清除封面"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {/* 实时预览 */}
            {formData.coverUrl && (
              <div className="mt-3 flex items-start gap-3">
                <img
                  src={formData.coverUrl}
                  alt="封面预览"
                  className="w-24 h-24 object-cover rounded-xl shadow-sm border border-stone-200/50"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="pt-1">
                  <p className="text-[11px] text-stone-400">封面预览</p>
                  <p className="text-[10px] text-stone-400/60 mt-0.5">
                    {formData.coverUrl.startsWith("data:") ? "本地图片 (Base64)" : "网络链接"}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] text-stone-500 mb-1.5 font-medium">分类 *</label>
            <select
              name="category" value={formData.category} onChange={handleInputChange} required
              className="w-full px-4 py-2.5 bg-elevated border border-border/50 rounded-lg text-stone-800 focus:outline-none focus:border-accent/40 transition-colors text-[13px]"
            >
              {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-stone-500 mb-1.5 font-medium">标签（逗号分隔）</label>
            <input
              type="text" name="tags" value={formData.tags} onChange={handleInputChange}
              placeholder="例如: 轻音乐, 助眠, 放松"
              className="w-full px-4 py-2.5 bg-elevated border border-border/50 rounded-lg text-stone-800 placeholder-stone-400/50 focus:outline-none focus:border-accent/40 transition-colors text-[13px]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] text-stone-500 font-medium">歌曲列表 ({formData.songIds.length} 首)</label>
              <button
                type="button" onClick={() => setShowSearch(!showSearch)}
                className={`flex items-center gap-1 text-[11px] px-3 py-1 rounded-md transition-all font-medium ${
                  showSearch ? "bg-accent/15 text-accent" : "bg-accent/10 text-accent hover:bg-accent/15"
                }`}
              >
                <Plus size={11} />
                {showSearch ? "收起搜索" : "搜索添加歌曲"}
              </button>
            </div>

            {formData.songIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {formData.songIds.map((songId) => (
                  <span key={songId} className="inline-flex items-center px-2.5 py-1 bg-stone-200/50 rounded-md text-[11px] text-stone-600 font-mono">
                    ID: {songId}
                    <button type="button" onClick={() => handleRemoveSong(songId)} className="ml-1.5 text-stone-400 hover:text-stone-800 transition-colors">×</button>
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
              className="px-6 py-2.5 bg-accent text-white text-[13px] font-semibold rounded-lg hover:bg-accent-dim transition-all shadow-md shadow-accent/20"
            >
              {editingChannel ? "保存修改" : "创建频道"}
            </button>
            {editingChannel && (
              <button
                type="button" onClick={resetForm}
                className="px-5 py-2.5 bg-stone-200/50 text-stone-600 rounded-lg hover:bg-stone-200 hover:text-stone-800 transition-all text-[13px]"
              >
                取消
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 频道列表 */}
      <div className="bg-surface/70 backdrop-blur-md border border-border/40 rounded-xl p-6">
        <h2 className="text-base font-medium text-stone-800 mb-5">频道列表</h2>

        {channels.length > 0 ? (
          <div className="space-y-1">
            {channels.map((channel) => (
              <div
                key={channel.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center">
                  {channel.coverUrl ? (
                    <img src={channel.coverUrl} alt={channel.name} className="w-10 h-10 rounded-lg ring-1 ring-border/20" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-elevated border border-border/30 flex items-center justify-center">
                      <Music2 size={16} className="text-stone-300" />
                    </div>
                  )}
                  <div className="ml-3">
                    <h3 className="text-[13px] font-medium text-stone-800">{channel.name}</h3>
                    <p className="text-[11px] text-stone-500">{channel.category} · {channel.songIds.length} 首歌</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(channel)}
                    className="flex items-center gap-1 px-3 py-1 text-[11px] bg-stone-200/50 text-stone-600 rounded-md hover:bg-accent/10 hover:text-accent transition-all font-medium"
                  >
                    <Pencil size={11} />
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(channel.id)}
                    className="flex items-center gap-1 px-3 py-1 text-[11px] bg-stone-200/50 text-stone-600 rounded-md hover:bg-red-500/10 hover:text-red-500 transition-all font-medium"
                  >
                    <Trash2 size={11} />
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-stone-400/60 text-[13px]">暂无频道</p>
        )}
      </div>
    </div>
  );
}
