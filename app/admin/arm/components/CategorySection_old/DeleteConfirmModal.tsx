// app/admin/arm/components/CategorySection/DeleteConfirmModal.tsx
'use client';

import { Trash2, AlertTriangle } from 'lucide-react';
import { ModalShell } from './ModalShell';
import type { DeleteConfirmData } from './types';
import { toFa } from './utils';

export function DeleteConfirmModal({ open, data, descendantCount, onClose, onConfirm }: {
    open: boolean;
    data: DeleteConfirmData | null;
    descendantCount: number;
    onClose: () => void;
    onConfirm: (nodeId: string, tree: 'scope' | 'final') => void;
}) {
    if (!data) return null;

    return (
        <ModalShell
            open={open}
            onClose={onClose}
            title="حذف دسته‌بندی"
            icon={<div className="p-2.5 bg-red-50 dark:bg-red-900/30 rounded-xl text-red-500"><Trash2 className="w-5 h-5" /></div>}
            maxWidth="max-w-md"
            footer={
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        انصراف
                    </button>
                    <button
                        onClick={() => onConfirm(data.nodeId, data.tree)}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white shadow-sm transition-colors flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        حذف قطعی
                    </button>
                </div>
            }
        >
            <div className="text-center py-2">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-red-500" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    آیا از حذف <span className="font-bold">«{data.title}»</span> مطمئن هستید؟
                </p>
                {descendantCount > 0 && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs font-medium flex items-center gap-2 justify-center">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        {toFa(descendantCount)} زیرمجموعه این نود نیز حذف خواهند شد
                    </div>
                )}
                {data.tree === 'final' && (
                    <p className="mt-2 text-[11px] text-gray-400">
                        این عملیات ساختار نمایشی درخت نهایی بازار را تغییر می‌دهد
                    </p>
                )}
            </div>
        </ModalShell>
    );
}