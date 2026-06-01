"use client";
import { useEffect, useRef, useState } from "react";
import { Pin, Plus, Trash2, ImagePlus, X } from "lucide-react";
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
        items.map((a) => (
          <Card key={a.id} className="overflow-hidden">
            {a.imageUrl && (
              <div className="bg-gray-100 dark:bg-gray-800 max-h-[400px] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.imageUrl} alt={a.title} className="w-full object-cover" />
              </div>
            )}
            <div className="p-5">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-1">
                  {a.pinned && <Pin className="w-4 h-4 text-padel-green fill-padel-green" />}
                  {a.title}
                </h3>
                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => togglePin(a)}
                      className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        a.pinned ? "text-padel-green" : "text-gray-400"
                      }`}
                      title={a.pinned ? t.community.unpin : t.community.pin}
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(a.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                      title={t.community.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-3">
                {a.authorName ? `${a.authorName} · ` : ""}
                {new Date(a.createdAt).toLocaleString()}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{a.body}</p>
            </div>
          </Card>
        ))
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
