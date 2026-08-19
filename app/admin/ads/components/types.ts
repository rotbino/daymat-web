// app/admin/ads/components/types.ts
export type SortField = 'createdAt' | 'unitPrice' | 'viewCount' | 'callCount' | 'expiresAt';

export interface CategoryNode {
    id: string; title: string; path: string; level: number; parentId: string | null;
    children: CategoryNode[];
}

export interface ArmOption {
    id: string; slug: string; name: string; colorPrimary: string;
}

export interface AdFilters {
    search: string;
    statusFilter: string;
    armFilter: string;
    armName: string;
    categoryFilter: string;
    minPrice: string;
    maxPrice: string;
    cityFilter: string;
    countryCode?: string;   // ✅
    provinceCode?: string;  // ✅
    isBumpedFilter: string;
    startDate: any;
    endDate: any;
}