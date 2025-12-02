import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/file-upload";
import { WorkedHoursChart } from "@/components/worked-hours-chart";
import { TradeListTable } from "@/components/trade-list-table";
import { SummaryTable } from "@/components/summary-table";
import type { Trade, PersonSummary, WorkedHoursChartData } from "@shared/schema";

export default function Dashboard() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedName, setSelectedName] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  // Get unique names from trades for the filter dropdown
  const uniqueNames = useMemo(() => {
    const names = new Set<string>();
    trades.forEach((trade) => {
      names.add(trade.person1);
      names.add(trade.person2);
    });
    return Array.from(names).sort();
  }, [trades]);

  // Calculate summary data for each person
  const summaryData = useMemo((): PersonSummary[] => {
    const summaryMap = new Map<string, { youWorked: number; theyWorked: number }>();

    // Initialize all unique names
    uniqueNames.forEach((name) => {
      summaryMap.set(name, { youWorked: 0, theyWorked: 0 });
    });

    // Calculate hours
    trades.forEach((trade) => {
      // Person1 worked for Person2 (Person1's "youWorked" increases)
      const person1Data = summaryMap.get(trade.person1);
      if (person1Data) {
        person1Data.youWorked += trade.hours;
      }

      // Person2 received work from Person1 (Person2's "theyWorked" increases)
      const person2Data = summaryMap.get(trade.person2);
      if (person2Data) {
        person2Data.theyWorked += trade.hours;
      }
    });

    return Array.from(summaryMap.entries())
      .map(([name, data]) => ({
        name,
        youWorked: data.youWorked,
        theyWorked: data.theyWorked,
        total: data.youWorked - data.theyWorked,
      }))
      .sort((a, b) => b.total - a.total);
  }, [trades, uniqueNames]);

  // Calculate chart data
  const chartData = useMemo((): WorkedHoursChartData[] => {
    return summaryData.map((summary) => ({
      name: summary.name,
      theyWorked: summary.theyWorked,
      youWorked: summary.youWorked,
      total: summary.total,
    }));
  }, [summaryData]);

  // Filter data based on selected name
  const filteredTrades = useMemo(() => {
    if (selectedName === "all") return trades;
    return trades.filter(
      (trade) => trade.person1 === selectedName || trade.person2 === selectedName
    );
  }, [trades, selectedName]);

  const filteredSummary = useMemo(() => {
    if (selectedName === "all") return summaryData;
    return summaryData.filter((s) => s.name === selectedName);
  }, [summaryData, selectedName]);

  const filteredChartData = useMemo(() => {
    if (selectedName === "all") return chartData;
    return chartData.filter((c) => c.name === selectedName);
  }, [chartData, selectedName]);

  const handleDataUpload = (uploadedTrades: Trade[]) => {
    setTrades(uploadedTrades);
    setSelectedName("all");
  };

  const hasData = trades.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">
              Shift Trades Tracker
            </h1>
            <div className="flex items-center gap-4 flex-wrap">
              {hasData && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="name-filter" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    Name
                  </Label>
                  <Select value={selectedName} onValueChange={setSelectedName}>
                    <SelectTrigger 
                      id="name-filter" 
                      className="w-[180px]"
                      data-testid="select-name-filter"
                    >
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" data-testid="select-option-all">All</SelectItem>
                      {uniqueNames.map((name) => (
                        <SelectItem key={name} value={name} data-testid={`select-option-${name.replace(/\s+/g, '-').toLowerCase()}`}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <FileUpload 
                onDataUpload={handleDataUpload} 
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {!hasData ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground" data-testid="text-empty-title">
                    No Trade Data Uploaded
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1" data-testid="text-empty-description">
                    Upload an Excel file (.xlsx) to visualize your shift trade data
                  </p>
                </div>
                <FileUpload 
                  onDataUpload={handleDataUpload}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                  variant="large"
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Worked Hours Chart */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold" data-testid="text-chart-title">
                  Worked Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WorkedHoursChart data={filteredChartData} />
              </CardContent>
            </Card>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trade List Table */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold" data-testid="text-tradelist-title">
                    Trade list
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <TradeListTable trades={filteredTrades} />
                </CardContent>
              </Card>

              {/* Summary Table */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold" data-testid="text-summary-title">
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <SummaryTable data={filteredSummary} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
