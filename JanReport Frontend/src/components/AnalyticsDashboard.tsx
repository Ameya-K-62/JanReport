import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  Hourglass,
  Clock3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import {
  Line,
  LineChart,
  Pie,
  PieChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  BarChart,
  Cell,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "./ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  reportsAPI,
  type AnalyticsResponseData,
  type AnalyticsCategoryPoint,
} from "../services/api";

interface AnalyticsDashboardProps {
  userType: "user" | "moderator" | null;
}

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#22c55e",
  "#f97316",
  "#06b6d4",
];

const lineChartConfig = {
  submitted: { label: "Submitted", color: "var(--chart-1)" },
  approved: { label: "Approved", color: "var(--chart-2)" },
  rejected: { label: "Rejected", color: "var(--chart-5)" },
} satisfies ChartConfig;

const categoryChartConfig = {
  count: { label: "Reports", color: "var(--chart-3)" },
} satisfies ChartConfig;

const priorityChartConfig = {
  count: { label: "Reports", color: "var(--chart-4)" },
} satisfies ChartConfig;

function percentDelta(current: number, previous: number) {
  if (!previous && !current) {
    return "0%";
  }
  if (!previous) {
    return "+100%";
  }
  const value = ((current - previous) / previous) * 100;
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

function formatDayLabel(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function renderKpiCard(
  title: string,
  value: string,
  helper: string,
  Icon: typeof TrendingUp,
  accentClass: string,
) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardDescription className="text-xs uppercase tracking-wide">{title}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-semibold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{helper}</p>
          </div>
          <div className={`rounded-lg p-2 ${accentClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsDashboard({ userType }: AnalyticsDashboardProps) {
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "365d">("30d");
  const [status, setStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [data, setData] = useState<AnalyticsResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userType) {
      return;
    }

    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);

      try {
        const scope = userType === "moderator" ? "moderator" : "user";
        const response = await reportsAPI.getAnalytics(scope, range, status, "all");
        setData(response.data);
      } catch (err: any) {
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [userType, range, status]);

  const normalizedCategoryData = useMemo(() => {
    if (!data?.categoryBreakdown?.length) {
      return [];
    }

    return data.categoryBreakdown.map((item: AnalyticsCategoryPoint, index: number) => ({
      ...item,
      fill: PIE_COLORS[index % PIE_COLORS.length],
    }));
  }, [data]);

  if (!userType) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Login required to view analytics dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const title = userType === "moderator" ? "Moderator Analytics" : "My Analytics";
  const subtitle = userType === "moderator"
    ? "Operational insights for moderation workflow and report quality"
    : "Track your reporting activity, approval trends, and outcomes";

  const kpis = data?.kpis;

  return (
    <div className="container mx-auto max-w-full overflow-x-hidden px-3 sm:px-4 py-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full sm:w-auto">
          <Select value={range} onValueChange={(value: string) => setRange(value as typeof range)}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="365d">Last 365 days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={(value: string) => setStatus(value as typeof status)}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Status filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="h-28 animate-pulse bg-muted" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      ) : !data || !kpis ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">No analytics data available.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {renderKpiCard(
              "Total Reports",
              `${kpis.totalReports}`,
              `${percentDelta(kpis.totalReports, kpis.previousPeriod.totalReports)} vs previous period`,
              TrendingUp,
              "bg-emerald-100 text-emerald-700",
            )}
            {renderKpiCard(
              "Pending Queue",
              `${kpis.pendingReports}`,
              `${percentDelta(kpis.pendingReports, kpis.previousPeriod.pendingReports)} vs previous period`,
              Hourglass,
              "bg-amber-100 text-amber-700",
            )}
            {renderKpiCard(
              "Approval Rate",
              `${kpis.approvalRate}%`,
              `${kpis.approvedReports} approved out of ${kpis.totalReports}`,
              CheckCircle2,
              "bg-blue-100 text-blue-700",
            )}
            {renderKpiCard(
              "Avg Resolution",
              `${kpis.avgResolutionHours}h`,
              "Average time from submission to final decision",
              Clock3,
              "bg-violet-100 text-violet-700",
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Reports Trend</CardTitle>
                <CardDescription>Submitted, approved, and rejected over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={lineChartConfig} className="h-[220px] sm:h-[280px] w-full max-w-full">
                  <LineChart data={data.timeSeries} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={formatDayLabel}
                    />
                    <YAxis tickLine={false} axisLine={false} width={30} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend
                      content={(legendProps: any) => (
                        <ChartLegendContent
                          payload={legendProps.payload}
                          verticalAlign={legendProps.verticalAlign}
                          className="flex-wrap"
                        />
                      )}
                    />
                    <Line
                      type="monotone"
                      dataKey="submitted"
                      stroke="var(--color-submitted)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="approved"
                      stroke="var(--color-approved)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rejected"
                      stroke="var(--color-rejected)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Category Split</CardTitle>
                <CardDescription>Distribution by report category</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={categoryChartConfig} className="h-[220px] sm:h-[280px] w-full max-w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="category" />} />
                    <Pie
                      data={normalizedCategoryData}
                      dataKey="count"
                      nameKey="category"
                      innerRadius={58}
                      outerRadius={92}
                      paddingAngle={2}
                    >
                      {normalizedCategoryData.map((entry, index) => (
                        <Cell key={`cell-${entry.category}-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend
                      content={(legendProps: any) => (
                        <ChartLegendContent
                          payload={legendProps.payload}
                          verticalAlign={legendProps.verticalAlign}
                          nameKey="category"
                          className="flex-wrap"
                        />
                      )}
                    />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
                <CardDescription>Workload split by urgency level</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={priorityChartConfig} className="h-[220px] sm:h-[260px] w-full max-w-full">
                  <BarChart data={data.priorityBreakdown} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="priority" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={30} />
                    <ChartTooltip content={<ChartTooltipContent nameKey="priority" />} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="var(--color-count)" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Top Locations</CardTitle>
                <CardDescription>Most active report locations in selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topLocations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No location data available for this filter.</p>
                  ) : (
                    data.topLocations.map((item, index) => (
                      <div
                        key={`${item.location}-${index}`}
                        className="grid grid-cols-[1fr_auto] items-start gap-2 rounded-lg border px-3 py-2"
                      >
                        <p className="min-w-0 text-sm font-medium break-words">{item.location || "Unknown location"}</p>
                        <span className="text-sm text-muted-foreground self-center">{item.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {renderKpiCard(
              "Approved Reports",
              `${kpis.approvedReports}`,
              `${percentDelta(kpis.approvedReports, kpis.previousPeriod.approvedReports)} vs previous period`,
              CheckCircle2,
              "bg-emerald-100 text-emerald-700",
            )}
            {renderKpiCard(
              "Rejected Reports",
              `${kpis.rejectedReports}`,
              `${percentDelta(kpis.rejectedReports, kpis.previousPeriod.rejectedReports)} vs previous period`,
              XCircle,
              "bg-rose-100 text-rose-700",
            )}
          </div>

          {status === "pending" && (
            <Card className="border-amber-200 bg-amber-50/70">
              <CardContent className="pt-6">
                <p className="text-sm text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Pending-only filter is enabled. Approval rate and trend values reflect pending-focused scope.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}