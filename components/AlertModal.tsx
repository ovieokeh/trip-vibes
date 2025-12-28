"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";
import clsx from "clsx";
import { useTranslations } from "next-intl";

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: "error" | "success" | "info" | "warning";
  onClose: () => void;
}

export default function AlertModal({ isOpen, title, message, type = "error", onClose }: AlertModalProps) {
  const t = useTranslations("Alert");
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [isOpen]);

  const getIcon = () => {
    switch (type) {
      case "error":
        return <XCircle className="w-10 h-10 text-error" />;
      case "success":
        return <CheckCircle className="w-10 h-10 text-success" />;
      case "warning":
        return <AlertCircle className="w-10 h-10 text-warning" />;
      case "info":
      default:
        return <Info className="w-10 h-10 text-info" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case "error":
        return "border-error";
      case "success":
        return "border-success";
      case "warning":
        return "border-warning";
      case "info":
      default:
        return "border-info";
    }
  };

  return (
    <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle" onClose={onClose}>
      <div className={clsx("modal-box border-t-4", getBorderColor())}>
        <div className="flex flex-col items-center text-center gap-4">
          {getIcon()}
          <div>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="py-2 text-base-content/70">{message}</p>
          </div>
        </div>
        <div className="modal-action justify-center">
          <button className="btn btn-wide" onClick={onClose}>
            {t("dismiss")}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
