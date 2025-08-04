// hooks/usePatents.ts - Patent-related React Query hooks
import { useQuery } from "@tanstack/react-query";
import { fetchPatents } from "../lib/api";

// Query hooks
export const usePatents = () =>
  useQuery({
    queryKey: ["patents"],
    queryFn: fetchPatents,
  }); 