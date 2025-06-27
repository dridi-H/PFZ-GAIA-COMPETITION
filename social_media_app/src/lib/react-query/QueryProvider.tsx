import React from "react";
// Remove this import:
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevent refetching on window focus to avoid issues when switching tabs
      refetchOnWindowFocus: false,
      // Also reduce refetching on reconnect to prevent unnecessary updates
      refetchOnReconnect: false,
      // Keep data fresh for reasonable time
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Remove this line: */}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
};