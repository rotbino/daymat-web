// app/admin/industries/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search, Plus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import { IndustryTree } from './components/IndustryTree';
import { IndustryFormModal } from './components/IndustryFormModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';

export interface IndustryNode {
    id: string;
    title: string;
    slug: string;
    path: string;
    level: number;
    parentId: string | null;
    code?: string;
    icon?: string;
    description?: string;
    isActive: boolean;
    children: IndustryNode[];
}

export default function AdminIndustriesPage() {
    const [industries, setIndustries] = useState<IndustryNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // مودال‌ها
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingIndustry, setEditingIndustry] = useState<IndustryNode | null>(null);
    const [parentId, setParentId] = useState<string | null>(null);
    const [deletingIndustry, setDeletingIndustry] = useState<IndustryNode | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // ============================================================
    // واکشی
    // ============================================================
    const fetchIndustries = async () => {
        setLoading(true);
        try {
            const data = await apiService.admin.industries.getTree();
            setIndustries(data || []);
        } catch (error: any) {
            toast.error(error?.message || 'خطا در دریافت صنوف');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchIndustries(); }, []);

    // ============================================================
    // جستجو
    // ============================================================
    const searchInTree = (nodes: IndustryNode[], query: string): IndustryNode[] => {
        if (!query.trim()) return nodes;
        const q = query.toLowerCase();
        return nodes.reduce((acc: IndustryNode[], node) => {
            const matches = node.title.toLowerCase().includes(q) || node.slug.toLowerCase().includes(q);
            const filteredChildren = searchInTree(node.children, q);
            if (matches || filteredChildren.length > 0) acc.push({ ...node, children: filteredChildren });
            return acc;
        }, []);
    };

    const filteredIndustries = useMemo(() => searchInTree(industries, search), [industries, search]);

    // ============================================================
    // باز/بسته کردن
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
        setEditingIndustry(null);
        setParentId(null);
        setIsFormOpen(true);
    };

    const handleAddChild = (parent: IndustryNode) => {
        setEditingIndustry(null);
        setParentId(parent.id);
        setIsFormOpen(true);
    };

    const handleEdit = (ind: IndustryNode) => {
        setEditingIndustry(ind);
        setParentId(null);
        setIsFormOpen(true);
    };

    const handleDelete = (ind: IndustryNode) => {
        setDeletingIndustry(ind);
        setIsDeleteOpen(true);
    };

    const handleFormSubmit = async (data: any) => {
        setFormLoading(true);
        try {
            if (editingIndustry) {
                await apiService.admin.industries.update(editingIndustry.id, data);
                toast.success('صنف با موفقیت ویرایش شد');
            } else {
                await apiService.admin.industries.create({ ...data, parentId });
                toast.success('صنف با موفقیت ایجاد شد');
            }
            setIsFormOpen(false);
            setEditingIndustry(null);
            setParentId(null);
            await fetchIndustries();
        } catch (error: any) {
            toast.error(error?.message || 'خطا در ذخیره صنف');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingIndustry) return;
        setDeleteLoading(true);
        try {
            await apiService.admin.industries.delete(deletingIndustry.id);
            toast.success('صنف با موفقیت حذف شد');
            setIsDeleteOpen(false);
            setDeletingIndustry(null);
            await fetchIndustries();
        } catch (error: any) {
            toast.error(error?.message || 'خطا در حذف صنف');
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
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
            {/* هدر */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-on-surface">مدیریت صنوف</h1>
                    <p className="text-sm text-on-surface-variant mt-1">ایجاد و ویرایش درخت صنوف کسب‌وکارها</p>
                </div>
                <button onClick={handleAddRoot}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-all text-sm font-medium">
                    <Plus className="w-4 h-4" />
                    افزودن صنف اصلی
                </button>
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
            {filteredIndustries.length === 0 ? (
                <div className="text-center py-16 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/50">
                    <Users className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-on-surface mb-2">
                        {search ? 'نتیجه‌ای یافت نشد' : 'هیچ صنفی تعریف نشده'}
                    </h3>
                    <p className="text-sm text-on-surface-variant mb-6">
                        {search ? 'با عبارت جستجو شده، صنفی پیدا نشد' : 'اولین صنف را ایجاد کنید'}
                    </p>
                    {!search && (
                        <button onClick={handleAddRoot}
                                className="px-6 py-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-all text-sm font-medium">
                            ایجاد صنف اصلی
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden">
                    <IndustryTree
                        nodes={filteredIndustries}
                        expandedIds={expandedIds}
                        onToggle={toggleExpand}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onAddChild={handleAddChild}
                    />
                </div>
            )}

            {/* مودال‌ها */}
            <IndustryFormModal
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setEditingIndustry(null); setParentId(null); }}
                onSubmit={handleFormSubmit}
                industry={editingIndustry}
                loading={formLoading}
            />

            <DeleteConfirmModal
                isOpen={isDeleteOpen}
                onClose={() => { setIsDeleteOpen(false); setDeletingIndustry(null); }}
                onConfirm={handleDeleteConfirm}
                industry={deletingIndustry}
                loading={deleteLoading}
            />
        </div>
    );
}