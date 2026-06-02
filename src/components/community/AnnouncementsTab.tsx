"use client";
import { useEffect, useRef, useState } from "react";
import { Pin, Plus, Trash2, ImagePlus, X, MessageSquare } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useLocale } from "@/contexts/LocaleContext";
import type { CommunityAnnouncement } from "@/lib/types";

export default function AnnouncementsTab({ isAdmin }: { isAdmin: boolean }) {
  const { t } = useLocale();
  const [items, setItems] = useState<CommunityAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [selected, setSelected] = useState<CommunityAnnouncement | null>(null);

  const load = () => {
    return fetch("/api/community/announcements")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setItems(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm(t.community.deleteAnnouncementConfirm)) return;
    const res = await fetch(`/api/community/announcements/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Failed");
      return;
    }
    load();
  };

  const togglePin = async (a: CommunityAnnouncement) => {
    const res = await fetch(`/api/community/announcements/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !a.pinned }),
    });
    if (!res.ok) {
      alert("Failed");
      return;
    }
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t.community.tabs.announcements}
        </h2>
        {isAdmin && (
          <Button onClick={() => setComposerOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            {t.community.newAnnouncement}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="w-8 h-8 border-2 border-padel-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-400">{t.community.noAnnouncements}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              className="group relative aspect-square rounded-xl overflow-hidden text-left bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-padel-green transition-all"
            >
              {a.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.imageUrl} alt={a.title} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-padel-green via-emerald-500 to-teal-600 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-white/60" />
                </div>
              )}
              {/* Gradient + title */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              {a.pinned && (
                <span className="absolute top-2 left-2 bg-padel-green text-white rounded-full p-1 shadow">
                  <Pin className="w-3 h-3 fill-white" />
                </span>
              )}
              <div className="absolute bottom-0 inset-x-0 p-3">
                <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">{a.title}</h3>
                <p className="text-[10px] text-white/70 mt-0.5">
                  {new Date(a.createdAt).toLocaleDateString()}
                </p>
              </div>
              {isAdmin && (
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin(a);
                    }}
                    className={`p-1.5 rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur ${
                      a.pinned ? "text-padel-green" : "text-white"
                    }`}
                    title={a.pinned ? t.community.unpin : t.community.pin}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(a.id);
                    }}
                    className="p-1.5 rounded-lg bg-black/40 hover:bg-red-500/80 backdrop-blur text-white"
                    title={t.community.delete}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <Modal isOpen onClose={() => setSelected(null)} title={selected.title} size="lg">
          <div className="space-y-3">
            {selected.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.imageUrl} alt={selected.title} className="w-full rounded-lg object-cover max-h-[400px]" />
            )}
            <p className="text-xs text-gray-400">
              {selected.authorName ? `${selected.authorName} · ` : ""}
              {new Date(selected.createdAt).toLocaleString()}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selected.body}</p>
          </div>
        </Modal>
      )}

      {composerOpen && (
        <ComposerModal
          onClose={() => setComposerOpen(false)}
          onCreated={() => {
            setComposerOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function ComposerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { t } = useLocale();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    setImageFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setImagePreview(null);
    }
  };

  const submit = async () => {
    setError(null);
    if (!title.trim()) {
      setError(t.community.titleRequired);
      return;
    }
    if (!body.trim()) {
      setError(t.community.bodyRequired);
      return;
    }
    setSaving(true);

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("body", body.trim());
    fd.append("pinned", pinned ? "true" : "false");
    if (imageFile) fd.append("image", imageFile);

    const res = await fetch("/api/community/announcements", {
      method: "POST",
      body: fd,
    });
    setSaving(false);
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      setError(e.error ?? "Failed");
      return;
    }
    onCreated();
  };

  return (
    <Modal isOpen onClose={onClose} title={t.community.newAnnouncement} size="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {t.community.title} *
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.community.titlePlaceholder}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {t.community.body} *
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            placeholder={t.community.bodyPlaceholder}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {t.community.imageOptional}
          </label>
          {imagePreview ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="preview" className="max-h-48 rounded-lg" />
              <button
                onClick={() => handleFile(null)}
                className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ImagePlus className="w-4 h-4" />
              {t.community.pickImage}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="w-4 h-4 accent-padel-green"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <Pin className="w-3.5 h-3.5" /> {t.community.pin}
          </span>
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {t.community.cancel}
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? t.community.saving : t.community.publish}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
