// app/ad/[id]/components/AdDetailsTab.tsx
'use client';

import { Tag } from 'lucide-react';

interface Props {
    ad: any;
}

export default function AdDetailsTab({ ad }: Props) {
    const specs = ad.specs || {};

    if (!ad.description?.trim() && Object.keys(specs).length === 0) return null;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm overflow-hidden">
            {/* توضیحات */}
            {ad.description?.trim() && (
                <div className="p-5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">توضیحات</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-7 text-justify whitespace-pre-wrap">
                        {ad.description}
                    </p>
                </div>
            )}

            {/* جدول مشخصات */}
            {Object.keys(specs).length > 0 && (
                <div className="p-5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-primary/60" />
                        مشخصات فنی
                    </h3>
                    <div className="border-t border-gray-100 dark:border-gray-800/50 mx-5 mt-3" />
                    <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700 text-[11px] text-gray-400 dark:text-gray-500">
                                <th className="text-right px-3 py-2.5 font-semibold">ویژگی</th>
                                <th className="text-right px-3 py-2.5 font-semibold">مقدار</th>
                            </tr>
                            </thead>
                            <tbody>
                            {Object.entries(specs).map(([key, value]) => (
                                <tr key={key} className="border-b border-gray-100 dark:border-gray-800/50">
                                    <td className="text-right px-3 py-3 text-gray-500 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-800/30">
                                        {key}
                                    </td>
                                    <td className="text-left px-3 py-3 text-gray-800 dark:text-white font-medium bg-transparent">
                                        {Array.isArray(value) ? value.join('، ') : String(value)}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}