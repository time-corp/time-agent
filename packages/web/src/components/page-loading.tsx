export function PageLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card px-6 py-8 text-center shadow-panel">
        <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-2xl bg-primary/12" />
        <h1 className="text-lg font-semibold text-foreground">Time Agent</h1>
        <p className="mt-2 text-sm text-muted-foreground">Đang kiểm tra phiên đăng nhập...</p>
      </div>
    </div>
  );
}
