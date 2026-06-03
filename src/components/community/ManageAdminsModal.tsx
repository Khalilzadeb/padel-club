"use client";
import { useEffect, useState } from "react";
import { Shield, Trash2, UserPlus } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useLocale } from "@/contexts/LocaleContext";

interface AdminRow {
  userId: string;
  name: string;
  email: string;
  createdAt: string;
}

const inputCls =
  "flex-1 min-w-0 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-padel-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white";

export default function ManageAdminsModal({ onClose }: { onClose: () => void }) {
  const { t } = useLocale();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [me, setMe] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    fetch("/api/community/admins")
      .then((r) => (r.ok ? r.json() : { admins: [], me: "" }))
      .then((d: { admins: AdminRow[]; me: string }) => {
        setAdmins(d.admins);
        setMe(d.me);
        setLoading(false);
      });

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    setError(null);
    const e = email.trim();
    if (!e) return;
    setWorking(true);
    const res = await fetch("/api/community/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: e }),
    });
    setWorking(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error === "user-not-found" ? t.community.userNotFoundSignup : j.error ?? "Failed");
      return;
    }
    setEmail("");
    load();
  };

  const remove = async (userId: string) => {
    if (!confirm(t.community.removeAdminConfirm)) return;
    const res = await fetch("/api/community/admins", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) return alert("Failed");
    load();
  };

  return (
    <Modal isOpen onClose={onClose} title={t.community.manageAdmins} size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-start gap-2">
          <Shield className="w-4 h-4 mt-0.5 shrink-0 text-padel-green" />
          {t.community.adminsHint}
        </p>

        <div className="flex gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            type="email"
            placeholder={t.community.adminEmailPlaceholder}
            className={inputCls}
          />
          <Button onClick={add} disabled={working || !email.trim()}>
            <UserPlus className="w-4 h-4 mr-1" />
            {working ? t.community.saving : t.community.addAdmin}
          </Button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-8">
            <span className="w-7 h-7 border-2 border-padel-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-1.5">
            {admins.map((a) => (
              <div
                key={a.userId}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/40"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {a.name}
                    {a.userId === me && (
                      <span className="text-xs text-padel-green font-normal"> {t.community.youLabel}</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{a.email}</p>
                </div>
                {a.userId !== me && (
                  <button
                    onClick={() => remove(a.userId)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 shrink-0"
                    title={t.community.removeAdmin}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
