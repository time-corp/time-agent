import { CheckIcon, LanguagesIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const languages = [
  { code: "en", label: "English", shortLabel: "EN" },
  { code: "vi", label: "Tiếng Việt", shortLabel: "VI" },
] as const;

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLanguage =
    languages.find((language) => language.code === i18n.language) ??
    languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <LanguagesIcon className="size-4" />
          {currentLanguage.shortLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            className="flex items-center justify-between gap-3"
            onClick={() => void i18n.changeLanguage(language.code)}
          >
            <span>{language.label}</span>
            {i18n.language === language.code ? (
              <CheckIcon className="size-4 text-primary" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
