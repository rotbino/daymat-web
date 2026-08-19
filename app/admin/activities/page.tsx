// app/admin/activities/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Search, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import { ActivityTree } from './components/ActivityTree';
import { ActivityFormModal } from './components/ActivityFormModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';

export interface ActivityNode {
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
    children: ActivityNode[];
}

export default function AdminActivitiesPage() {
    const [activities, setActivities] = useState<ActivityNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<ActivityNode | null>(null);
    const [parentId, setParentId] = useState<string | null>(null);
    const [deletingActivity, setDeletingActivity] = useState<ActivityNode | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const data = await apiService.admin.activities.getTree();
            setActivities(data || []);
        } catch (error: any) {
            toast.error(error?.message || 'خطا در دریافت فعالیت‌ها');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchActivities(); }, []);

    const searchInTree = (nodes: ActivityNode[], query: string): ActivityNode[] => {
        if (!query.trim()) return nodes;
        const q = query.toLowerCase();
        return nodes.reduce((acc: ActivityNode[], node) => {
            const matches = node.title.toLowerCase().includes(q) || node.slug.toLowerCase().includes(q);
            const filteredChildren = searchInTree(node.children, q);
            if (matches || filteredChildren.length > 0) acc.push({ ...node, children: filteredChildren });
            return acc;
        }, []);
    };

    const filteredActivities = useMemo(() => searchInTree(activities, search), [activities, search]);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleAddRoot = () => { setEditingActivity(null); setParentId(null); setIsFormOpen(true); };
    const handleAddChild = (p: ActivityNode) => { setEditingActivity(null); setParentId(p.id); setIsFormOpen(true); };
    const handleEdit = (a: ActivityNode) => { setEditingActivity(a); setParentId(null); setIsFormOpen(true); };
    const handleDelete = (a: ActivityNode) => { setDeletingActivity(a); setIsDeleteOpen(true); };

    const handleFormSubmit = async (data: any) => {
        setFormLoading(true);
        try {
            if (editingActivity) {
                await apiService.admin.activities.update(editingActivity.id, data);
                toast.success('فعالیت ویرایش شد');
            } else {
                await apiService.admin.activities.create({ ...data, parentId });
                toast.success('فعالیت ایجاد شد');
            }
            setIsFormOpen(false);
            setEditingActivity(null);
            setParentId(null);
            fetchActivities();
        } catch (error: any) {
            toast.error(error?.message || 'خطا');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingActivity) return;
        setDeleteLoading(true);
        try {
            await apiService.admin.activities.delete(deletingActivity.id);
            toast.success('حذف شد');
            setIsDeleteOpen(false);
            setDeletingActivity(null);
            fetchActivities();
        } catch (error: any) {
            toast.error(error?.message || 'خطا');
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-on-surface">مدیریت فعالیت‌ها</h1>
                    <p className="text-sm text-on-surface-variant mt-1">درخت فعالیت‌های قابل انتخاب برای بازوها</p>
                </div>
                <button onClick={handleAddRoot} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-all text-sm font-medium">
                    <Plus className="w-4 h-4" />افزودن فعالیت اصلی
                </button>
            </div>

            <div className="relative mb-6">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..."
                       className="w-full bg-surface-container-lowest border border-outline rounded-xl h-11 pr-10 pl-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>

            {filteredActivities.length === 0 ? (
                <div className="text-center py-16 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/50">
                    <Activity className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">{search ? 'نتیجه‌ای یافت نشد' : 'هیچ فعالیتی تعریف نشده'}</h3>
                </div>
            ) : (
                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden">
                    <ActivityTree nodes={filteredActivities} expandedIds={expandedIds} onToggle={toggleExpand}
                                  onEdit={handleEdit} onDelete={handleDelete} onAddChild={handleAddChild} />
                </div>
            )}

            <ActivityFormModal isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setEditingActivity(null); setParentId(null); }}
                               onSubmit={handleFormSubmit} activity={editingActivity} loading={formLoading} />

            <DeleteConfirmModal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setDeletingActivity(null); }}
                                onConfirm={handleDeleteConfirm} activity={deletingActivity} loading={deleteLoading} />
        </div>
    );
}