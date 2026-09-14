// app/my-inquiries/page.tsx
// پنل مدیریت اعلام خرید — قرینهٔ کنسول کاتالوگ فروش (/my-catalogs):
//   انتخاب کسب‌وکار در /inquiries/new انجام می‌شود و کاربر مستقیم به همین پنل می‌آید؛
//   اقلام قلم‌به‌قلم از همین‌جا اضافه می‌شوند (هر بار یک کالا + تیک اعلام خرید).
//   تب‌ها: اقلام | پیشنهادها | تامین‌کنندگان | تنظیمات | انتشار — سوییچر دو-محصولی بالای پنل.
// ✅ تب «تامین‌کنندگان»: شبکهٔ خرید↔فروش — دعوت/تایید تامین‌کننده‌های اعلام خرید
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { setCurrentInquiry } from '@/lib/store/slices/catalogSlice';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api/apiService';
import {
    useMyInquiries, useInquiry, useInquiryOffers, useInquiryMembers,
    useAddInquiryItem, useUpdateInquiryItem, useRemoveInquiryItem,
    useUpdateInquiry, useUpdateOfferStatus,
} from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import NavTabs from '@/app/home/nav/NavTabs';
import InquiryIdentityBar from './components/InquiryIdentityBar';
import InquiryConsoleTabs from './components/ConsoleTabs';
import ItemsTab from './components/ItemsTab';
import OffersTab from './components/OffersTab';
import MembersTab from './components/MembersTab';
import SettingsTab from './components/SettingsTab';
import PublishTab from './components/PublishTab';
import AddItemSheet from './components/AddItemSheet';
import UnitSettingsModal from '@/app/ad/components/UnitSettingsModal';
import ShareKitModal from '@/components/profile/ShareKitModal';
import VisitCardModal from '@/components/profile/VisitCardModal';
import { useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Package, MessageSquareText, Settings, Globe, Plus, Loader2, PackageSearch, Handshake } from 'lucide-react';
import type { InquiryItem } from '@/lib/api/apiTypes';

export default function MyInquiriesPage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const { isAuthenticated, _hydrated } = useSelector((s: RootState) => s.auth) as any;
    const hydrated = _hydrated !== false;
    // «اعلام خرید کارنت» — پرسیست؛ با رفرش هم سرجاش می‌ماند
    const currentInquiryId = useSelector((s: RootState) => s.catalog.currentInquiryId);

    const [tab, setTab] = useState<string>('items');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editItem, setEditItem] = useState<InquiryItem | null>(null);
    const [busyItemId, setBusyItemId] = useState<string | null>(null);
    const [busyOfferId, setBusyOfferId] = useState<string | null>(null);
    const [unitsOpen, setUnitsOpen] = useState(false);
    // ✅ کیت اشتراک‌گذاری + استودیوی کارت ویزیت — دم دست از هدر و تب انتشار (خواستهٔ کاربر)
    const [shareOpen, setShareOpen] = useState(false);
    const [cardOpen, setCardOpen] = useState(false);

    const { data: items, isLoading } = useMyInquiries();
    const list: any[] = items ?? [];
    const currentRow = useMemo(() => list.find((w) => w.id === currentInquiryId) || null, [list, currentInquiryId]);

    // جزئیات کاتالوگ کارنت (اقلام + isOwner)
    const { data: detail, isLoading: detailLoading, refetch: refetchDetail } = useInquiry(currentInquiryId ?? undefined);
    const isOwner = !!detail?.isOwner;

    // پیشنهادهای دریافتی — فقط مالک (شمارش پیشنهاد هر قلم + تب پیشنهادها)
    const { data: offers = [], isLoading: offersLoading, refetch: refetchOffers } = useInquiryOffers(isOwner ? currentInquiryId ?? undefined : undefined);

    // انتخاب خودکار: ?catalog= لینک عمیق → پرسیست → اولین لیست
    useEffect(() => {
        if (isLoading || list.length === 0) return;
        if (currentInquiryId && list.some((w) => w.id === currentInquiryId)) return;
        const fromUrl = new URLSearchParams(window.location.search).get('catalog');
        const picked = fromUrl && list.some((w) => w.id === fromUrl) ? fromUrl : list[0].id;
        dispatch(setCurrentInquiry(picked));
        if (fromUrl) window.history.replaceState({}, '', '/my-inquiries');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, list, currentInquiryId]);

    // لینک عمیق تب + ?add=1 (بعد از ساخت کاتالوگ جدید مستقیم شیت افزودن باز می‌شود)
    useEffect(() => {
        const sp = new URLSearchParams(window.location.search);
        const t = sp.get('tab');
        if (t && ['items', 'offers', 'members', 'settings', 'publish'].includes(t)) setTab(t);
        // فقط وقتی ?catalog= هم هست — یعنی از جریان ساخت آمده‌ایم
        if (sp.get('add') === '1' && sp.get('catalog')) {
            const timer = window.setTimeout(() => {
                setEditItem(null);
                setSheetOpen(true);
            }, 350);
            sp.delete('add');
            const rest = sp.toString();
            window.history.replaceState({}, '', '/my-inquiries' + (rest ? `?${rest}` : ''));
            return () => window.clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        document.title = 'تابلوی خرید من | دیمت';
    }, []);

    useEffect(() => {
        if (hydrated && !isAuthenticated) {
            router.replace(`/login?redirect=${encodeURIComponent('/my-inquiries')}`);
        }
    }, [hydrated, isAuthenticated, router]);

    // ─── جهش‌ها ───
    const updateInquiry = useUpdateInquiry();
    const updateItem = useUpdateInquiryItem();
    const removeItem = useRemoveInquiryItem();
    const updateOfferStatus = useUpdateOfferStatus();

    const toggleUrgent = async (item: InquiryItem) => {
        if (!currentInquiryId) return;
        setBusyItemId(item.id);
        try {
            await updateItem.mutateAsync({
                inquiryId: currentInquiryId,
                itemId: item.id,
                data: { urgent: !item.urgent },
            });
            toast.success(item.urgent ? 'اعلام خرید این قلم تمام شد' : 'اعلام خرید فعال شد — تامین‌کننده‌ها قیمت می‌دن');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'تغییر وضعیت ناموفق بود');
        } finally {
            setBusyItemId(null);
        }
    };

    const deleteItem = async (item: InquiryItem) => {
        if (!currentInquiryId || !window.confirm(`قلم «${item.name}» حذف شود؟`)) return;
        setBusyItemId(item.id);
        try {
            await removeItem.mutateAsync({ inquiryId: currentInquiryId, itemId: item.id });
            toast.success('قلم حذف شد');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'حذف ناموفق بود');
        } finally {
            setBusyItemId(null);
        }
    };

    const decideOffer = async (offerId: string, status: 'accepted' | 'rejected') => {
        setBusyOfferId(offerId);
        try {
            await updateOfferStatus.mutateAsync({ offerId, status });
            toast.success(status === 'accepted' ? 'پیشنهاد پذیرفته شد' : 'پیشنهاد رد شد');
            refetchOffers();
            refetchDetail();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'تغییر وضعیت ناموفق بود');
        } finally {
            setBusyOfferId(null);
        }
    };

    const toggleStatus = async () => {
        if (!currentRow) return;
        const next = currentRow.status === 'open' ? 'closed' : 'open';
        try {
            await updateInquiry.mutateAsync({ id: currentRow.id, data: { status: next } });
            toast.success(next === 'open' ? 'اعلام خرید باز شد' : 'اعلام خرید بسته شد');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'تغییر وضعیت ناموفق بود');
        }
    };

    const saveSettings = async (data: Record<string, any>) => {
        if (!currentInquiryId) return;
        await updateInquiry.mutateAsync({ id: currentInquiryId, data }).then(() => refetchDetail());
    };

    // سوییچر دو-محصولی — کاتالوگ‌های فروش با کش مشترک کنسول فروش
    const { data: catalogsRaw } = useQuery({
        queryKey: ['catalogs'],
        queryFn: () => apiService.catalog.getAll(),
        enabled: hydrated && isAuthenticated,
        staleTime: 60_000,
    });
    const salesCatalogs: any[] = (catalogsRaw ?? []).filter((c: any) => c.status === 'active');

    const selectInquiry = (id: string) => {
        dispatch(setCurrentInquiry(id));
        setTab('items');
    };
    const selectSalesCatalog = (id: string) => {
        router.push(`/my-catalogs?catalog=${id}`);
    };
    // 👁 مشاهدهٔ صفحهٔ عمومی — همان آدرسی که کیت اشتراک می‌سازد (app/inquiries/[id])
    const previewInquiry = () => {
        const key = detail?.slug || detail?.id || currentInquiryId;
        if (key) router.push(`/${key}`);
    };
    // 💾 بعد از ذخیرهٔ کارت ویزیت — لیست اعلام‌های خرید تازه شود (metadata.visitCard)
    const refreshInquiries = () => {
        queryClient.invalidateQueries({ queryKey: ['inquiries'] });
        queryClient.invalidateQueries({ queryKey: ['inquiry'] });
    };
    const savedVisitCard = (currentRow as any)?.metadata?.visitCard ?? (detail as any)?.metadata?.visitCard ?? null;

    const pendingOffers = offers.filter((o: any) => o.status === 'pending').length;
    // ✅ درخواست‌های عضویتِ در انتظار تایید — بج قرمز تب تامین‌کنندگان (سرویس اعضا)
    const { data: membersData = [] } = useInquiryMembers(isOwner ? currentInquiryId ?? undefined : undefined);
    const pendingMembers = (membersData as any[]).filter((m) => m.status === 'pending' && m.via === 'supplier_request').length;
    const tabItems = [
        { key: 'items', label: 'اقلام', icon: Package, count: detail?.items?.length },
        { key: 'offers', label: 'پیشنهادها', icon: MessageSquareText, alert: pendingOffers },
        { key: 'members', label: 'تامین‌کنندگان', icon: Handshake, alert: pendingMembers },
        { key: 'settings', label: 'تنظیمات', icon: Settings },
        { key: 'publish', label: 'انتشار', icon: Globe },
    ];

    if (!hydrated || !isAuthenticated) {
        return (
            <div className="grid min-h-screen place-items-center bg-gradient-to-b from-surface to-surface-container-low/40 dark:from-gray-950 dark:to-gray-900/40">
                <Loader2 className="size-8 animate-spin text-brand-amber" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-surface via-surface to-surface-container-low/40
            dark:from-gray-950 dark:via-gray-950 dark:to-gray-900/40 pb-24">
            <NavTabs />
            <main className="mx-auto max-w-3xl px-4 md:pt-6">
                {isLoading ? (
                    <div className="grid gap-3 pt-4">
                        {[0, 1].map((i) => <div key={i} className="h-28 animate-pulse rounded-3xl bg-white/70 dark:bg-gray-900/70" />)}
                    </div>
                ) : list.length === 0 ? (
                    <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-brand-amber-tint bg-white px-6 py-16 text-center dark:bg-gray-900">
                        <span className="grid size-16 place-items-center rounded-full bg-brand-amber-soft text-amber-500">
                            <PackageSearch className="size-8" />
                        </span>
                        <div>
                            <h3 className="text-lg font-black">هنوز اعلام خریدی نساختی</h3>
                            <p className="mt-1 text-sm text-stone-500 dark:text-gray-400">
                                اول کسب‌وکار رو انتخاب کن — بقیه‌ش اینجاست.
                            </p>
                        </div>
                        <a href="/inquiries/new"
                            className="flex h-11 items-center gap-2 rounded-full bg-brand-amber px-6 text-sm font-extrabold text-white shadow-lg shadow-brand-amber/30 transition-colors hover:bg-brand-amber-strong">
                            <Plus className="size-4" />
                            ساخت اعلام خرید
                        </a>
                    </div>
                ) : (
                    <>
                        {/* هدر کنسول — هویت + تب‌ها در نوار سفید چسبان */}
                        <div className="sticky top-0 lg:top-16 z-30 -mx-4 px-4 bg-white dark:bg-gray-900
                                border-b border-outline-variant/20 dark:border-gray-800
                                shadow-[0_6px_16px_-8px_rgba(15,23,42,0.28)] dark:shadow-[0_6px_16px_-8px_rgba(0,0,0,0.7)]">
                            <div className="pb-4 pt-2">
                                <InquiryIdentityBar
                                    inquiries={list}
                                    catalogs={salesCatalogs}
                                    currentInquiryId={currentInquiryId}
                                    onSelectInquiry={selectInquiry}
                                    onSelectCatalog={selectSalesCatalog}
                                    onNew={() => router.push('/inquiries/new')}
                                    onNewCatalog={() => router.push('/business/register')}
                                    onShare={() => setShareOpen(true)}
                                    onPreview={previewInquiry}
                                />
                            </div>
                            <InquiryConsoleTabs items={tabItems} active={tab} onChange={setTab} />
                        </div>

                        {/* محتوای تب‌ها */}
                        <div className="pt-4">
                            {!currentInquiryId || (!detail && detailLoading) ? (
                                <div className="grid gap-3">
                                    {[0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/70 dark:bg-gray-900/70" />)}
                                </div>
                            ) : detail ? (
                                <>
                                    {tab === 'items' && (
                                        <ItemsTab
                                            detail={detail}
                                            offers={offers as any[]}
                                            loading={detailLoading}
                                            busyItemId={busyItemId}
                                            onAdd={() => { setEditItem(null); setSheetOpen(true); }}
                                            onEdit={(it) => { setEditItem(it); setSheetOpen(true); }}
                                            onToggleUrgent={toggleUrgent}
                                            onDelete={deleteItem}
                                            onGoOffers={() => setTab('offers')}
                                        />
                                    )}
                                    {tab === 'offers' && (
                                        <OffersTab
                                            detail={detail}
                                            offers={offers as any[]}
                                            loading={offersLoading}
                                            busyOfferId={busyOfferId}
                                            onDecide={decideOffer}
                                            onGoPublish={() => setTab('publish')}
                                        />
                                    )}
                                    {tab === 'members' && (
                                        <MembersTab
                                            inquiryId={detail.id}
                                            visibility={detail.visibility || 'public'}
                                        />
                                    )}
                                    {tab === 'settings' && (
                                        <SettingsTab
                                            detail={detail}
                                            saving={updateInquiry.isPending}
                                            onSave={saveSettings}
                                            onOpenUnits={() => setUnitsOpen(true)}
                                            onToggleStatus={toggleStatus}
                                        />
                                    )}
                                    {tab === 'publish' && (
                                        <PublishTab
                                            slug={detail.slug}
                                            id={detail.id}
                                            title={detail.title}
                                            visibility={detail.visibility}
                                            onOpenShare={() => setShareOpen(true)}
                                            onOpenCard={() => setCardOpen(true)}
                                            savedCard={savedVisitCard}
                                        />
                                    )}
                                </>
                            ) : (
                                <div className="grid place-items-center rounded-3xl border border-stone-100 bg-white py-14 text-center dark:border-gray-800 dark:bg-gray-900">
                                    <ClipboardList className="size-10 text-stone-300 dark:text-gray-700" />
                                    <p className="mt-3 text-sm font-bold text-stone-400">اعلام خرید پیدا نشد</p>
                                </div>
                            )}
                        </div>

                        {/* شیت افزودن/ویرایش قلم */}
                        <AddItemSheet
                            open={sheetOpen}
                            onClose={() => setSheetOpen(false)}
                            inquiryId={currentInquiryId || ''}
                            catalogUnits={(detail?.units as any[] | undefined) ?? []}
                            editItem={editItem}
                        />

                        {/* مدال واحدهای اختصاصی اعلام خرید */}
                        <UnitSettingsModal
                            isOpen={unitsOpen}
                            onClose={() => setUnitsOpen(false)}
                            catalogId={currentInquiryId || ''}
                            initialUnits={(detail?.units as any[] | undefined) ?? []}
                            saveFn={async (units) => {
                                await updateInquiry.mutateAsync({ id: currentInquiryId || '', data: { units } });
                                refetchDetail();
                                return { units };
                            }}
                            onSaved={() => { /* کش با invalidate تازه می‌شود */ }}
                            title="واحدهای اعلام خرید"
                            showQtyFields={false}
                        />

                        {/* ✅ کیت اشتراک‌گذاری اعلام خرید — مخاطبان تلفن + واتساپ/تلگرام + QR چاپی */}
                        {detail && (
                            <ShareKitModal
                                open={shareOpen}
                                onClose={() => setShareOpen(false)}
                                catalogName={detail.title}
                                slug={detail.slug || detail.id}
                                basePath=""
                                kind="inquiry"
                            />
                        )}

                        {/* 🪪 استودیوی کارت ویزیت اعلام خرید — برای تامین‌کننده‌ها؛ ذخیره در metadata */}
                        {detail && (
                            <VisitCardModal
                                open={cardOpen}
                                onClose={() => setCardOpen(false)}
                                catalogName={detail.title}
                                slug={detail.slug || detail.id}
                                basePath=""
                                inquiryId={detail.id}
                                savedSpec={savedVisitCard}
                                onSaved={refreshInquiries}
                                description={(detail as any)?.description || undefined}
                            />
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
