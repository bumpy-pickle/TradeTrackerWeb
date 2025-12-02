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

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = data.find((d) => d.name.startsWith(label.replace("...", "")));
      return (
        <div className="bg-card border rounded-md shadow-lg p-3" data-testid="chart-tooltip">
          <p className="font-medium text-foreground mb-2">{item?.name || label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium text-foreground">{entry.value}</span>
            </div>
          ))}
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
