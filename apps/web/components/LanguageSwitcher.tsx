"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname, routing } from "@/i18n/routing";
import { Languages } from "lucide-react";
import { useParams } from "next/navigation";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const handleLocaleChange = (newLocale: string) => {
    // router.replace is locale-aware, so it will automatically handle the prefix
    // @ts-ignore
    router.replace({ pathname, params }, { locale: newLocale });
  };

  const localeNames: Record<string, string> = {
    en: "English",
    el: "Ροδίτικα",
    nl: "Nederlands",
    es: "Español",
    de: "Deutsch",
  };

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm gap-2 normal-case font-medium">
        <Languages className="w-4 h-4 opacity-70" />
        <span className="hidden sm:inline">{localeNames[locale]}</span>
        <span className="sm:hidden">{locale.toUpperCase()}</span>
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content z-[110] menu p-2 shadow-2xl bg-base-100 rounded-xl w-32 mt-2 gap-1 border border-base-200"
      >
        {routing.locales.map((loc) => (
          <li key={loc}>
            <button
              onClick={() => handleLocaleChange(loc)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                locale === loc ? "bg-primary text-primary-content font-bold shadow-sm" : "hover:bg-base-200"
              }`}
            >
              {localeNames[loc]}
              {locale === loc && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
