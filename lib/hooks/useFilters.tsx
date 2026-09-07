'use client';

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

export interface FilterItem {
    id: string;
    label: string;
    value: string;
    type: 'province' | 'city' | 'category' | 'volume' | 'bump';
}

export interface LocationFilters {
    provinceId: string;
    provinceLabel: string;
    provinceCode: string;
    cityId: string;
    cityLabel: string;
    cityCode: string;
}

interface FiltersContextType {
    location: LocationFilters;
    otherFilters: FilterItem[];
    setProvince: (id: string, label: string, code: string) => void;
    setCity: (id: string, label: string, code: string) => void;
    clearLocation: () => void;
    addFilter: (filter: FilterItem) => void;
    removeFilter: (id: string) => void;
    clearFilters: () => void;
    getFilterParams: () => Record<string, any>;
    hasActiveFilters: boolean;
}

const FiltersContext = createContext<FiltersContextType | null>(null);

export function FiltersProvider({ children }: { children: ReactNode }) {
    const [location, setLocation] = useState<LocationFilters>({
        provinceId: '', provinceLabel: '', provinceCode: '',
        cityId: '', cityLabel: '', cityCode: '',
    });

    const [otherFilters, setOtherFilters] = useState<FilterItem[]>([]);

    const setProvince = useCallback((id: string, label: string, code: string) => {
        setLocation(prev => ({
            ...prev,
            provinceId: id, provinceLabel: label, provinceCode: code,
            cityId: '', cityLabel: '', cityCode: '', // ریست شهر وقتی استان عوض میشه
        }));
    }, []);

    const setCity = useCallback((id: string, label: string, code: string) => {
        setLocation(prev => ({
            ...prev,
            cityId: id, cityLabel: label, cityCode: code,
        }));
    }, []);

    const clearLocation = useCallback(() => {
        setLocation({
            provinceId: '', provinceLabel: '', provinceCode: '',
            cityId: '', cityLabel: '', cityCode: '',
        });
    }, []);

    const addFilter = useCallback((filter: FilterItem) => {
        setOtherFilters(prev => {
            const filtered = prev.filter(f => f.type !== filter.type);
            return [...filtered, filter];
        });
    }, []);

    const removeFilter = useCallback((id: string) => {
        setOtherFilters(prev => prev.filter(f => f.id !== id));
    }, []);

    const clearFilters = useCallback(() => {
        setOtherFilters([]);
        clearLocation();
    }, [clearLocation]);

    const getFilterParams = useCallback(() => {
        const params: any = { page: 1, limit: 20, bumpFilter: 'all' };

        if (location.provinceCode) params.provinceCode = location.provinceCode;
        if (location.cityCode) params.cityCode = location.cityCode;

        otherFilters.forEach(filter => {
            if (filter.type === 'category') {
                params.categoryId = filter.value;
                params.categoryType = 'global';
            }
            if (filter.type === 'volume') {
                const q = parseInt(filter.value, 10);
                if (!isNaN(q) && q > 0) params.minQuantity = q;
            }
            if (filter.type === 'bump') {
                params.bumpFilter = filter.value;
            }
        });

        return params;
    }, [location, otherFilters]);

    const hasActiveFilters = useMemo(
        () => !!location.provinceId || otherFilters.length > 0,
        [location, otherFilters]
    );

    return (
        <FiltersContext.Provider value={{
        location, otherFilters, setProvince, setCity, clearLocation,
            addFilter, removeFilter, clearFilters, getFilterParams, hasActiveFilters
    }}>
    {children}
    </FiltersContext.Provider>
);
}

export function useFilters() {
    const context = useContext(FiltersContext);
    if (!context) throw new Error('useFilters must be used within FiltersProvider');
    return context;
}