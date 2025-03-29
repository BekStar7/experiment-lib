import React from "react";
import { ExperimentClientProviderConfig } from "@/types";
import { ExperimentClient } from "@/core/experiment-client";
import { StorageManager } from "@/core/storage-manager";

type ExperimentContextType = ExperimentClient;

const ExperimentContext = React.createContext<
  ExperimentContextType | undefined
>(undefined);

type ExperimentClientProviderProps =
  React.PropsWithChildren<ExperimentClientProviderConfig>;

const ExperimentClientProvider: React.FC<ExperimentClientProviderProps> = ({
  children,
  apiKey,
  host,
  storage = localStorage,
  configs,
}) => {
  const client = new ExperimentClient({
    host,
    apiKey,
    storageManager: new StorageManager(storage),
    configs,
  });

  client.initializeUser();

  const memoizedClient = React.useMemo(() => client, [client]);

  return (
    <ExperimentContext.Provider value={memoizedClient}>
      {children}
    </ExperimentContext.Provider>
  );
};

const useExperimentClient = () => {
  const context = React.useContext(ExperimentContext);
  if (!context) {
    throw new Error(
      "useExperimentClient must be used within a ExperimentProvider",
    );
  }
  return context;
};

export { ExperimentClientProvider, useExperimentClient };
