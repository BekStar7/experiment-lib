import { experimentQueries } from "@/services/queries/experiment.ts";
import { useQuery } from "@tanstack/react-query";
import type { Experiment } from "@/schemas/experiment.ts";
import React from "react";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/features/ui/chart.tsx";
import { Cell, Pie, PieChart } from "recharts";
import { Button } from "@/features/ui/button.tsx";
import { RotateCcw } from "lucide-react";

type ExperimentStatsProps = {
  experimentId: Experiment["id"];
};

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const ExperimentStats: React.FC<ExperimentStatsProps> = ({ experimentId }) => {
  const { data, isLoading, error, refetch, fetchStatus } = useQuery(
    experimentQueries.getStatistics(experimentId),
  );

  const processedData = React.useMemo(() => {
    if (!data || !data.stats) return [];

    return Object.entries(data.stats).map(([name, value]) => ({
      name,
      value,
    }));
  }, [data]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const chartConfig: ChartConfig = {};

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold">Statistics</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          status={fetchStatus === "fetching" ? "pending" : "idle"}
        >
          <RotateCcw className="h-4 w-4" />
          <span className="sr-only">Refresh</span>
        </Button>
      </div>
      {processedData.length > 0 ? (
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px] pb-0 [&_.recharts-pie-label-text]:fill-foreground"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={processedData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="var(--muted-foreground)"
              label
            >
              {processedData.map((entry, index) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      ) : (
        <div className="text-center">No data</div>
      )}
    </div>
  );
};

export default ExperimentStats;
