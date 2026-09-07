// app/admin/arm/components/CategorySection/SearchBox.tsx
'use client';

import { Search, X } from 'lucide-react';

export function SearchBox({ value, onChange, placeholder, autoFocus = false }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
}) {
    return (
        <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                autoFocus={autoFocus}
                className="w-full h-11 pr-10 pl-10 bg-gray-50 dark:bg-gray-900/40 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none transition-all focus:border-amber-400 dark:focus:border-amber-500 focus:bg-white dark:focus:bg-gray-800"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-600/60 transition-colors"
                    title="پاک کردن جستجو"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}