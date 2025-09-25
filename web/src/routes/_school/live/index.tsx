import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_school/live/")({
  validateSearch: (search: Record<string, any>) => {
    const page = Number.parseInt(search.page || "1");
    return {
      page: Number.isInteger(page) && page > 0 ? page : 1,
      pageSize: 10,
    };
  },
});
