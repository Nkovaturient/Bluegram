import { useCallback, useMemo, useState } from "react";
import type { Direction, FeedItem, FilterState, RegionType, Significance } from "@/lib/types";

export function useTrendFilter(items: FeedItem[]) {
  const [searchText, setSearchText] = useState("");
  const [significanceTiers, setSignificanceTiers] = useState<Set<Significance>>(new Set());
  const [directions, setDirections] = useState<Set<Direction>>(new Set());
  const [regionTypes, setRegionTypes] = useState<Set<RegionType>>(new Set());
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (searchText.trim() && !item.region.name.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }
      if (significanceTiers.size > 0 && !significanceTiers.has(item.significance)) {
        return false;
      }
      if (directions.size > 0 && !directions.has(item.direction)) {
        return false;
      }
      if (regionTypes.size > 0 && item.regionType && !regionTypes.has(item.regionType)) {
        return false;
      }
      return true;
    });
  }, [items, searchText, significanceTiers, directions, regionTypes]);

  const filterState: FilterState = {
    searchText,
    significanceTiers,
    directions,
    regionTypes,
    showBookmarkedOnly,
  };

  const hasActiveFilters = useMemo(() => {
    return (
      searchText.trim().length > 0 ||
      significanceTiers.size > 0 ||
      directions.size > 0 ||
      regionTypes.size > 0
    );
  }, [searchText, significanceTiers, directions, regionTypes]);

  const clearAllFilters = useCallback(() => {
    setSearchText("");
    setSignificanceTiers(new Set());
    setDirections(new Set());
    setRegionTypes(new Set());
  }, []);

  return {
    filtered,
    filterState,
    hasActiveFilters,
    clearAllFilters,
    setSearchText,
    setSignificanceTiers,
    setDirections,
    setRegionTypes,
    setShowBookmarkedOnly,
  };
}
