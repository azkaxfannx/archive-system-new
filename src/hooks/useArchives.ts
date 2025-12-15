// hooks/useArchives.ts - Backend now handles calculated status filtering
import useSWR from "swr";
import { ArchiveRecord } from "@/types/archive";

interface UseArchivesParams {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  status?: string;
  filters?: Record<string, string>;
  startMonth?: string;
  endMonth?: string;
  year?: string;
  excludeSerahTerima?: boolean;
}

interface ArchiveResponse {
  data: ArchiveRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const fetcher = async (url: string) => {
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

export function useArchives(params: UseArchivesParams) {
  const {
    page,
    limit,
    search = "",
    sort = "tanggal",
    order = "desc",
    status = "",
    filters = {},
    startMonth = "",
    endMonth = "",
    year = "",
    excludeSerahTerima = false,
  } = params;

  // Build query parameters
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
    sort,
    order,
    status, // Backend will now filter by CALCULATED status, not DB status
  });

  if (excludeSerahTerima) {
    queryParams.append("excludeSerahTerima", "true");
  }

  if (year) {
    queryParams.append("year", year);
  }
  if (startMonth) {
    queryParams.append("startMonth", startMonth);
  }
  if (endMonth) {
    queryParams.append("endMonth", endMonth);
  }

  // Add column filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      queryParams.append(`filter[${key}]`, value);
    }
  });

  const url = `/api/archives?${queryParams.toString()}`;

  const { data, error, mutate, isValidating } = useSWR<ArchiveResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    archives: data?.data || [],
    pagination: data?.pagination || null,
    loading: !error && !data,
    error,
    mutate,
    isValidating,
  };
}
