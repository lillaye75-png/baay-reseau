"use client";

import { useEffect, useRef } from "react";
import Button from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="rounded-xl border border-gray-200 bg-white p-0 shadow-2xl backdrop:bg-black/40 dark:bg-gray-800 dark:border-gray-700"
      onCancel={onCancel}
    >
      <div className="p-6 max-w-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : variant === "warning" ? "danger" : undefined}
            size="sm"
            onClick={() => { onConfirm(); onCancel(); }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}

interface PromptDialogProps {
  open: boolean;
  title: string;
  label: string;
  defaultValue?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function PromptDialog({
  open,
  title,
  label,
  defaultValue = "",
  confirmLabel = "OK",
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      setTimeout(() => inputRef.current?.focus(), 100);
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputRef.current?.value || "";
    onConfirm(value);
    onCancel();
  };

  return (
    <dialog
      ref={dialogRef}
      className="rounded-xl border border-gray-200 bg-white p-0 shadow-2xl backdrop:bg-black/40 dark:bg-gray-800 dark:border-gray-700"
      onCancel={onCancel}
    >
      <form onSubmit={handleSubmit} className="p-6 max-w-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <input
          ref={inputRef}
          type="text"
          defaultValue={defaultValue}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white mb-4"
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" type="button" onClick={onCancel}>
            Annuler
          </Button>
          <Button size="sm" type="submit">
            {confirmLabel}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
