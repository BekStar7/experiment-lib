import { queryOptions } from "@tanstack/react-query";
import { experimentAPI } from "@/services/api/experiment.ts";
import type { Experiment } from "@/schemas/experiment.ts";

class ExperimentQueries {
  getStatistics = (id: Experiment["id"]) => {
    return queryOptions({
      queryKey: ["experiments", id, "stats"],
      queryFn: () => experimentAPI.experimentStats(id),
      staleTime: Infinity,
      gcTime: Infinity,
    });
  };
}

export const experimentQueries = new ExperimentQueries();
