"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { Tournament } from "@/lib/types";
import { Trophy, Plus, ChevronRight, Pencil, Trash2 } from "lucide-react";

const statusVariant: Record<string, "green" | "yellow" | "blue" | "gray"> = {
  active: "green", registration: "yellow", upcoming: "blue", completed: "gray",
};

const statusLabel: Record<string, string> = {
  active: "Active", registration: "Registration", upcoming: "Upcoming", completed: "Completed",
};

interface CreateForm {
  name: string;
  description: string;
  status: Tournament["status"];
  format: Tournament["format"];
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxTeams: number;
}

const defaultForm: CreateForm = {
  name: "",
  description: "",
  status: "upcoming",
  format: "knockout",
  startDate: "",
  endDate: "",
  registrationDeadline: "",
  maxTeams: 8,
};

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = () => {
    fetch("/api/admin/tournaments")
      .then((r) => r.json())
      .then((data) => { setTournaments(Array.isArray(data) ? data : []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.startDate || !form.endDate) return;
    setSaving(true);
    const res = await fetch("/api/admin/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        registeredTeams: [],
        courtIds: [],
        prizes: [],
        matchIds: [],
      }),
    });
    setSaving(false);
    if (res.ok) {
      setShowCreate(false);
      setForm(defaultForm);
      load();
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/tournaments/${id}`, { method: "DELETE" });
    setDeleteId(null);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Tournaments</h1>
        <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Tournament
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="w-8 h-8 border-2 border-padel-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tournaments.length === 0 ? (
        <Card className="p-12 text-center">
          <Trophy className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No tournaments yet</p>
          <Button className="mt-4" onClick={() => setShowCreate(true)}>Create first tournament</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {tournaments.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 truncate">{t.name}</p>
                    <Badge variant={statusVariant[t.status]}>{statusLabel[t.status]}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t.startDate} → {t.endDate} · {t.registeredTeams.length}/{t.maxTeams} teams · {t.format}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/admin/tournaments/${t.id}`}>
                    <Button size="sm" variant="ghost" className="flex items-center gap-1 text-gray-600">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:bg-red-50"
                    onClick={() => setDeleteId(t.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Tournament" size="md">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Name *</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
              placeholder="Tournament name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green resize-none"
              rows={2}
              placeholder="Tournament description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Format</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
                value={form.format}
                onChange={(e) => setForm({ ...form, format: e.target.value as Tournament["format"] })}
              >
                <option value="knockout">Knockout</option>
                <option value="round-robin">Round Robin</option>
                <option value="group-then-knockout">Group + Knockout</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Status</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Tournament["status"] })}
              >
                <option value="upcoming">Upcoming</option>
                <option value="registration">Registration Open</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Start Date *</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">End Date *</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Registration Deadline</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
                value={form.registrationDeadline}
                onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Max Teams</label>
              <input
                type="number"
                min={2}
                max={64}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green"
                value={form.maxTeams}
                onChange={(e) => setForm({ ...form, maxTeams: parseInt(e.target.value) || 8 })}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              className="flex-1"
              onClick={handleCreate}
              disabled={saving || !form.name || !form.startDate || !form.endDate}
            >
              {saving ? "Creating..." : "Create Tournament"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Tournament" size="sm">
        <p className="text-sm text-gray-600 mb-4">Bu turniri silmək istədiyinizə əminsiniz?</p>
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button
            className="flex-1 bg-red-500 hover:bg-red-600"
            onClick={() => deleteId && handleDelete(deleteId)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
