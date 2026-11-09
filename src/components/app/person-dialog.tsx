"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";
import type { PersonDTO, PersonWithStatus, TrackerDTO } from "@/lib/types";
import { PersonAvatar } from "./avatars";
import { Camera } from "lucide-react";

async function fileToDataUrl(file: File, size = 128): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, size / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function PersonDialog({
  open,
  onOpenChange,
  tracker,
  person,
  currency,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tracker: TrackerDTO;
  person?: PersonWithStatus | null;
  currency: string;
}) {
  const editing = Boolean(person);
  const session = person?.id ?? `new-${tracker.id}`;
  const title = useT()(editing ? "editPerson" : "addPerson");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">{tracker.name}</DialogDescription>
        </DialogHeader>
        {open && (
          <PersonForm
            key={session}
            tracker={tracker}
            person={person ?? null}
            currency={currency}
            editing={editing}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PersonForm({
  tracker,
  person,
  currency,
  editing,
  onDone,
}: {
  tracker: TrackerDTO;
  person: PersonDTO | null;
  currency: string;
  editing: boolean;
  onDone: () => void;
}) {
  const t = useT();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(person?.name ?? "");
  const [phone, setPhone] = useState(person?.phone ?? "");
  const [photo, setPhoto] = useState<string | null>(person?.photo ?? null);
  const [due, setDue] = useState(person ? String(person.dueAmount) : String(tracker.defaultDue));
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        name: name.trim(),
        phone: phone.trim() || null,
        photo,
        dueAmount: Number(due),
      };
      if (editing && person) return api.updatePerson(person.id, body);
      return api.createPerson({ trackerId: tracker.id, ...body });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["state"] });
      onDone();
      toast.success(editing ? t("updated") : t("addedPerson"));
    },
    onError: (e: Error) => setError(e.message),
  });

  function submit() {
    setError(null);
    if (!name.trim()) {
      setError(t("required"));
      return;
    }
    if (!(Number(due) > 0)) {
      setError(t("amountMustBePositive"));
      return;
    }
    save.mutate();
  }

  return (
    <>
      <div className="grid gap-4 py-1">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="relative rounded-full"
            onClick={() => fileRef.current?.click()}
            aria-label={t("photo")}
          >
            <PersonAvatar name={name || "?"} photo={photo} size={64} />
            <span className="absolute -bottom-0.5 -right-0.5 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
              <Camera className="size-3.5" />
            </span>
          </button>
          <div className="grid flex-1 gap-1.5">
            <Label htmlFor="pp-name">{t("personName")}</Label>
            <Input
              id="pp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("personNamePh")}
              className="h-12 rounded-2xl"
              maxLength={80}
              autoFocus
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="pp-phone">{t("phone")}</Label>
            <Input
              id="pp-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("phonePh")}
              className="h-12 rounded-2xl"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="pp-due">
              {t("dueAmount")} ({currency})
            </Label>
            <Input
              id="pp-due"
              type="number"
              inputMode="decimal"
              min="1"
              step="0.01"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="money h-12 rounded-2xl"
            />
          </div>
        </div>

        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" className="rounded-2xl" onClick={onDone}>
          {t("cancel")}
        </Button>
        <Button className="rounded-2xl font-bold" onClick={submit} disabled={save.isPending}>
          {editing ? t("update") : t("save")}
        </Button>
      </DialogFooter>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            setPhoto(await fileToDataUrl(f));
          } catch {
            toast.error("Image could not be processed");
          }
          e.target.value = "";
        }}
      />
    </>
  );
}
