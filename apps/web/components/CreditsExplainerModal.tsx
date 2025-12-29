"use client";

import { useEffect, useRef } from "react";
import { Sparkles, HelpCircle, UserPlus, Info } from "lucide-react";
import { useTranslations } from "next-intl";

interface CreditsExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreditsExplainerModal({ isOpen, onClose }: CreditsExplainerModalProps) {
  const t = useTranslations("CreditsModal");
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [isOpen]);

  return (
    <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle" onClose={onClose}>
      <div className="modal-box p-0 overflow-hidden bg-base-100 border border-base-200 shadow-2xl">
        <div className="bg-primary/5 p-6 border-b border-base-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl">{t("title")}</h3>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* What are credits */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 mt-1">
              <div className="p-2 bg-info/10 rounded-lg text-info">
                <HelpCircle className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-1">{t("whatAreCredits.title")}</h4>
              <p className="text-base-content/70 text-sm leading-relaxed">{t("whatAreCredits.description")}</p>
            </div>
          </div>

          {/* How to get more */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 mt-1">
              <div className="p-2 bg-success/10 rounded-lg text-success">
                <UserPlus className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-1">{t("howToGetMore.title")}</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-base-content/70">
                  <span className="text-success mt-0.5">✨</span>
                  <span>{t("howToGetMore.signupBonus")}</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-base-content/70 italic bg-base-200/50 p-3 rounded-lg border border-base-300/50">
                  <Info className="w-4 h-4 mt-0.5 text-base-content/50" />
                  <span>{t("howToGetMore.comingSoon")}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="modal-action p-6 pt-0">
          <button className="btn btn-primary w-full" onClick={onClose}>
            {t("close")}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop bg-neutral/40 backdrop-blur-sm">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
