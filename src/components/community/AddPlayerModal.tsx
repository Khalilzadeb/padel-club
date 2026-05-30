"use client";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useLocale } from "@/contexts/LocaleContext";

interface AddPlayerModalProps {
  onClose: () => void;
  onAdded: () => void;
}

export default function AddPlayerModal({ onClose, onAdded }: AddPlayerModalProps) {
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [ntrp, setNtrp] = useState("");
  const [linkedPlayerId, setLinkedPlayerId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!name.trim()) {
      setError(t.community.nameRequired);
      return;
    }
    setSaving(true);
    const res = await fetch("/api/community/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        contactPhone: phone.trim() || null,
        contactEmail: email.trim() || null,
        ntrp: ntrp.trim() ? parseFloat(ntrp.trim()) : null,
        linkedPlayerId: linkedPlayerId.trim() || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to add player");
      return;
    }
    onAdded();
  };

  return (
    <Modal isOpen onClose={onClose} title={t.community.addPlayer}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {t.community.nameLabel} *
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.community.namePlaceholder}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {t.community.phoneLabel}
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+994 XX XXX XX XX"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {t.community.emailLabel}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="player@example.com"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            NTRP
          </label>
          <input
            type="number"
            step="0.5"
            min="1.0"
            max="7.0"
            value={ntrp}
            onChange={(e) => setNtrp(e.target.value)}
            placeholder="3.0"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {t.community.linkedPlayerLabel}
          </label>
          <input
            value={linkedPlayerId}
            onChange={(e) => setLinkedPlayerId(e.target.value)}
            placeholder="p1, p2, ..."
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-400 mt-1">{t.community.linkedPlayerHint}</p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {t.community.cancel}
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? t.community.saving : t.community.save}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
