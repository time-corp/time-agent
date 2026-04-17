import { useTranslation } from "react-i18next";
import { SSEDemo } from "../components/SSEDemo";
import { WSDemo } from "../components/WSDemo";

export function RealtimePage() {
  const { t } = useTranslation();

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-panel">
        <h2 className="mb-2 text-xl font-semibold">{t("common.realtimeTitle")}</h2>
        <p className="mb-5 text-sm leading-6 text-muted-foreground">
          {t("common.realtimeBody")}
        </p>
        <SSEDemo />
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-panel">
        <WSDemo />
      </section>
    </div>
  );
}
