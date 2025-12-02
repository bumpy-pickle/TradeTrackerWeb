import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { WorkedHoursChartData } from "@shared/schema";

interface WorkedHoursChartProps {
  data: WorkedHoursChartData[];
}

type ViewMode = "balance" | "breakdown";

export function WorkedHoursChart({ data }: WorkedHoursChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("balance");

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] sm:h-[300px] text-sm text-muted-foreground" data-testid="chart-empty">
        No data to display
      </div>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    displayName: item.name.length > 15 ? item.name.substring(0, 13) + "..." : item.name,
    originalName: item.name,
    absTotal: Math.abs(item.total),
  })).sort((a, b) => b.total - a.total);

  const maxValue = Math.max(...data.map(d => Math.max(Math.abs(d.total), d.youWorked, d.theyWorked)));

  const getBalanceColor = (total: number) => {
    if (total > 0) return "hsl(var(--chart-3))";
    if (total < 0) return "hsl(var(--destructive))";
    return "hsl(var(--muted-foreground))";
  };

  const getBalanceIcon = (total: number) => {
    if (total > 0) return <TrendingUp className="w-4 h-4 text-chart-3" />;
    if (total < 0) return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getBalanceText = (total: number) => {
    if (total > 0) return "owed to you";
    if (total < 0) return "you owe";
    return "even";
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = data.total;
      
      return (
        <div className="bg-card border rounded-lg shadow-xl p-4 min-w-[200px]" data-testid="chart-tooltip">
          <p className="font-semibold text-foreground text-sm mb-3">{data.originalName}</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">You worked</span>
              <span className="font-medium text-chart-2 tabular-nums">{data.youWorked} hrs</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">They worked</span>
              <span className="font-medium text-chart-1 tabular-nums">{data.theyWorked} hrs</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Balance</span>
                <span className={`font-bold tabular-nums ${total > 0 ? "text-chart-3" : total < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {total > 0 ? "+" : ""}{total} hrs
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {getBalanceText(total)}
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" data-testid="chart-worked-hours">
      {/* View mode toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-lg border p-1 bg-muted/30">
          <button
            onClick={() => setViewMode("balance")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === "balance" 
                ? "bg-background shadow-sm text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="button-view-balance"
          >
            Balance
          </button>
          <button
            onClick={() => setViewMode("breakdown")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === "breakdown" 
                ? "bg-background shadow-sm text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="button-view-breakdown"
          >
            Breakdown
          </button>
        </div>
      </div>

      {viewMode === "balance" ? (
        <>
          {/* Balance Cards - Modern grid view */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="balance-cards">
            {formattedData.map((person, index) => (
              <div
                key={person.name}
                className={`relative p-4 rounded-lg border transition-all hover:shadow-md ${
                  person.total > 0 
                    ? "bg-chart-3/5 border-chart-3/20 hover:border-chart-3/40" 
                    : person.total < 0 
                    ? "bg-destructive/5 border-destructive/20 hover:border-destructive/40"
                    : "bg-muted/30 border-muted-foreground/20"
                }`}
                data-testid={`balance-card-${index}`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate" title={person.originalName}>
                      {person.originalName}
                    </p>
                  </div>
                  {getBalanceIcon(person.total)}
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-bold tabular-nums ${
                    person.total > 0 ? "text-chart-3" : person.total < 0 ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    {person.total > 0 ? "+" : ""}{person.total}
                  </span>
                  <span className="text-sm text-muted-foreground">hrs</span>
                </div>
                
                <p className="text-xs text-muted-foreground mt-1">
                  {getBalanceText(person.total)}
                </p>

                {/* Mini breakdown */}
                <div className="flex gap-4 mt-3 pt-3 border-t border-current/10">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-chart-2" />
                    <span className="text-xs text-muted-foreground">You: {person.youWorked}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-chart-1" />
                    <span className="text-xs text-muted-foreground">They: {person.theyWorked}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary stats */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-3" />
              <span className="text-sm text-muted-foreground">
                Owed to you: <span className="font-medium text-foreground">{data.filter(d => d.total > 0).reduce((sum, d) => sum + d.total, 0)} hrs</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-sm text-muted-foreground">
                You owe: <span className="font-medium text-foreground">{Math.abs(data.filter(d => d.total < 0).reduce((sum, d) => sum + d.total, 0))} hrs</span>
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Horizontal Bar Chart - Breakdown view */}
          <div className="hidden sm:block">
            <ResponsiveContainer width="100%" height={Math.max(300, formattedData.length * 50)}>
              <BarChart
                data={formattedData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
              >
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis 
                  type="category" 
                  dataKey="displayName" 
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x={0} stroke="hsl(var(--border))" />
                <Bar 
                  dataKey="theyWorked" 
                  name="They worked" 
                  fill="hsl(var(--chart-1))" 
                  radius={[0, 4, 4, 0]}
                  barSize={16}
                />
                <Bar 
                  dataKey="youWorked" 
                  name="You worked" 
                  fill="hsl(var(--chart-2))" 
                  radius={[0, 4, 4, 0]}
                  barSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Mobile breakdown view */}
          <div className="block sm:hidden space-y-3">
            {formattedData.map((person, index) => (
              <div key={person.name} className="p-3 rounded-lg border bg-card" data-testid={`breakdown-mobile-${index}`}>
                <p className="font-medium text-sm mb-3 truncate">{person.originalName}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-chart-2 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground flex-1">You worked</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-chart-2 rounded-full transition-all"
                        style={{ width: `${(person.youWorked / maxValue) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium tabular-nums w-12 text-right">{person.youWorked} hrs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-chart-1 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground flex-1">They worked</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-chart-1 rounded-full transition-all"
                        style={{ width: `${(person.theyWorked / maxValue) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium tabular-nums w-12 text-right">{person.theyWorked} hrs</span>
                  </div>
                </div>
                <div className="flex justify-end mt-2 pt-2 border-t">
                  <span className={`text-sm font-semibold ${
                    person.total > 0 ? "text-chart-3" : person.total < 0 ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    Balance: {person.total > 0 ? "+" : ""}{person.total} hrs
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-2" />
              <span className="text-sm text-muted-foreground">You worked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-1" />
              <span className="text-sm text-muted-foreground">They worked</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
