import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { Trade } from "@shared/schema";

interface TradeListTableProps {
  trades: Trade[];
}

type SortField = "person1" | "date" | "hours" | "person2";
type SortDirection = "asc" | "desc";

export function TradeListTable({ trades }: TradeListTableProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "person1":
          comparison = a.person1.localeCompare(b.person1);
          break;
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "hours":
          comparison = a.hours - b.hours;
          break;
        case "person2":
          comparison = a.person2.localeCompare(b.person2);
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [trades, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 opacity-0 group-hover:opacity-30" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (trades.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground" data-testid="table-empty-trades">
        No trades to display
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]" data-testid="table-trade-list">
      <Table>
        <TableHeader className="sticky top-0 bg-card z-10">
          <TableRow className="hover:bg-transparent">
            <TableHead
              className="cursor-pointer group font-semibold"
              onClick={() => handleSort("person1")}
              data-testid="header-person1"
            >
              <div className="flex items-center gap-1">
                Person 1
                <SortIcon field="person1" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer group font-semibold"
              onClick={() => handleSort("date")}
              data-testid="header-date"
            >
              <div className="flex items-center gap-1">
                Date
                <SortIcon field="date" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer group font-semibold text-center"
              onClick={() => handleSort("hours")}
              data-testid="header-hours"
            >
              <div className="flex items-center justify-center gap-1">
                Hours
                <SortIcon field="hours" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer group font-semibold"
              onClick={() => handleSort("person2")}
              data-testid="header-person2"
            >
              <div className="flex items-center gap-1">
                Person 2
                <SortIcon field="person2" />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTrades.map((trade, index) => (
            <TableRow
              key={trade.id}
              className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
              data-testid={`row-trade-${index}`}
            >
              <TableCell className="font-medium" data-testid={`cell-person1-${index}`}>
                {trade.person1}
              </TableCell>
              <TableCell data-testid={`cell-date-${index}`}>
                {formatDate(trade.date)}
              </TableCell>
              <TableCell className="text-center font-medium" data-testid={`cell-hours-${index}`}>
                {trade.hours}
              </TableCell>
              <TableCell data-testid={`cell-person2-${index}`}>
                {trade.person2}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
