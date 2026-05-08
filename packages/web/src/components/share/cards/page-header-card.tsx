import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PageHeaderCardProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  titleMeta?: ReactNode;
  headerRight?: ReactNode;
  mobileAction?: ReactNode;
  className?: string;
};

export function PageHeaderCard({
  icon,
  title,
  description,
  titleMeta,
  headerRight,
  mobileAction,
  className,
}: PageHeaderCardProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 md:items-center",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {icon ? (
          <div className="hidden shrink-0 size-11 items-center justify-center rounded-xl bg-primary text-white md:flex">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-3">
            <CardTitle>{title}</CardTitle>
            {titleMeta !== undefined ? (
              <Badge variant="secondary" className="rounded-md px-2 py-0.5">
                {titleMeta}
              </Badge>
            ) : null}
          </div>
          {description ? (
            <CardDescription className="truncate">
              {description}
            </CardDescription>
          ) : null}
        </div>
      </div>

      {mobileAction ? (
        <div className="shrink-0 md:hidden">{mobileAction}</div>
      ) : null}

      {headerRight ? (
        <div className="hidden shrink-0 md:block">{headerRight}</div>
      ) : null}
    </div>
  );
}
