import { useTranslation } from "react-i18next";

export function HomePage() {
  const { t } = useTranslation();

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-panel">
      <div className="mb-5 inline-flex rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
        TanStack Router + React Query + shadcn/ui
      </div>
      <h1 className="mb-3 text-3xl font-semibold tracking-tight">
        {t("common.welcomeTitle")}
      </h1>
      <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
        {t("common.welcomeBody")}
      </p>
      <ul className="mt-6 grid gap-3 text-sm text-foreground/90 md:grid-cols-3">
        <li className="rounded-2xl border border-border bg-background/70 p-4">
          {t("common.welcomeHintOne")}
        </li>
        <li className="rounded-2xl border border-border bg-background/70 p-4">
          {t("common.welcomeHintTwo")}
        </li>
        <li className="rounded-2xl border border-border bg-background/70 p-4">
          {t("common.welcomeHintThree")}
        </li>
      </ul>
    </section>
  );
}
