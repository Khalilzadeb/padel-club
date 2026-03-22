"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Pencil } from "lucide-react";
import Modal from "@/components/ui/Modal";
import EditProfileForm from "@/components/players/EditProfileForm";
import { Player } from "@/lib/types";

export default function EditProfileButton({ player }: { player: Player }) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (user?.playerId !== player.id) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm text-gray-700 dark:text-gray-300 font-medium transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" /> Edit profile
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Edit Profile" size="sm">
        <EditProfileForm
          player={player}
          onSave={() => router.refresh()}
          onClose={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
