"use client";
import { useState, useRef } from "react";
import { Player } from "@/lib/types";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import { Camera } from "lucide-react";

interface Props {
  player: Player;
  onSave: () => void;
  onClose: () => void;
}

const HAND_OPTIONS = [
  { value: "right", label: "Right-handed" },
  { value: "left", label: "Left-handed" },
];
const POSITION_OPTIONS = [
  { value: "drive", label: "Drive (right side)" },
  { value: "revés", label: "Revés (left side)" },
  { value: "flexible", label: "Flexible (both sides)" },
];
const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export default function EditProfileForm({ player, onSave, onClose }: Props) {
  const [hand, setHand] = useState(player.hand);
  const [position, setPosition] = useState(player.position);
  const [gender, setGender] = useState(player.gender ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(player.avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upload avatar if changed
      if (avatarFile) {
        const fd = new FormData();
        fd.append("avatar", avatarFile);
        await fetch(`/api/players/${player.id}/avatar`, { method: "POST", body: fd });
      }

      // Update profile fields
      await fetch(`/api/players/${player.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hand, position, gender: gender || undefined }),
      });

      onSave();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const selectClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-padel-green";

  return (
    <div className="space-y-5">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <Avatar name={player.name} size="xl" />
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 w-7 h-7 bg-padel-green text-white rounded-full flex items-center justify-center shadow hover:bg-green-600 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <p className="text-xs text-gray-400">Click the camera icon to upload a photo</p>
      </div>

      {/* Hand */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Playing hand</label>
        <div className="grid grid-cols-2 gap-2">
          {HAND_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setHand(o.value as Player["hand"])}
              className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                hand === o.value ? "border-padel-green bg-green-50 text-padel-green" : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Position */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Court position</label>
        <select value={position} onChange={(e) => setPosition(e.target.value as Player["position"])} className={selectClass}>
          {POSITION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Gender */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Gender</label>
        <select value={gender} onChange={(e) => setGender(e.target.value)} className={selectClass}>
          <option value="">Prefer not to say</option>
          {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
