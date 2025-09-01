
"use client";
import "../types/i18n";

import React from "react";
import { useTranslation } from "react-i18next";
import { FaGlobe } from "react-icons/fa";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui";

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "np", name: "Nepali", nativeName: "नेपाली" },
];


export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (languageCode: string) => {
    if (typeof i18n.changeLanguage === 'function') {
      i18n.changeLanguage(languageCode);
    } else {
      // fallback: reload page with new language if needed
      console.error('i18n.changeLanguage is not a function');
    }
  };

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-1.5 text-sm hover:bg-gray-50">
        <FaGlobe className="h-4 w-4" />
        <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-40 right-0">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onSelect={() => changeLanguage(language.code)}
            className={`cursor-pointer rounded-md p-2 ${
              i18n.language === language.code ? "bg-blue-500 text-white" : "hover:bg-gray-100"
            }`}
          >
            <div className="flex flex-col">
              <span className="font-medium">{language.nativeName}</span>
              <span className="text-xs text-gray-500">{language.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
