// app/my-inquiries/page.tsx
// پنل مدیریت بازوی خرید — قرینهٔ کنسول بازوی فروش (/my-catalogs):
//   انتخاب کسب‌وکار در /inquiries/new انجام می‌شود و کاربر مستقیم به همین پنل می‌آید؛
//   اقلام قلم‌به‌قلم از همین‌جا اضافه می‌شوند (هر بار یک کالا + تیک بازوی خرید).
//   تب‌ها: اقلام | پیشنهادها | تامین‌کنندگان | تنظیمات | انتشار — سوییچر دو-محصولی بالای پنل.
// ✅ تب «تامین‌کنندگان»: شبکهٔ خرید↔فروش — دعوت/تایید تامین‌کننده‌های بازوی خرید
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
    useUpdateInquiry, useUpdateOfferStatus, useFinalizeInquiry,
} from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import NavTabs from '@/app/home/nav/NavTabs';
import { faNum } from '../inquiries/utils';
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
import { ClipboardList, Package, MessageSquareText, Settings, Globe, Plus, Loader2, PackageSearch, Handshake, Megaphone, FolderClosed } from 'lucide-react';
import type { InquiryItem } from '@/lib/api/apiTypes';

export default function MyInquiriesPage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const { isAuthenticated, _hydrated } = useSelector((s: RootState) => s.auth) as any;
    const hydrated = _hydrated !== false;
    // «بازوی خرید کارنت» — پرسیست؛ با رفرش هم سرجاش می‌ماند
    const currentInquiryId = useSelector((s: RootState) => s.catalog.currentInquiryId);

    const [tab, setTab] = useState<string>('items');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editItem, setEditItem] = useState<InquiryItem | null>(null);
    const [busyItemId, setBusyItemId] = useState<string | null>(null);
    // ✅ شروع قیمت‌گیری — اول مهلتِ ساعت‌دار پرسیده می‌شود (خواستهٔ مالک)
    const [pricingStartItem, setPricingStartItem] = useState<InquiryItem | null>(null);
    const [busyOfferId, setBusyOfferId] = useState<string | null>(null);
    const [unitsOpen, setUnitsOpen] = useState(false);
    // ✅ کیت اشتراک‌گذاری + استودیوی کارت ویزیت — دم دست از هدر و تب انتشار (خواستهٔ کاربر)
    const [shareOpen, setShareOpen] = useState(false);
    const [cardOpen, setCardOpen] = useState(false);

    const { data: items, isLoading } = useMyInquiries();
    const list: any[] = items ?? [];
    // ✅ پرونده‌های بسته‌شده (فاز ۶ سناریو) — در فهرست انتخاب بالا هم می‌آیند تا پرونده در دسترس بماند
    const { data: archivedItems } = useMyInquiries(true);
    const archivedList: any[] = archivedItems ?? [];
    const currentRow = useMemo(
        () => [...list, ...archivedList].find((w) => w.id === currentInquiryId) || null,
        [list, archivedList, currentInquiryId],
    );

    // جزئیات بازوی فروش کارنت (اقلام + isOwner)
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

    // لینک عمیق تب + ?add=1 (بعد از ساخت بازوی فروش جدید مستقیم شیت افزودن باز می‌شود)
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
        document.title = 'بازوی خرید من | دیمت';
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
    const finalizeInquiry = useFinalizeInquiry();

    // ✅ توقف/شروع قیمت‌گیری — نام‌های درست (جای «پایان اعلام» و ریپلیسِ «بازوی خرید»)
    const toggleUrgent = async (item: InquiryItem) => {
        if (!currentInquiryId) return;
        if (!item.urgent) {
            // شروع قیمت‌گیری — اول مهلت ارسال قیمت (به ساعت)
            setPricingStartItem(item);
            return;
        }
        setBusyItemId(item.id);
        try {
            await updateItem.mutateAsync({
                inquiryId: currentInquiryId,
                itemId: item.id,
                data: { urgent: false },
            });
            toast.success('قیمت‌گیری این قلم متوقف شد');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'تغییر وضعیت ناموفق بود');
        } finally {
            setBusyItemId(null);
        }
    };

    /** ✅ تایید شروع قیمت‌گیری — مهلت گروهی = اکنون + ساعت‌های واردشده */
    const confirmStartPricing = async (hours: number) => {
        const item = pricingStartItem;
        if (!item || !currentInquiryId) return;
        setPricingStartItem(null);
        setBusyItemId(item.id);
        try {
            await updateInquiry.mutateAsync({
                id: currentInquiryId,
                data: { deadline: new Date(Date.now() + hours * 3600e3).toISOString() },
            });
            await updateItem.mutateAsync({
                inquiryId: currentInquiryId,
                itemId: item.id,
                data: { urgent: true },
            });
            toast.success(`قیمت‌گیری شروع شد — تامین‌کننده‌ها ${faNum(hours)} ساعت فرصت دارند`);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'شروع قیمت‌گیری ناموفق بود');
        } finally {
            setBusyItemId(null);
        }
    };

    /** ✅ ثبت/تغییر مهلت گروهی از بالای لیست قیمت‌گیری */
    const setGroupDeadline = async (hours: number) => {
        if (!currentInquiryId) return;
        try {
            await updateInquiry.mutateAsync({
                id: currentInquiryId,
                data: { deadline: new Date(Date.now() + hours * 3600e3).toISOString() },
            });
            toast.success(`فرصت ارسال قیمت: ${faNum(hours)} ساعت دیگر`);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'ثبت مهلت ناموفق بود');
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
            toast.success(next === 'open' ? 'بازوی خرید باز شد' : 'بازوی خرید بسته شد');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'تغییر وضعیت ناموفق بود');
        }
    };

    /** ✅ بستن پروندهٔ بازوی خرید (فاز ۶ سناریو) — با ثبت نتیجهٔ معامله */
    const closeFile = async (outcome: 'succeeded' | 'failed') => {
        if (!currentInquiryId) return;
        try {
            await finalizeInquiry.mutateAsync({ id: currentInquiryId, outcome });
            toast.success(outcome === 'succeeded'
                ? 'پرونده بسته شد — این خرید نتیجه گرفت 🎉'
                : 'پرونده بسته شد — این خرید به نتیجه نرسید');
            refetchOffers();
            refetchDetail();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'بستن پرونده ناموفق بود');
        }
    };

    /** بازکردن دوبارهٔ پروندهٔ بسته‌شده (اشتباه زدی؟) — نتیجهٔ قبلی پاک می‌شود */
    const reopenFile = async () => {
        if (!currentInquiryId || !window.confirm('پرونده دوباره باز شود؟ نتیجهٔ ثبت‌شده پاک می‌شود.')) return;
        try {
            await updateInquiry.mutateAsync({ id: currentInquiryId, data: { status: 'open' } });
            toast.success('پرونده دوباره باز شد — بازوی خریدت به حالت قیمت‌گیری برگشت');
            refetchDetail();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'بازگشایی ناموفق بود');
        }
    };

    const saveSettings = async (data: Record<string, any>) => {
        if (!currentInquiryId) return;
        await updateInquiry.mutateAsync({ id: currentInquiryId, data }).then(() => refetchDetail());
    };

    // سوییچر دو-محصولی — بازوهای فروشی قیمت با کش مشترک کنسول فروش
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
    // 💾 بعد از ذخیرهٔ کارت ویزیت — لیست بازوهای خرید تازه شود (metadata.visitCard)
    const refreshInquiries = () => {
        queryClient.invalidateQueries({ queryKey: ['inquiries'] });
        queryClient.invalidateQueries({ queryKey: ['inquiry'] });
    };
    const savedVisitCard = (currentRow as any)?.metadata?.visitCard ?? (detail as any)?.metadata?.visitCard ?? null;

    const pendingOffers = offers.filter((o: any) => o.status === 'pending').length;
    // ✅ درخواست‌های عضویتِ در انتظار تایید — بج قرمز تب تامین‌کنندگان (سرویس اعضا)
    const { data: membersData = [] } = useInquiryMembers(isOwner ? currentInquiryId ?? undefined : undefined);
    const pendingMembers = (membersData as any[]).filter((m) => m.status === 'pending' && m.via === 'supplier_request').length;
    // ✅ تامین‌کننده‌های فعال — برای راهنمای شروع (خواستهٔ مالک: حداقل ۵)
    const supplierCount = (membersData as any[]).filter((m) => m.status === 'active').length;
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
                <Loader2 className="size-8 animate-spin text-brand-contrast" />
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
                    <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-brand-contrast-tint bg-white px-6 py-16 text-center dark:bg-gray-900">
                        <span className="grid size-16 place-items-center rounded-full bg-brand-contrast-soft text-amber-500">
                            <PackageSearch className="size-8" />
                        </span>
                        <div>
                            <h3 className="text-lg font-black">هنوز بازوی خریدی نساختی</h3>
                            <p className="mt-1 text-sm text-stone-500 dark:text-gray-400">
                                اول کسب‌وکار رو انتخاب کن — بقیه‌ش اینجاست.
                            </p>
                        </div>
                        <a href="/inquiries/new"
                            className="flex h-11 items-center gap-2 rounded-full bg-brand-contrast px-6 text-sm font-extrabold text-white shadow-lg shadow-brand-contrast/30 transition-colors hover:bg-brand-contrast-strong">
                            <Plus className="size-4" />
                            ساخت بازوی خرید
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
                                    inquiries={[...list, ...archivedList]}
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
                            {/* ✅ بنر پروندهٔ بسته‌شده — بازو از همهٔ لیست‌ها خارج شده؛ فقط مالک این را می‌بیند (فاز ۶) */}
                            {detail?.status === 'archived' && (
                                <div className="mb-3 rounded-2xl border-2 border-stone-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                                    <p className="flex items-center gap-2 text-[13px] font-black text-stone-800 dark:text-gray-100">
                                        <FolderClosed className="size-4 text-stone-500" />
                                        پروندهٔ این بازوی خرید بسته شد
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                                            (detail as any).outcome === 'succeeded'
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-stone-200 text-stone-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                            {(detail as any).outcome === 'succeeded' ? 'معامله انجام شد' : 'به نتیجه نرسید'}
                                        </span>
                                    </p>
                                    <p className="mt-1 text-[11px] font-bold text-stone-400 dark:text-gray-500">
                                        از لیست‌های عمومی، بازار و درخواستهای قیمت خارج شده — فقط تو می‌بینی‌اش.
                                    </p>
                                    <button onClick={reopenFile}
                                        className="mt-2.5 h-9 rounded-full border border-stone-200 px-4 text-[11px] font-extrabold text-stone-600 transition-colors hover:border-brand-contrast hover:text-amber-700 dark:border-gray-700 dark:text-gray-300">
                                        بازکردن دوبارهٔ پرونده
                                    </button>
                                </div>
                            )}
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
                                            deadline={(detail as any)?.deadline ?? null}
                                            onSetDeadline={setGroupDeadline}
                                            deadlineBusy={updateInquiry.isPending}
                                            supplierCount={supplierCount}
                                            onGoMembers={() => setTab('members')}
                                        />
                                    )}
                                    {tab === 'offers' && (
                                        <OffersTab
                                            detail={detail}
                                            offers={offers as any[]}
                                            loading={offersLoading}
                                            busyOfferId={busyOfferId}
                                            onDecide={decideOffer}
                                            onFinalize={closeFile}
                                            finalizing={finalizeInquiry.isPending}
                                            onGoPublish={() => setTab('publish')}
                                        />
                                    )}
                                    {tab === 'members' && (
                                        <MembersTab
                                            inquiryId={detail.id}
                                            visibility={detail.visibility || 'public'}
                                            slug={detail.slug}
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
                                    <p className="mt-3 text-sm font-bold text-stone-400">بازوی خرید پیدا نشد</p>
                                </div>
                            )}
                        </div>

                        {/* شیت افزودن/ویرایش قلم */}
                        <AddItemSheet
                            open={sheetOpen}
                            onClose={() => setSheetOpen(false)}
                            inquiryId={currentInquiryId || ''}
                            catalogUnits={(detail?.units as any[] | undefined) ?? []}
                            existingItems={(detail?.items ?? []).map((i) => ({ id: i.id, name: i.name }))}
                            currentDeadline={(detail as any)?.deadline ?? null}
                            isFirstItem={(detail?.items?.length ?? 0) === 0}
                            editItem={editItem}
                        />

                        {/* ✅ مودال شروع قیمت‌گیری — ورود مهلت به ساعت (خواستهٔ مالک) */}
                        <StartPricingModal
                            item={pricingStartItem}
                            currentDeadline={(detail as any)?.deadline ?? null}
                            busy={updateInquiry.isPending || updateItem.isPending}
                            onCancel={() => setPricingStartItem(null)}
                            onConfirm={confirmStartPricing}
                        />

                        {/* مدال واحدهای اختصاصی بازوی خرید */}
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
                            title="واحدهای بازوی خرید"
                            showQtyFields={false}
                        />

                        {/* ✅ کیت اشتراک‌گذاری بازوی خرید — مخاطبان تلفن + واتساپ/تلگرام + QR چاپی */}
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

                        {/* 🪪 استودیوی کارت ویزیت بازوی خرید — برای تامین‌کننده‌ها؛ ذخیره در metadata */}
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

/* ═══════════════════════════════════════════════════════════════
   ✅ مودال شروع قیمت‌گیری — مهلت ارسال قیمت به ساعت (عددی، حداکثر ۲۴۰)
   اگر قبلا مهلت فعالی ثبت شده، همان به‌عنوان پیش‌فرض می‌آید و قابل ویرایش است.
   ═══════════════════════════════════════════════════════════════ */
const MAX_DEADLINE_HOURS = 240;

function StartPricingModal({ item, currentDeadline, busy, onCancel, onConfirm }: {
    item: InquiryItem | null;
    currentDeadline?: string | null;
    busy: boolean;
    onCancel: () => void;
    onConfirm: (hours: number) => void;
}) {
    const [hours, setHours] = useState('');
    const [error, setError] = useState('');

    // با باز شدن مودال: مهلت فعالِ فعلی (یا ۲۴) پیش‌فرض است
    useEffect(() => {
        if (item) {
            const rem = currentDeadline ? new Date(currentDeadline).getTime() - Date.now() : 0;
            setHours(String(rem > 0 ? Math.max(1, Math.ceil(rem / 3600e3)) : 24));
            setError('');
        }
    }, [item, currentDeadline]);

    if (!item) return null;

    const submit = () => {
        const h = parseInt((hours || '').replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^\d]/g, ''), 10);
        if (!h || h < 1 || h > MAX_DEADLINE_HOURS) {
            setError(`عددی بین ۱ تا ${faNum(MAX_DEADLINE_HOURS)} وارد کن`);
            return;
        }
        onConfirm(h);
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-200 sm:p-4"
             onClick={busy ? undefined : onCancel}>
            <div onClick={(e) => e.stopPropagation()}
                 className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-2xl
                     animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
                <h3 className="flex items-center gap-2 text-[15px] font-black text-stone-900 dark:text-gray-100">
                    <Megaphone className="size-4 text-brand-contrast" />
                    شروع قیمت‌گیری برای «{item.name}»
                </h3>
                <p className="mt-1.5 text-[11px] font-bold leading-5 text-stone-400 dark:text-gray-500">
                    تامین‌کننده‌های عضو بازوی تو تا این فرصت می‌توانند قیمت بدهند — بعد از تمام‌شدن، قیمت‌گیری خودکار متوقف می‌شود.
                </p>
                <label className="mt-3.5 mb-1 block text-[11px] font-bold text-stone-500 dark:text-gray-400">
                    مهلت ارسال قیمت — به ساعت (حداکثر {faNum(MAX_DEADLINE_HOURS)} ساعت)
                </label>
                <input
                    value={hours}
                    onChange={(e) => { setHours(e.target.value.replace(/[^\d۰-۹]/g, '')); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && submit()}
                    inputMode="numeric"
                    autoFocus
                    placeholder="مثلا ۲۴"
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-center text-sm font-black outline-none transition-colors dark:bg-gray-950 dark:text-gray-100 ${error ? 'border-red-400' : 'border-stone-200 focus:border-brand-contrast dark:border-gray-700'}`}
                />
                {error && <p className="mt-1 text-[10.5px] font-bold text-red-500">{error}</p>}
                <div className="mt-4 flex gap-2">
                    <button onClick={submit} disabled={busy}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-contrast text-sm font-extrabold text-white shadow-lg shadow-brand-contrast/25 transition-colors hover:bg-brand-contrast-strong disabled:opacity-50">
                        شروع قیمت‌گیری
                    </button>
                    <button onClick={onCancel} disabled={busy}
                        className="h-11 rounded-xl border border-stone-200 px-4 text-xs font-bold text-stone-500 transition-colors hover:border-stone-400 disabled:opacity-50 dark:border-gray-700">
                        بی‌خیال
                    </button>
                </div>
            </div>
        </div>
    );
}
