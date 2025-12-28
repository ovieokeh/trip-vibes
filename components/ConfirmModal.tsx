"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  type = "warning",
}: ConfirmModalProps) {
  const t = useTranslations("Confirm");
  const modalRef = useRef<HTMLDialogElement>(null);

  const finalConfirmText = confirmText || t("confirm");
  const finalCancelText = cancelText || t("cancel");

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [isOpen]);

  const getButtonClass = () => {
    switch (type) {
      case "danger":
        return "btn-error";
      case "warning":
        return "btn-warning";
      case "info":
      default:
        return "btn-primary";
    }
  };

  return (
    <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle" onClose={onCancel}>
      <div className="modal-box">
        <div className="flex flex-col items-center text-center gap-4">
          <div
            className={clsx(
              "p-3 rounded-full bg-opacity-10",
              type === "danger"
                ? "bg-error text-error"
                : type === "warning"
                ? "bg-warning text-warning"
                : "bg-primary text-primary"
            )}
          >
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="py-2 text-base-content/70">{message}</p>
          </div>
        </div>
        <div className="modal-action justify-center gap-2">
          <button className="btn" onClick={onCancel}>
            {finalCancelText}
          </button>
          <button className={clsx("btn", getButtonClass())} onClick={onConfirm}>
            {finalConfirmText}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onCancel}>close</button>
      </form>
    </dialog>
  );
}
