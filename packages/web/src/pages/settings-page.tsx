import { CheckIcon, Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SettingsMinimalistic } from "@solar-icons/react";

import { useTheme } from "@/components/theme-provider-context";
import { PageHeaderCard } from "@/components/share/cards/page-header-card";
import { SectionCard } from "@/components/share/cards/section-card";
import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
  { value: "light", labelKey: "settings.themeLight", icon: Sun },
  { value: "dark", labelKey: "settings.themeDark", icon: Moon },
  { value: "system", labelKey: "settings.themeSystem", icon: Monitor },
] as const;

const LANGUAGE_OPTIONS = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
] as const;

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeaderCard
        icon={<SettingsMinimalistic weight="Bold" />}
        title={t("common.settings")}
        description={t("settings.description")}
      />

      <SectionCard title={t("settings.appearance")} description={t("settings.appearanceDesc")}>
        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map(({ value, labelKey, icon: Icon }) => {
            const active = theme === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={cn(
                  "relative flex flex-col items-center gap-2.5 rounded-2xl border p-4 transition-all",
                  active
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-background hover:border-primary/40 hover:bg-muted/50",
                )}
              >
                {active && (
                  <span className="absolute right-2.5 top-2.5 flex size-4 items-center justify-center rounded-full bg-primary text-white">
                    <CheckIcon className="size-2.5" />
                  </span>
                )}
                <Icon
                  className={cn(
                    "size-6",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {t(labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title={t("settings.language")} description={t("settings.languageDesc")}>
        <div className="grid grid-cols-2 gap-3">
          {LANGUAGE_OPTIONS.map(({ code, label, flag }) => {
            const active = i18n.language === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => void i18n.changeLanguage(code)}
                className={cn(
                  "relative flex items-center gap-3 rounded-2xl border p-4 transition-all",
                  active
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-background hover:border-primary/40 hover:bg-muted/50",
                )}
              >
                {active && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 flex size-4 items-center justify-center rounded-full bg-primary text-white">
                    <CheckIcon className="size-2.5" />
                  </span>
                )}
                <span className="text-2xl">{flag}</span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
