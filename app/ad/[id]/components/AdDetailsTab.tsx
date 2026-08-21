// app/ad/[id]/components/AdDetailsTab.tsx
'use client';

import { Tag } from 'lucide-react';

interface AdDetailsTabProps {
    ad: any;
}

export default function AdDetailsTab({ ad }: AdDetailsTabProps) {
    const specs = ad.specs || {};

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 shadow-sm overflow-hidden">
            {ad.description?.trim() && (
                <div className="p-5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        توضیحات
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-7 text-justify whitespace-pre-wrap">
                        {ad.description}
                    </p>
                </div>
            )}

            {ad.description?.trim() && Object.keys(specs).length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-800/50 mx-5" />
            )}

            {Object.keys(specs).length > 0 && (
                <div className="p-5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-primary" />
                        مشخصات فنی
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(specs).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2">
                                <span className="text-sm text-gray-400 dark:text-gray-500">{key}</span>
                                <span className="text-sm font-medium text-gray-800 dark:text-white">
                                    {Array.isArray(value) ? value.join('، ') : String(value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}