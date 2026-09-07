// app/admin/categories/components/DeleteConfirmModal.tsx
'use client';

import React from 'react';
import { X, AlertTriangle, Loader2, Folder, Package } from 'lucide-react';
import { CategoryNode } from '../page';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    category: CategoryNode | null;
    loading: boolean;
}

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, category, loading }: DeleteConfirmModalProps) {
    if (!isOpen || !category) return null;

    const hasChildren = category.children && category.children.length > 0;
    const isLeaf = !hasChildren;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Icon */}
                <div className="flex justify-center pt-8">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 pt-5 pb-2 text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">تأیید حذف</h3>

                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className={isLeaf ? "p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg" : "p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg"}>
                            {isLeaf ? <Package className="w-4 h-4 text-emerald-500" /> : <Folder className="w-4 h-4 text-blue-500" />}
                        </div>
                        <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">{category.title}</span>
                    </div>

                    {hasChildren && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 mb-3">
                            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                                ⚠️ این گروه دارای {category.children!.length} زیرمجموعه است
                            </p>
                        </div>
                    )}

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        این عملیات غیرقابل بازگشت است.
                    </p>
                </div>

                {/* Actions */}
                <div className="p-6 pt-4 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 h-12 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                    >
                        انصراف
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        بله، حذف شود
                    </button>
                </div>
            </div>
        </div>
    );
}