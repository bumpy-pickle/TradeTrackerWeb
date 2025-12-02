import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { FileUpload } from "@/components/file-upload";
import { WorkedHoursChart } from "@/components/worked-hours-chart";
import { TradeListTable } from "@/components/trade-list-table";
import { SummaryTable } from "@/components/summary-table";
import { exportTradesToCSV, exportSummaryToCSV, exportAllToCSV } from "@/lib/export-utils";
import { Download, FileSpreadsheet, Table2, FileText, CalendarIcon, Search, X, Users, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Trade, PersonSummary, WorkedHoursChartData } from "@shared/schema";

export default function Dashboard() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedName, setSelectedName] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);

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

  // Filter data based on selected name, date range, and search query
  const filteredTrades = useMemo(() => {
    let filtered = trades;
    
    // Filter by name
    if (selectedName !== "all") {
      filtered = filtered.filter(
        (trade) => trade.person1 === selectedName || trade.person2 === selectedName
      );
    }
    
    // Filter by date range
    if (startDate) {
      filtered = filtered.filter((trade) => {
        const tradeDate = new Date(trade.date);
        return tradeDate >= startDate;
      });
    }
    if (endDate) {
      filtered = filtered.filter((trade) => {
        const tradeDate = new Date(trade.date);
        // Set end date to end of day for inclusive comparison
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        return tradeDate <= endOfDay;
      });
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (trade) =>
          trade.person1.toLowerCase().includes(query) ||
          trade.person2.toLowerCase().includes(query) ||
          trade.date.toLowerCase().includes(query) ||
          trade.hours.toString().includes(query)
      );
    }
    
    return filtered;
  }, [trades, selectedName, startDate, endDate, searchQuery]);

  const filteredSummary = useMemo(() => {
    if (comparisonMode && selectedForComparison.length > 0) {
      return summaryData.filter((s) => selectedForComparison.includes(s.name));
    }
    if (selectedName === "all") return summaryData;
    return summaryData.filter((s) => s.name === selectedName);
  }, [summaryData, selectedName, comparisonMode, selectedForComparison]);

  const filteredChartData = useMemo(() => {
    if (comparisonMode && selectedForComparison.length > 0) {
      return chartData.filter((c) => selectedForComparison.includes(c.name));
    }
    if (selectedName === "all") return chartData;
    return chartData.filter((c) => c.name === selectedName);
  }, [chartData, selectedName, comparisonMode, selectedForComparison]);

  const handleDataUpload = (uploadedTrades: Trade[]) => {
    setTrades(uploadedTrades);
    setSelectedName("all");
    setStartDate(undefined);
    setEndDate(undefined);
    setSearchQuery("");
    setComparisonMode(false);
    setSelectedForComparison([]);
  };
  
  const clearFilters = () => {
    setSelectedName("all");
    setStartDate(undefined);
    setEndDate(undefined);
    setSearchQuery("");
    setComparisonMode(false);
    setSelectedForComparison([]);
  };
  
  const toggleComparison = (name: string) => {
    setSelectedForComparison((prev) => {
      if (prev.includes(name)) {
        return prev.filter((n) => n !== name);
      }
      return [...prev, name];
    });
  };
  
  const hasActiveFilters = selectedName !== "all" || startDate || endDate || searchQuery.trim() || comparisonMode;

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
            <div className="flex items-center gap-2">
              {hasData && (
                <>
                  {/* Comparison Mode Toggle */}
                  <Button
                    variant={comparisonMode ? "default" : "outline"}
                    onClick={() => {
                      setComparisonMode(!comparisonMode);
                      if (comparisonMode) {
                        setSelectedForComparison([]);
                      }
                    }}
                    data-testid="button-comparison-mode"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {comparisonMode ? "Exit Compare" : "Compare"}
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" data-testid="button-export">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => exportAllToCSV(filteredTrades, filteredSummary)}
                        data-testid="menu-export-all"
                      >
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Export All (CSV)
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => exportTradesToCSV(filteredTrades, "trade-list")}
                        data-testid="menu-export-trades"
                      >
                        <Table2 className="w-4 h-4 mr-2" />
                        Export Trade List (CSV)
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => exportSummaryToCSV(filteredSummary, "summary")}
                        data-testid="menu-export-summary"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Export Summary (CSV)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
              <FileUpload 
                onDataUpload={handleDataUpload} 
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </div>
          </div>
          
          {/* Filter Controls Row */}
          {hasData && (
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search trades..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9"
                  data-testid="input-search"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    data-testid="button-clear-search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Name Filter */}
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
              
              {/* Date Range */}
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  From
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[140px] justify-start text-left font-normal"
                      data-testid="button-start-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "MM/dd/yyyy") : <span className="text-muted-foreground">Pick date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      data-testid="calendar-start-date"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  To
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[140px] justify-start text-left font-normal"
                      data-testid="button-end-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "MM/dd/yyyy") : <span className="text-muted-foreground">Pick date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      data-testid="calendar-end-date"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground"
                  data-testid="button-clear-filters"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear filters
                </Button>
              )}
              
              {/* Filter Summary */}
              <div className="text-sm text-muted-foreground ml-auto">
                Showing {filteredTrades.length} of {trades.length} trades
              </div>
            </div>
          )}
          
          {/* Comparison Mode Selector */}
          {hasData && comparisonMode && (
            <div className="mt-4 p-4 border rounded-md bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Select employees to compare</span>
                </div>
                {selectedForComparison.length > 0 && (
                  <Badge variant="secondary" data-testid="badge-comparison-count">
                    {selectedForComparison.length} selected
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {uniqueNames.map((name) => {
                  const isSelected = selectedForComparison.includes(name);
                  return (
                    <Button
                      key={name}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleComparison(name)}
                      className="gap-2"
                      data-testid={`button-compare-${name.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      {name}
                    </Button>
                  );
                })}
              </div>
              {selectedForComparison.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Click on employee names above to add them to the comparison view.
                </p>
              )}
            </div>
          )}
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
