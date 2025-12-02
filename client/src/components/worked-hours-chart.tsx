import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from "recharts";
import type { WorkedHoursChartData } from "@shared/schema";

interface WorkedHoursChartProps {
  data: WorkedHoursChartData[];
}

export function WorkedHoursChart({ data }: WorkedHoursChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] text-muted-foreground" data-testid="chart-empty">
        No data to display
      </div>
    );
  }

  // Truncate long names for display
  const formattedData = data.map((item) => ({
    ...item,
    displayName: item.name.length > 12 ? item.name.substring(0, 10) + "..." : item.name,
  }));

  // Calculate min/max value for Y axis based on actual data
  const allValues = data.flatMap((d) => [d.theyWorked, d.youWorked, d.total]);
  const dataMax = Math.max(...allValues);
  const dataMin = Math.min(...allValues);
  
  // Round to nice values with padding
  const yAxisMax = Math.ceil(dataMax / 100) * 100 + 50;
  const yAxisMin = dataMin < 0 ? Math.floor(dataMin / 100) * 100 - 50 : -50;

  // Custom tooltip with detailed trade information
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = data.find((d) => d.name.startsWith(label.replace("...", "")));
      const theyWorked = payload.find((p: any) => p.dataKey === "theyWorked")?.value || 0;
      const youWorked = payload.find((p: any) => p.dataKey === "youWorked")?.value || 0;
      const total = payload.find((p: any) => p.dataKey === "total")?.value || 0;
      
      // Calculate balance status
      const getBalanceStatus = (balance: number) => {
        if (balance > 0) return { text: "Owed hours", className: "text-chart-3" };
        if (balance < 0) return { text: "Owes hours", className: "text-destructive" };
        return { text: "Even", className: "text-muted-foreground" };
      };
      const balanceStatus = getBalanceStatus(total);
      
      return (
        <div className="bg-card border rounded-md shadow-lg p-4 min-w-[220px]" data-testid="chart-tooltip">
          <p className="font-semibold text-foreground text-base mb-3 border-b pb-2">{item?.name || label}</p>
          <div className="space-y-2">
            {payload.filter((p: any) => p.dataKey !== "total").map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-muted-foreground">{entry.name}</span>
                </div>
                <span className="font-medium text-foreground tabular-nums">{entry.value} hrs</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Net Balance</span>
                <span className={`font-semibold tabular-nums ${balanceStatus.className}`}>
                  {total > 0 ? "+" : ""}{total} hrs
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-xs mt-1">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-medium ${balanceStatus.className}`}>
                  {balanceStatus.text}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" data-testid="chart-worked-hours">
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart
          data={formattedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="displayName"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
            domain={[yAxisMin, yAxisMax]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            iconType="circle"
            iconSize={8}
          />
          <Bar
            dataKey="theyWorked"
            name="How much THEY have worked"
            fill="hsl(var(--chart-1))"
            radius={[2, 2, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="youWorked"
            name="How much YOU have worked"
            fill="hsl(var(--chart-2))"
            radius={[2, 2, 0, 0]}
            maxBarSize={40}
          />
          <Line
            type="monotone"
            dataKey="total"
            name="Total"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--muted-foreground))", r: 4 }}
            activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
