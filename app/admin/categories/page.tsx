// app/admin/categories/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {Tags, Search, Plus, Loader2, RefreshCw, ChevronRight, AlertCircle, Layers} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import { CategoryTree } from './components/CategoryTree';
import { CategoryFormModal } from './components/CategoryFormModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { BatchUnitAssigner } from './components/BatchUnitAssigner';
export interface CategoryNode {
    id: string;
    title: string;
    slug: string;
    path: string;
    level: number;
    parentId: string | null;
    icon?: string;
    description?: string;
    example?: string;
    defaultMinQuantity?: number;
    isActive: boolean;
    children: CategoryNode[];
}

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<CategoryNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // مودال‌ها
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryNode | null>(null);
    const [parentId, setParentId] = useState<string | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<CategoryNode | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [isBatchUnitOpen, setIsBatchUnitOpen] = useState(false);
    // ============================================================
    // واکشی
    // ============================================================
    const fetchCategories = async () => {
        setLoading(true);
        try {
            const data = await apiService.admin.categories.getAll();
            setCategories(data || []);
            // باز کردن خودکار سطح اول
            const firstLevelIds = new Set<string>();
            (data || []).forEach((c: CategoryNode) => firstLevelIds.add(c.id));
            //setExpandedIds(firstLevelIds);
            setExpandedIds(new Set());
        } catch (error: any) {
            toast.error(error?.message || 'خطا در دریافت دسته‌بندی‌ها');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => { fetchCategories(); }, []);

    // ============================================================
    // جستجوی بازگشتی در درخت
    // ============================================================
    const searchInTree = (nodes: CategoryNode[], query: string): CategoryNode[] => {
        if (!query.trim()) return nodes;
        const q = query.toLowerCase();
        return nodes.reduce((acc: CategoryNode[], node) => {
            const matches = node.title.toLowerCase().includes(q) || node.slug.toLowerCase().includes(q);
            const filteredChildren = searchInTree(node.children, q);
            if (matches || filteredChildren.length > 0) {
                acc.push({ ...node, children: filteredChildren });
            }
            return acc;
        }, []);
    };

    const filteredCategories = useMemo(() => searchInTree(categories, search), [categories, search]);

    // ============================================================
    // باز و بسته کردن
    // ============================================================
    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    // ============================================================
    // CRUD handlers
    // ============================================================
    const handleAddRoot = () => {
        setEditingCategory(null);
        setParentId(null);
        setIsFormOpen(true);
    };

    const handleAddChild = (parent: CategoryNode) => {
        setEditingCategory(null);
        setParentId(parent.id);
        setIsFormOpen(true);
    };

    const handleEdit = (cat: CategoryNode) => {
        setEditingCategory(cat);
        setParentId(null);
        setIsFormOpen(true);
    };

    const handleDelete = (cat: CategoryNode) => {
        setDeletingCategory(cat);
        setIsDeleteOpen(true);
    };

    const handleFormSubmit = async (data: any) => {
        setFormLoading(true);
        try {
            if (editingCategory) {
                await apiService.admin.categories.update(editingCategory.id, data);
                toast.success('دسته‌بندی با موفقیت ویرایش شد');
            } else {
                await apiService.admin.categories.create({ ...data, parentId });
                toast.success('دسته‌بندی با موفقیت ایجاد شد');
            }
            setIsFormOpen(false);
            setEditingCategory(null);
            setParentId(null);
            await fetchCategories();
        } catch (error: any) {
            toast.error(error?.message || 'خطا در ذخیره دسته‌بندی');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingCategory) return;
        setDeleteLoading(true);
        try {
            await apiService.admin.categories.delete(deletingCategory.id);
            toast.success('دسته‌بندی با موفقیت حذف شد');
            setIsDeleteOpen(false);
            setDeletingCategory(null);
            await fetchCategories();
        } catch (error: any) {
            toast.error(error?.message || 'خطا در حذف دسته‌بندی');
        } finally {
            setDeleteLoading(false);
        }
    };

    // ============================================================
    // لودینگ
    // ============================================================
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                    <p className="mt-4 text-sm text-on-surface-variant">در حال بارگذاری...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
            {/* هدر */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-on-surface">مدیریت گروه‌های کالا</h1>
                    <p className="text-sm text-on-surface-variant">ایجاد و ویرایش دسته‌بندی‌های کالا و خدمات</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsBatchUnitOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-on-secondary rounded-xl hover:bg-secondary/90 transition-all text-sm font-medium"
                    >
                        <Layers className="w-4 h-4" />
                        تخصیص سریع واحدها
                    </button>
                    <button
                        onClick={handleAddRoot}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-all text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        افزودن گروه اصلی
                    </button>
                </div>
            </div>

            {/* جستجو */}
            <div className="relative mb-6">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="جستجوی نام یا slug..."
                    className="w-full bg-surface-container-lowest border border-outline rounded-xl h-11 pr-10 pl-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
            </div>

            {/* درخت */}
            {filteredCategories.length === 0 ? (
                <div className="text-center py-16 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/50">
                    <Tags className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-on-surface mb-2">
                        {search ? 'نتیجه‌ای یافت نشد' : 'هیچ گروه کالایی تعریف نشده'}
                    </h3>
                    <p className="text-sm text-on-surface-variant mb-6">
                        {search ? 'با عبارت جستجو شده، گروه کالایی پیدا نشد' : 'اولین گروه کالا را ایجاد کنید'}
                    </p>
                    {!search && (
                        <button onClick={handleAddRoot}
                                className="px-6 py-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-all text-sm font-medium">
                            ایجاد گروه اصلی
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden">
                    <CategoryTree
                        nodes={filteredCategories}
                        expandedIds={expandedIds}
                        onToggle={toggleExpand}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onAddChild={handleAddChild}
                    />
                </div>
            )}

            {/* مودال‌ها */}
            <CategoryFormModal
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setEditingCategory(null); setParentId(null); }}
                onSubmit={handleFormSubmit}
                category={editingCategory}
                loading={formLoading}
            />

            <DeleteConfirmModal
                isOpen={isDeleteOpen}
                onClose={() => { setIsDeleteOpen(false); setDeletingCategory(null); }}
                onConfirm={handleDeleteConfirm}
                category={deletingCategory}
                loading={deleteLoading}
            />

            {isBatchUnitOpen && (
                <BatchUnitAssigner
                    isOpen={isBatchUnitOpen}
                    onClose={() => setIsBatchUnitOpen(false)}
                />
            )}
        </div>
    );
}