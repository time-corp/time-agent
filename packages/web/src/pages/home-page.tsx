import { Link } from "@tanstack/react-router";
import {
  ChatRound,
  ClipboardList,
  CodeSquare,
  Documents,
  Server,
  UserCircle,
  UsersGroupRounded,
  UsersGroupTwoRounded,
  Widget,
} from "@solar-icons/react";
import { ArrowRightIcon, RefreshCwIcon } from "lucide-react";
import { PageHeaderCard } from "@/components/share/cards/page-header-card";
import { SectionCard } from "@/components/share/cards/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAgentConfigsQuery } from "@/hooks/useAgentConfigs";
import { useAgentTeamsQuery } from "@/hooks/useAgentTeams";
import { useChannelsQuery } from "@/hooks/useChannels";
import { useDiscordStatusQuery } from "@/hooks/useDiscordBot";
import { useLogsQuery } from "@/hooks/useLogs";
import { useProvidersQuery } from "@/hooks/useProviders";
import { useSlackStatusQuery } from "@/hooks/useSlackBot";
import { useTelegramStatusQuery } from "@/hooks/useTelegramBot";
import { useToolsQuery, useSkillsQuery } from "@/hooks/useTools";
import { useUsersQuery } from "@/hooks/useUsers";
import { useWhatsappStatusQuery } from "@/hooks/useWhatsappBot";
import { channelTypeMeta } from "@/pages/channels/schemas/channel-schema";
import { providerTypeMeta } from "@/pages/providers/schemas/provider-schema";

function toTimestamp(value: string | number | Date) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDateTime(value: string | number | Date) {
  const timestamp = toTimestamp(value);

  if (!timestamp) return "Unknown";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

type StatCardProps = {
  title: string;
  value: number;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
  loading?: boolean;
};

function StatCard({
  title,
  value,
  subtitle,
  href,
  icon,
  loading = false,
}: StatCardProps) {
  return (
    <Link
      to={href}
      className="group rounded-3xl border border-border/60 bg-background/80 p-5 transition-colors hover:border-primary/30 hover:bg-primary/5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {loading ? "..." : value}
          </p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>{subtitle}</span>
        <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

type MiniStatusCardProps = {
  label: string;
  total: number;
  running: number;
  extra?: string;
};

function MiniStatusCard({ label, total, running, extra }: MiniStatusCardProps) {
  const stopped = Math.max(total - running, 0);

  return (
    <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium">{label}</p>
        <Badge variant={running > 0 ? "success" : "secondary"}>
          {running > 0 ? "Running" : "Idle"}
        </Badge>
      </div>
      <div className="mt-4 flex items-end gap-6">
        <div>
          <p className="text-2xl font-semibold">{running}</p>
          <p className="text-xs text-muted-foreground">running</p>
        </div>
        <div>
          <p className="text-lg font-medium">{stopped}</p>
          <p className="text-xs text-muted-foreground">stopped</p>
        </div>
        <div>
          <p className="text-lg font-medium">{total}</p>
          <p className="text-xs text-muted-foreground">total</p>
        </div>
      </div>
      {extra ? (
        <p className="mt-3 text-xs text-muted-foreground">{extra}</p>
      ) : null}
    </div>
  );
}

export function HomePage() {
  const usersQuery = useUsersQuery();
  const providersQuery = useProvidersQuery();
  const agentConfigsQuery = useAgentConfigsQuery();
  const agentTeamsQuery = useAgentTeamsQuery();
  const channelsQuery = useChannelsQuery();
  const toolsQuery = useToolsQuery();
  const skillsQuery = useSkillsQuery();
  const logsQuery = useLogsQuery({ limit: 5 }, 30_000);
  const telegramStatusQuery = useTelegramStatusQuery();
  const discordStatusQuery = useDiscordStatusQuery();
  const slackStatusQuery = useSlackStatusQuery();
  const whatsappStatusQuery = useWhatsappStatusQuery();

  const users = usersQuery.data ?? [];
  const providers = providersQuery.data ?? [];
  const agentConfigs = agentConfigsQuery.data ?? [];
  const agentTeams = agentTeamsQuery.data ?? [];
  const channels = channelsQuery.data ?? [];
  const tools = toolsQuery.data ?? [];
  const skills = skillsQuery.data ?? [];
  const logs = logsQuery.data?.entries ?? [];
  const telegramStatuses = telegramStatusQuery.data ?? [];
  const discordStatuses = discordStatusQuery.data ?? [];
  const slackStatuses = slackStatusQuery.data ?? [];
  const whatsappStatuses = whatsappStatusQuery.data ?? [];

  const activeProviders = providers.filter((provider) => provider.isActive).length;
  const configuredProviders = providers.filter((provider) => provider.hasApiKey).length;
  const activeAgents = agentConfigs.filter((agent) => agent.isActive).length;
  const imageAgents = agentConfigs.filter(
    (agent) => agent.agentMode === "image_generate",
  ).length;
  const activeTeams = agentTeams.filter((team) => team.isActive).length;
  const orchestrationTeams = agentTeams.filter(
    (team) => team.autoOrchestration,
  ).length;
  const activeChannels = channels.filter((channel) => channel.isActive).length;
  const connectedChannels = channels.filter(
    (channel) => channel.hasCredentials,
  ).length;
  const runningTelegram = telegramStatuses.filter((status) => status.running).length;
  const runningDiscord = discordStatuses.filter((status) => status.running).length;
  const runningSlack = slackStatuses.filter((status) => status.running).length;
  const runningWhatsapp = whatsappStatuses.filter((status) => status.running).length;
  const whatsappQrPending = whatsappStatuses.filter(
    (status) => status.running && status.qr,
  ).length;

  const providerBreakdown = Object.entries(
    providers.reduce<Record<string, number>>((acc, provider) => {
      acc[provider.type] = (acc[provider.type] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const channelBreakdown = Object.entries(
    channels.reduce<Record<string, number>>((acc, channel) => {
      acc[channel.type] = (acc[channel.type] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const latestChanges = [
    ...providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
      kind: "Provider",
      href: "/providers",
      updatedAt: provider.updatedAt,
    })),
    ...agentConfigs.map((agent) => ({
      id: agent.id,
      name: agent.name,
      kind: "Agent",
      href: "/agent-configs",
      updatedAt: agent.updatedAt,
    })),
    ...agentTeams.map((team) => ({
      id: team.id,
      name: team.name,
      kind: "Team",
      href: "/agent-teams",
      updatedAt: team.updatedAt,
    })),
    ...channels.map((channel) => ({
      id: channel.id,
      name: channel.name,
      kind: "Channel",
      href: "/channels",
      updatedAt: channel.updatedAt,
    })),
  ]
    .sort((a, b) => toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt))
    .slice(0, 6);

  const inventoryCount =
    users.length +
    providers.length +
    agentConfigs.length +
    agentTeams.length +
    channels.length;

  const isRefreshing =
    usersQuery.isFetching ||
    providersQuery.isFetching ||
    agentConfigsQuery.isFetching ||
    agentTeamsQuery.isFetching ||
    channelsQuery.isFetching ||
    toolsQuery.isFetching ||
    skillsQuery.isFetching ||
    logsQuery.isFetching;

  const handleRefresh = async () => {
    await Promise.all([
      usersQuery.refetch(),
      providersQuery.refetch(),
      agentConfigsQuery.refetch(),
      agentTeamsQuery.refetch(),
      channelsQuery.refetch(),
      toolsQuery.refetch(),
      skillsQuery.refetch(),
      logsQuery.refetch(),
      telegramStatusQuery.refetch(),
      discordStatusQuery.refetch(),
      slackStatusQuery.refetch(),
      whatsappStatusQuery.refetch(),
    ]);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeaderCard
        icon={<ClipboardList weight="Bold" />}
        title="System dashboard"
        description="Tổng quan nhanh về tài nguyên, bot runtime và hoạt động gần nhất."
        titleMeta={inventoryCount}
        headerRight={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isRefreshing}
              onClick={() => void handleRefresh()}
            >
              <RefreshCwIcon data-icon="inline-start" className={isRefreshing ? "animate-spin" : ""} />
              Refresh
            </Button>
            <Button asChild size="lg">
              <Link to="/chat">
                <ChatRound data-icon="inline-start" />
                Open Chat
              </Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Users"
          value={users.length}
          subtitle="Tài khoản có thể truy cập hệ thống"
          href="/users"
          icon={<UserCircle weight="Bold" className="size-6" />}
          loading={usersQuery.isLoading}
        />
        <StatCard
          title="Providers"
          value={providers.length}
          subtitle={`${activeProviders} active, ${configuredProviders} có API key`}
          href="/providers"
          icon={<Server weight="Bold" className="size-6" />}
          loading={providersQuery.isLoading}
        />
        <StatCard
          title="Agent Configs"
          value={agentConfigs.length}
          subtitle={`${activeAgents} active, ${imageAgents} image agents`}
          href="/agent-configs"
          icon={<Widget weight="Bold" className="size-6" />}
          loading={agentConfigsQuery.isLoading}
        />
        <StatCard
          title="Channels"
          value={channels.length}
          subtitle={`${activeChannels} active, ${connectedChannels} đã cấu hình`}
          href="/channels"
          icon={<CodeSquare weight="Bold" className="size-6" />}
          loading={channelsQuery.isLoading}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Bot runtime"
          description="Trạng thái các kênh bot đang được quản lý bởi hệ thống."
          contentClassName="grid gap-4 md:grid-cols-2"
        >
          <MiniStatusCard
            label="Telegram"
            total={telegramStatuses.length}
            running={runningTelegram}
          />
          <MiniStatusCard
            label="Discord"
            total={discordStatuses.length}
            running={runningDiscord}
          />
          <MiniStatusCard
            label="Slack"
            total={slackStatuses.length}
            running={runningSlack}
          />
          <MiniStatusCard
            label="WhatsApp"
            total={whatsappStatuses.length}
            running={runningWhatsapp}
            extra={
              whatsappQrPending > 0
                ? `${whatsappQrPending} channel đang chờ quét QR`
                : "Không có channel nào chờ quét QR"
            }
          />
        </SectionCard>

        <SectionCard
          title="System readiness"
          description="Một vài chỉ dấu cấu hình quan trọng để vận hành."
          contentClassName="flex flex-col gap-4"
        >
          <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
            <div>
              <p className="font-medium">Teams</p>
              <p className="text-sm text-muted-foreground">
                {activeTeams} active, {orchestrationTeams} auto orchestration
              </p>
            </div>
            <Badge variant={activeTeams > 0 ? "success" : "warning"}>
              {agentTeams.length}
            </Badge>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
            <div>
              <p className="font-medium">Built-in tools</p>
              <p className="text-sm text-muted-foreground">
                Catalog công cụ và kỹ năng đang khả dụng
              </p>
            </div>
            <Badge variant="secondary">
              {tools.length} tools / {skills.length} skills
            </Badge>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
            <div>
              <p className="font-medium">Latest logs</p>
              <p className="text-sm text-muted-foreground">
                Auto refresh mỗi 30 giây từ log stream API
              </p>
            </div>
            <Badge variant={logs.length > 0 ? "outline" : "warning"}>
              {logs.length} entries
            </Badge>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard
          title="Inventory mix"
          description="Phân bổ provider và channel hiện có."
          contentClassName="grid gap-4 md:grid-cols-2"
        >
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Providers</p>
            {providerBreakdown.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                Chưa có provider nào.
              </div>
            ) : (
              providerBreakdown.map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">
                      {providerTypeMeta[type as keyof typeof providerTypeMeta]?.label ?? type}
                    </p>
                    <p className="text-xs text-muted-foreground">{type}</p>
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Channels</p>
            {channelBreakdown.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                Chưa có channel nào.
              </div>
            ) : (
              channelBreakdown.map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">
                      {channelTypeMeta[type as keyof typeof channelTypeMeta]?.label ?? type}
                    </p>
                    <p className="text-xs text-muted-foreground">{type}</p>
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Latest changes"
          description="Những resource được cập nhật gần đây nhất."
          contentClassName="space-y-3"
        >
          {latestChanges.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
              Chưa có dữ liệu để hiển thị thay đổi gần đây.
            </div>
          ) : (
            latestChanges.map((item) => (
              <Link
                key={`${item.kind}-${item.id}`}
                to={item.href}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/70 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{item.name}</p>
                    <Badge variant="outline">{item.kind}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Updated {formatDateTime(item.updatedAt)}
                  </p>
                </div>
                <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard
          title="Quick actions"
          description="Các đường tắt vào khu vực quản trị thường dùng."
          contentClassName="grid gap-3 md:grid-cols-2"
        >
          <Button asChild variant="outline" size="lg" className="justify-between">
            <Link to="/providers">
              <span className="inline-flex items-center gap-2">
                <Server className="size-4" weight="Bold" />
                Manage providers
              </span>
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="justify-between">
            <Link to="/agent-configs">
              <span className="inline-flex items-center gap-2">
                <Widget className="size-4" weight="Bold" />
                Review agents
              </span>
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="justify-between">
            <Link to="/agent-teams">
              <span className="inline-flex items-center gap-2">
                <UsersGroupTwoRounded className="size-4" weight="Bold" />
                Open teams
              </span>
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="justify-between">
            <Link to="/channels">
              <span className="inline-flex items-center gap-2">
                <CodeSquare className="size-4" weight="Bold" />
                Check channels
              </span>
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="justify-between">
            <Link to="/logs">
              <span className="inline-flex items-center gap-2">
                <Documents className="size-4" weight="Bold" />
                Inspect logs
              </span>
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="justify-between">
            <Link to="/users">
              <span className="inline-flex items-center gap-2">
                <UsersGroupRounded className="size-4" weight="Bold" />
                Manage users
              </span>
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        </SectionCard>

        <SectionCard
          title="Recent logs"
          description="Log gần nhất để nhìn nhanh tình trạng hệ thống."
          headerRight={
            <Button asChild variant="ghost" size="sm">
              <Link to="/logs">View all</Link>
            </Button>
          }
          contentClassName="space-y-3"
        >
          {logsQuery.isError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              Failed to load logs.
            </div>
          ) : logs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
              Chưa có log nào được trả về.
            </div>
          ) : (
            logs.map((entry) => (
              <div
                key={`${entry.time}-${entry.msg}`}
                className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        entry.levelName === "error"
                          ? "destructive"
                          : entry.levelName === "warn"
                            ? "warning"
                            : "outline"
                      }
                    >
                      {entry.levelName}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {entry.name ?? "system"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(entry.time)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-foreground/90">
                  {entry.msg}
                </p>
              </div>
            ))
          )}
        </SectionCard>
      </div>
    </div>
  );
}
