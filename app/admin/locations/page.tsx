// app/admin/locations/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Search, Loader2, Plus, Pencil, Trash2, Globe, X, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import { cn } from '@/lib/utils';

interface LocationNode {
    id: string;
    title: string;
    type: string;
    provinceCode?: string;
    cityCode?: string;
    countryCode?: string;
    level: number;
    path: string;
    children?: LocationNode[];
}

export default function AdminLocationsPage() {
    const [countries, setCountries] = useState<LocationNode[]>([]);
    const [loading, setLoading] = useState(true);

    // کشور انتخاب‌شده
    const [selectedCountry, setSelectedCountry] = useState<LocationNode | null>(null);

    // درخت مسیر: country → province → city → district → ...
    const [breadcrumb, setBreadcrumb] = useState<LocationNode[]>([]);
    const [currentChildren, setCurrentChildren] = useState<LocationNode[]>([]);

    // مودال
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingNode, setEditingNode] = useState<LocationNode | null>(null);
    const [formParentId, setFormParentId] = useState<string | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [formType, setFormType] = useState('city');
    const [formCountryCode, setFormCountryCode] = useState('');
    const [formProvinceCode, setFormProvinceCode] = useState('');
    const [formCityCode, setFormCityCode] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    // حذف
    const [deleteTarget, setDeleteTarget] = useState<LocationNode | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // ============================================================
    // واکشی
    // ============================================================
    const fetchCountries = async () => {
        setLoading(true);
        try {
            const data = await apiService.admin.locations.getCountries();
            setCountries(data || []);
        } catch (e: any) { toast.error(e?.message); }
        finally { setLoading(false); }
    };

    const fetchChildren = async (parentId: string) => {
        try {
            const data = await apiService.admin.locations.getChildren(parentId);
            setCurrentChildren(data || []);
        } catch (e: any) { toast.error(e?.message); }
    };

    useEffect(() => { fetchCountries(); }, []);

    // ============================================================
    // انتخاب کشور
    // ============================================================
    const selectCountry = async (country: LocationNode) => {
        setSelectedCountry(country);
        setBreadcrumb([country]);
        await fetchChildren(country.id);
    };

    // کلیک روی یک آیتم برای باز کردن زیرمجموعه‌ها
    const drillDown = async (node: LocationNode) => {
        setBreadcrumb(prev => [...prev, node]);
        await fetchChildren(node.id);
    };

    // کلیک روی breadcrumb
    const goToBreadcrumb = async (index: number) => {
        const newBreadcrumb = breadcrumb.slice(0, index + 1);
        setBreadcrumb(newBreadcrumb);
        const last = newBreadcrumb[newBreadcrumb.length - 1];
        await fetchChildren(last.id);
    };

    // ============================================================
    // CRUD
    // ============================================================
    const openCreate = (parentId: string | null) => {
        setEditingNode(null);
        setFormParentId(parentId);
        setFormTitle('');
        const parent = parentId ? breadcrumb.find(b => b.id === parentId) || breadcrumb[breadcrumb.length - 1] : null;
        setFormType(parent?.type === 'country' ? 'province' : parent?.type === 'province' ? 'city' : parent?.type === 'city' ? 'district' : 'region');
        setFormCountryCode(parent?.countryCode || selectedCountry?.countryCode || '');
        setFormProvinceCode(parent?.provinceCode || '');
        setFormCityCode(parent?.cityCode || '');
        setIsFormOpen(true);
    };

    const openEdit = (node: LocationNode) => {
        setEditingNode(node);
        setFormParentId(null);
        setFormTitle(node.title);
        setFormType(node.type);
        setFormCountryCode(node.countryCode || '');
        setFormProvinceCode(node.provinceCode || '');
        setFormCityCode(node.cityCode || '');
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formTitle.trim()) return;
        setFormLoading(true);
        try {
            if (editingNode) {
                await apiService.admin.locations.update(editingNode.id, {
                    title: formTitle, type: formType, countryCode: formCountryCode, provinceCode: formProvinceCode, cityCode: formCityCode,
                });
                toast.success('ویرایش شد');
            } else {
                await apiService.admin.locations.create({
                    title: formTitle, type: formType, parentId: formParentId,
                    countryCode: formCountryCode, provinceCode: formProvinceCode, cityCode: formCityCode,
                });
                toast.success('ایجاد شد');
            }
            setIsFormOpen(false);
            const last = breadcrumb[breadcrumb.length - 1];
            if (last) await fetchChildren(last.id);
            else await fetchCountries();
        } catch (e: any) { toast.error(e?.message); }
        finally { setFormLoading(false); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await apiService.admin.locations.delete(deleteTarget.id);
            toast.success('حذف شد');
            setDeleteTarget(null);
            const last = breadcrumb[breadcrumb.length - 1];
            if (last) await fetchChildren(last.id);
        } catch (e: any) { toast.error(e?.message); }
        finally { setDeleteLoading(false); }
    };

    // ============================================================
    // نوع گره
    // ============================================================
    const typeLabel = (type: string) => {
        const map: any = { country: 'کشور', province: 'استان', city: 'شهر', district: 'منطقه', region: 'ناحیه' };
        return map[type] || type;
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

    const lastBreadcrumb = breadcrumb[breadcrumb.length - 1];

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto pb-24">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-on-surface">مناطق جغرافیایی</h1>
                    <p className="text-sm text-on-surface-variant mt-1">{countries.length} کشور</p>
                </div>
                <button onClick={() => openCreate(null)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-medium">
                    <Plus className="w-4 h-4" />افزودن کشور
                </button>
            </div>

            {/* ══════════════════════════════════════ */}
            {/* نوار کشورها (همیشه بالاست) */}
            {/* ══════════════════════════════════════ */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-3 mb-4">
                <p className="text-[10px] text-on-surface-variant mb-2 font-medium">کشورها</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {countries.map(c => (
                        <button key={c.id} onClick={() => selectCountry(c)}
                                className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border",
                                    selectedCountry?.id === c.id ? "bg-primary text-on-primary border-primary" : "bg-surface border-outline-variant/50 hover:border-primary/30")}>
                            <Globe className="w-4 h-4" />
                            {c.title}
                            <span className="text-[10px] opacity-70">{c.countryCode}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ══════════════════════════════════════ */}
            {/* breadcrumb + محتوا */}
            {/* ══════════════════════════════════════ */}
            {selectedCountry ? (
                <>
                    {/* breadcrumb */}
                    <div className="flex items-center gap-1.5 text-sm mb-3 flex-wrap">
                        {breadcrumb.map((item, i) => (
                            <React.Fragment key={item.id}>
                                {i > 0 && <ChevronLeft className="w-3.5 h-3.5 text-on-surface-variant/40" />}
                                <button onClick={() => goToBreadcrumb(i)}
                                        className={cn("px-2 py-1 rounded-lg hover:bg-surface-container-low transition-colors",
                                            i === breadcrumb.length - 1 ? "text-primary font-semibold" : "text-on-surface-variant")}>
                                    {item.title}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>

                    {/* محتوا */}
                    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden">
                        <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
                            <h3 className="text-sm font-semibold">
                                {lastBreadcrumb?.type === 'country' ? 'استان‌ها' :
                                    lastBreadcrumb?.type === 'province' ? 'شهرها' :
                                        lastBreadcrumb?.type === 'city' ? 'مناطق' : 'زیرمجموعه‌ها'}
                                <span className="text-xs text-on-surface-variant mr-2">({currentChildren.length})</span>
                            </h3>
                            <button onClick={() => openCreate(lastBreadcrumb?.id || null)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary text-on-primary rounded-lg hover:bg-primary/90">
                                <Plus className="w-3.5 h-3.5" />
                                افزودن {lastBreadcrumb?.type === 'country' ? 'استان' : lastBreadcrumb?.type === 'province' ? 'شهر' : 'زیرمجموعه'}
                            </button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto">
                            {currentChildren.length === 0 ? (
                                <div className="text-center py-12 text-sm text-on-surface-variant">موردی یافت نشد</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-4">
                                    {currentChildren.map(node => (
                                        <div key={node.id}
                                             className="flex items-center gap-2 px-3 py-2.5 bg-surface rounded-lg border border-outline-variant/20 text-sm hover:border-primary/30 transition-all group cursor-pointer"
                                             onClick={() => drillDown(node)}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                                            <span className="truncate flex-1">{node.title}</span>
                                            <span className="text-[10px] text-on-surface-variant/40 bg-surface-container-high px-1.5 py-0.5 rounded-full flex-shrink-0">
                                                {typeLabel(node.type)}
                                            </span>
                                            {/* دکمه‌ها */}
                                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => openEdit(node)} className="p-1 hover:bg-primary/10 hover:text-primary rounded"><Pencil className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => setDeleteTarget(node)} className="p-1 hover:bg-error/10 hover:text-error rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center py-16 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/50">
                    <Globe className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
                    <p className="text-sm text-on-surface-variant">یک کشور را انتخاب کنید</p>
                </div>
            )}

            {/* ══════════════════════════════════════ */}
            {/* مودال فرم */}
            {/* ══════════════════════════════════════ */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl border border-outline-variant">
                        <div className="flex items-center justify-between px-5 py-4 border-b">
                            <h3 className="text-lg font-semibold">{editingNode ? 'ویرایش' : 'افزودن'}</h3>
                            <button onClick={() => setIsFormOpen(false)} className="p-1.5 hover:bg-surface-container-high rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="text-sm font-medium block mb-1.5">عنوان <span className="text-error">*</span></label>
                                <input value={formTitle} onChange={e => setFormTitle(e.target.value)} required
                                       className="w-full bg-surface-container-lowest border border-outline rounded-xl h-11 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                            </div>
                            {!editingNode && (
                                <div>
                                    <label className="text-sm font-medium block mb-1.5">نوع</label>
                                    <select value={formType} onChange={e => setFormType(e.target.value)}
                                            className="w-full bg-surface-container-lowest border border-outline rounded-xl h-11 px-3 text-sm">
                                        <option value="country">کشور</option>
                                        <option value="province">استان</option>
                                        <option value="city">شهر</option>
                                        <option value="district">منطقه</option>
                                        <option value="region">ناحیه</option>
                                    </select>
                                </div>
                            )}
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs block mb-1">کد کشور</label>
                                    <input value={formCountryCode} onChange={e => setFormCountryCode(e.target.value)}
                                           className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-2 text-xs" />
                                </div>
                                <div>
                                    <label className="text-xs block mb-1">کد استان</label>
                                    <input value={formProvinceCode} onChange={e => setFormProvinceCode(e.target.value)}
                                           className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-2 text-xs" />
                                </div>
                                <div>
                                    <label className="text-xs block mb-1">کد شهر</label>
                                    <input value={formCityCode} onChange={e => setFormCityCode(e.target.value)}
                                           className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-2 text-xs" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsFormOpen(false)}
                                        className="flex-1 h-11 border border-outline rounded-xl text-sm">انصراف</button>
                                <button type="submit" disabled={formLoading}
                                        className="flex-1 h-11 bg-primary text-on-primary rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                                    {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}{editingNode ? 'ذخیره' : 'ایجاد'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════ */}
            {/* مودال حذف */}
            {/* ══════════════════════════════════════ */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-surface w-full max-w-sm rounded-2xl shadow-2xl border border-outline-variant">
                        <div className="flex items-center justify-between px-5 py-4 border-b">
                            <h3 className="text-lg font-semibold">تأیید حذف</h3>
                            <button onClick={() => setDeleteTarget(null)} className="p-1.5 hover:bg-surface-container-high rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <p className="text-sm">حذف <span className="font-semibold">«{deleteTarget.title}»</span>؟</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteTarget(null)} className="flex-1 h-11 border border-outline rounded-xl text-sm">انصراف</button>
                                <button onClick={handleDelete} disabled={deleteLoading}
                                        className="flex-1 h-11 bg-error text-on-error rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                                    {deleteLoading && <Loader2 className="w-4 h-4 animate-spin" />}حذف
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}