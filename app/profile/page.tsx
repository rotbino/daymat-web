// app/profile/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useActiveBusiness, useCreditBalance, useBusinesses, useBusiness, useArms } from '@/lib/api/apiHooks';
import { AppHeader, AppFooter } from '@/app/components';
import { setUser } from '@/lib/store/slices/authSlice';
import { EditProfileModal } from '@/app/profile/components/EditProfileModal';
import { RefreshModal } from '@/app/ad/RefreshModal';
import { Key, Factory, Store, UserPlus, XCircle, Clock } from 'lucide-react';
import { ChangePasswordModal } from '@/app/register/ChangePasswordModal';
import { toast } from 'sonner';
import { VerificationModal } from '../business/VerificationModal';
import { cn } from '@/lib/utils';
import { ManagedArmsList } from "./components/ManagedArmsList";
import { apiService } from '@/lib/api/apiService';

import ProfileHeader from './components/ProfileHeader';
import BusinessCard from './components/BusinessCard';
import BusinessAdsList from './components/BusinessAdsList';
import CreditsCard from './components/CreditsCard';
import TipsList from './components/TipsList';
import BusinessList from './components/BusinessList';

// ─── کارت پیوستن به بازار ───
function JoinArmCard({ armName, onJoin }: { armName: string; onJoin: () => void }) {
    return (
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-2 border-primary/20 rounded-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <UserPlus className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-on-surface">
                به {armName} بپیوندید
            </h3>
            <p className="text-sm text-on-surface-variant">
                با پیوستن به {armName}، به خریداران و فروشندگان مرتبط دسترسی پیدا کنید و در بازار تخصصی خود دیده شوید.
            </p>
            <button
                onClick={onJoin}
                className="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
            >
                پیوستن به {armName}
            </button>
        </div>
    );
}

// ─── کارت: کسب‌وکار انتخاب شده عضو بازار نیست ───
function BusinessNotMemberCard({ armName, businessName, onJoin }: {
    armName: string;
    businessName: string;
    onJoin: () => void;
}) {
    return (
        <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-800 flex items-center justify-center mx-auto">
                <Store className="w-7 h-7 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-base font-semibold text-orange-800 dark:text-orange-300">
                «{businessName}» عضو {armName} نیست
            </h3>
            <p className="text-sm text-orange-700/80 dark:text-orange-400/80">
                برای ثبت آگهی، کسب و کار شما باید عضو بازار {armName} باشد.
            </p>
            <button
                onClick={onJoin}
                className="px-6 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors"
            >
                پیوستن {businessName} به {armName}
            </button>
        </div>
    );
}

// ─── کارت انتظار تأیید پیوستن ───
function PendingMembershipCard() {
    return (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                <Clock className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-base font-semibold text-amber-800 dark:text-amber-300">
                درخواست پیوستن شما در انتظار تأیید است
            </h3>
            <p className="text-sm text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                پس از تأیید مدیر بازار، امکان ثبت آگهی برای شما فعال خواهد شد.
            </p>
        </div>
    );
}

// ─── کارت رد پیوند ───
function RejectedMembershipCard({
                                    reason,
                                    onReapply,
                                    isSubmitting,
                                }: {
    reason?: string;
    onReapply?: () => void;
    isSubmitting?: boolean;
}) {
    return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center mx-auto">
                <XCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-base font-semibold text-red-800 dark:text-red-300">
                نیاز به اصلاح برای تایید پیوستن شما به بازار
            </h3>
            <p className="text-sm leading-relaxed">
                تایید پیوستن شما به بازار نیاز به اصلاحات زیر دارد. بعد از انجام اصلاحات دکمه درخواست پیوستن را فشار دهید.
            </p>
            <p className="text-sm text-red-700/80 dark:text-red-400/80 leading-relaxed">
                {reason ? ` ${reason}` : 'مدیر بازار درخواست پیوستن شما به بازار را رد کرده است.'}
            </p>
            {onReapply && (
                <button
                    onClick={onReapply}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                    {isSubmitting ? 'در حال ارسال...' : 'اصلاحات انجام شد؛ درخواست مجدد'}
                </button>
            )}
        </div>
    );
}

export default function ProfilePage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { user } = useSelector((state: RootState) => state.auth);
    const { currentArm, currentSlug } = useSelector((state: RootState) => state.arm);
    const { data: activeBusiness, isLoading: activeLoading, refetch } = useActiveBusiness();
    const { data: creditBalance, refetch: refetchBalance } = useCreditBalance();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
    const [selectedAd, setSelectedAd] = useState<any>(null);
    const [isRefreshModalOpen, setIsRefreshModalOpen] = useState(false);

    const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
    const [reapplying, setReapplying] = useState(false);
    const { data: businessesList } = useBusinesses();
    const { data: selectedBusiness, isLoading: businessLoading, refetch: refetchBusiness } = useBusiness(selectedBusinessId || '');

    const hasTemporaryPassword = user?.temporaryPassword === true;
    const hasBusiness = !!activeBusiness;
    const isSystemAdmin = user?.role === 'system_admin';

    const { data: userArms, isLoading: armsLoading, refetch: refetchArms } = useArms();

    const isArmOwner = useMemo(() => {
        if (!user || !currentSlug || !userArms) return false;
        return userArms.some(
            (a: any) => a.slug === currentSlug && a.role === 'arm_owner'
        );
    }, [userArms, currentSlug, user]);

    const isUserMemberOfArm = useMemo(() => {
        if (!userArms || !currentSlug) return false;
        return userArms.some(
            (a: any) => a.slug === currentSlug && a.status === 'active'
        );
    }, [userArms, currentSlug]);

    const isSelectedBusinessMember = useMemo(() => {
        if (!userArms || !currentSlug || !selectedBusinessId) return false;
        return userArms.some(
            (a: any) =>
                a.slug === currentSlug &&
                a.businessId === selectedBusinessId &&
                a.status === 'active'
        );
    }, [userArms, currentSlug, selectedBusinessId]);

    const isSelectedBusinessPending = useMemo(() => {
        if (!userArms || !currentSlug || !selectedBusinessId) return false;
        return userArms.some(
            (a: any) =>
                a.slug === currentSlug &&
                a.businessId === selectedBusinessId &&
                a.status === 'pending'
        );
    }, [userArms, currentSlug, selectedBusinessId]);

    const isSelectedBusinessRejected = useMemo(() => {
        if (!userArms || !currentSlug || !selectedBusinessId) return false;
        return userArms.some(
            (a: any) =>
                a.slug === currentSlug &&
                a.businessId === selectedBusinessId &&
                a.status === 'rejected'
        );
    }, [userArms, currentSlug, selectedBusinessId]);

    const rejectionReasonForSelectedBusiness = useMemo(() => {
        if (!userArms || !currentSlug || !selectedBusinessId) return null;
        const rejected = userArms.find(
            (a: any) =>
                a.slug === currentSlug &&
                a.businessId === selectedBusinessId &&
                a.status === 'rejected'
        );
        return rejected?.rejectionReason || null;
    }, [userArms, currentSlug, selectedBusinessId]);

    const shouldShowWallet = isSelectedBusinessMember;

    useEffect(() => {
        if (activeBusiness && !selectedBusinessId) {
            setSelectedBusinessId(activeBusiness.id);
        }
    }, [activeBusiness, selectedBusinessId]);

    const completionPercentage = useMemo(() => {
        const b = selectedBusiness;
        if (!b) return 0;
        const name = b.name ? 15 : 0;
        const shortDesc = b.shortDescription ? 10 : 0;
        const type = b.type ? 15 : 0;
        const location = b.province && b.city ? 15 : 0;
        const activities = (b.activities?.length || 0) > 0 ? 15 : 0;
        const phone = b.phone ? 10 : 0;
        const desc = b.description ? 10 : 0;
        const position = b.position ? 10 : 0;
        return name + shortDesc + type + location + activities + phone + desc + position;
    }, [selectedBusiness]);

    const isComplete = completionPercentage === 100;
    const isPendingVerify = selectedBusiness?.verificationStatus === 'pending';
    const isRejectedVerify = selectedBusiness?.verificationStatus === 'rejected';
    const isApproved = selectedBusiness?.verificationStatus === 'approved';
    const currentTier = selectedBusiness?.verificationTier || 'none';
    const hasApprovedTier = isApproved && currentTier !== 'none';
    const isGold = currentTier === 'gold' && isApproved;
    const canRequestInitial = isComplete && !isPendingVerify && !hasApprovedTier && !isRejectedVerify;
    const canUpgrade = hasApprovedTier && !isGold && !isPendingVerify;

    // ✅ totalAds از _count
    // ✅ استفاده از شمارنده‌های جدید
    const totalAds = selectedBusiness?.totalAdsCount || 0;
    const activeAdsCount = selectedBusiness?.activeAdsCount || 0;
    const expiredAdsCount = selectedBusiness?.expiredAdsCount || 0;

    const armConfig = currentArm?.config as any || {};
    const bumpCost = armConfig?.modules?.priceTable?.bumpCost || 10;
    const maxActiveAds = armConfig?.modules?.priceTable?.maxActiveAdsPerUser || 5;

    const handleReapply = async () => {
        if (!currentSlug || !selectedBusinessId) return;
        setReapplying(true);
        try {
            await apiService.arm.join(currentSlug, {
                businessId: selectedBusinessId,
                roleType: 'seller',
            });
            await refetchArms();
            toast.success('درخواست پیوستن مجدد ثبت شد');
        } catch (error: any) {
            toast.error(error?.message || 'خطا در ارسال درخواست');
        } finally {
            setReapplying(false);
        }
    };

    const handleProfileUpdate = async (data: any) => {
        try {
            const { avatarFileId, ...apiData } = data;
            const updatedUser = await apiService.auth.updateProfile(apiData);
            dispatch(setUser({
                ...user,
                ...updatedUser,
                avatarFile: avatarFileId ? { id: avatarFileId } : updatedUser.avatarFile ?? user?.avatarFile,
                temporaryPassword: updatedUser.temporaryPassword ?? user?.temporaryPassword,
            }));
            await refetch();
            await refetchBalance();
            toast.success('پروفایل با موفقیت به‌روزرسانی شد');
        } catch (error: any) {
            toast.error(error?.message || 'خطا');
        }
    };

    const handlePasswordChange = async () => {
        dispatch(setUser({ ...user, temporaryPassword: false }));
        await refetch();
    };

    const handleToggleActive = async (ad: any) => {
        try {
            const newStatus = ad.status === 'active' ? 'inactive' : 'active';
            await apiService.ad.update(ad.id, { status: newStatus });
            if (newStatus === 'active') toast.success('آگهی فعال شد');
            else toast.success('آگهی غیر فعال و آرشیو شد');
            refetchBusiness();
            refetch();
            refetchBalance();
        } catch (error: any) {
            toast.error(error?.message || 'خطا در تغییر وضعیت آگهی');
        }
    };

    const handleDeleteAd = async (ad: any) => {
        try {
            await apiService.ad.delete(ad.id);
            toast.success('آگهی با موفقیت حذف شد');
            refetchBusiness();
            refetch();
        } catch (error: any) {
            toast.error(error?.message || 'خطا در حذف آگهی');
        }
    };

    const handleJoinArm = async () => {
        if (!currentSlug || !selectedBusinessId) return;
        try {
            await apiService.arm.join(currentSlug, {
                businessId: selectedBusinessId,
                roleType: 'seller',
            });
            await refetchArms();
            toast.success('درخواست پیوستن ثبت شد');
        } catch (error: any) {
            if (error?.data?.errorCode === 'ALREADY_MEMBER') {
                toast.info('این کسب‌وکار قبلاً عضو شده است');
                await refetchArms();
            } else {
                toast.error(error?.message || 'خطا در پیوستن به بازار');
            }
        }
    };

    useEffect(() => {
        if (!activeLoading) {
            refetch();
            refetchBalance();
        }
    }, []);

    if ((activeLoading || armsLoading) && !selectedBusiness) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            </div>
        );
    }

    const membershipGate = (
        <>
            {isSelectedBusinessMember ? (
                <BusinessAdsList
                    businessId={selectedBusinessId || ''}
                    maxActiveAds={maxActiveAds}
                    creditBalance={creditBalance?.balance || 0}
                    bumpCost={bumpCost}
                    onRefreshClick={(ad) => { setSelectedAd(ad); setIsRefreshModalOpen(true); }}
                    onEditClick={(ad) => { router.push(`/ad/edit/${ad.id}`); }}
                    onRepublishClick={(ad) => { setSelectedAd(ad); setIsRefreshModalOpen(true); }}
                    onToggleActive={handleToggleActive}
                    onDeleteClick={handleDeleteAd}
                    totalAds={totalAds}
                    activeAds={activeAdsCount}
                    expiredAds={expiredAdsCount}
                    businessSlug={selectedBusiness?.slug}
                    businessName={selectedBusiness?.name}
                />
            ) : isSelectedBusinessPending ? (
                <PendingMembershipCard />
            ) : isSelectedBusinessRejected ? (
                <RejectedMembershipCard
                    reason={rejectionReasonForSelectedBusiness}
                    onReapply={handleReapply}
                    isSubmitting={reapplying}
                />
            ) : isUserMemberOfArm ? (
                <BusinessNotMemberCard
                    armName={currentArm?.name || ''}
                    businessName={selectedBusiness?.name || ''}
                    onJoin={handleJoinArm}
                />
            ) : (
                <JoinArmCard armName={currentArm?.name || ''} onJoin={handleJoinArm} />
            )}
        </>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-surface via-surface to-surface-container-low/30 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900/30">
            <AppHeader showBack={false} fixed={true} />
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24">
                {hasTemporaryPassword && (
                    <div className="bg-error/5 border-2 border-error shadow-lg rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-error flex items-center justify-center flex-shrink-0 shadow-md">
                                <Key className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-extrabold text-error">رمز عبور شما موقت است!</p>
                                <p className="text-xs text-on-surface dark:text-gray-300 mt-1">
                                    برای حفظ امنیت حساب خود، <span className="font-bold">همین حالا</span> رمز عبور جدیدی تعیین کنید.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <button
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="flex-1 sm:flex-none bg-error text-white px-6 py-2.5 text-sm font-bold rounded-lg hover:bg-error/90 transition-colors shadow-lg shadow-error/30 flex items-center justify-center gap-2"
                            >
                                <Key className="w-4 h-4" />
                                تغییر رمز
                            </button>
                        </div>
                    </div>
                )}

                {/* دسکتاپ */}
                <div className="hidden lg:grid lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-1 space-y-6">
                        <ProfileHeader user={user} business={selectedBusiness} isArmOwner={isArmOwner} isSystemAdmin={isSystemAdmin} onEditClick={() => setIsEditModalOpen(true)} />
                        {shouldShowWallet && (
                            <CreditsCard balance={creditBalance?.balance} />
                        )}
                        {hasBusiness && (
                            <TipsList />
                        )}
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        {!hasBusiness ? (
                            <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/15 dark:to-primary/10 border-2 border-primary/30 dark:border-primary/20 rounded-2xl p-6">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center"><Factory className="w-6 h-6 text-primary" /></div>
                                        <div>
                                            <h3 className="text-base font-semibold text-on-surface dark:text-gray-100">شروع فعالیت تجاری</h3>
                                            <p className="text-sm text-on-surface-variant dark:text-gray-400">کسب و کار خود را در یک دقیقه ثبت کنید و قیمت‌های خود را روی تابلو قرار دهید.</p>
                                        </div>
                                    </div>
                                    <button onClick={() => router.push('/business/register')} className="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-medium">ثبت کسب‌وکار</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <BusinessList
                                    selectedId={selectedBusinessId}
                                    onSelect={(id) => setSelectedBusinessId(id)}
                                    totalAds={totalAds}
                                    activeAds={activeAdsCount}
                                    expiredAds={expiredAdsCount}
                                />
                                {selectedBusiness && (
                                    <BusinessCard
                                        business={selectedBusiness}
                                        completionPercentage={completionPercentage}
                                        isComplete={isComplete}
                                        isPending={isPendingVerify}
                                        isRejected={isRejectedVerify}
                                        hasApprovedTier={hasApprovedTier}
                                        currentTier={currentTier}
                                        canRequestInitial={canRequestInitial}
                                        canUpgrade={canUpgrade}
                                        isGold={isGold}
                                        totalAds={totalAds}
                                        activeAds={activeAdsCount}
                                        expiredAds={expiredAdsCount}
                                        onVerificationClick={() => setIsVerificationModalOpen(true)}
                                    />
                                )}
                                {membershipGate}
                            </>
                        )}
                        <ManagedArmsList onRefresh={() => refetch()} />
                    </div>
                </div>

                {/* موبایل */}
                <div className="lg:hidden space-y-6">
                    <ProfileHeader user={user} business={selectedBusiness} isArmOwner={isArmOwner} isSystemAdmin={isSystemAdmin} onEditClick={() => setIsEditModalOpen(true)} />
                    {shouldShowWallet && (
                        <CreditsCard balance={creditBalance?.balance} />
                    )}
                    {!hasBusiness ? (
                        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/15 dark:to-primary/10 border-2 border-primary/30 dark:border-primary/20 rounded-2xl p-6">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <Factory className="w-6 h-6 text-primary" />
                                    <div><h3 className="text-base font-semibold text-on-surface dark:text-gray-100">شروع فعالیت تجاری</h3><p className="text-sm text-on-surface-variant dark:text-gray-400">در یک دقیقه کسب و کار خود را ثبت کنید و قیمت‌های خود را روی تابلو قرار دهید.</p></div>
                                </div>
                                <button onClick={() => router.push('/business/register')} className="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-sm">ثبت کسب‌وکار</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <BusinessList selectedId={selectedBusinessId} onSelect={(id) => setSelectedBusinessId(id)} />
                            {selectedBusiness && (
                                <BusinessCard
                                    business={selectedBusiness}
                                    completionPercentage={completionPercentage}
                                    isComplete={isComplete}
                                    isPending={isPendingVerify}
                                    isRejected={isRejectedVerify}
                                    hasApprovedTier={hasApprovedTier}
                                    currentTier={currentTier}
                                    canRequestInitial={canRequestInitial}
                                    canUpgrade={canUpgrade}
                                    isGold={isGold}
                                    totalAds={totalAds}
                                    activeAds={activeAdsCount}
                                    expiredAds={expiredAdsCount}
                                    onVerificationClick={() => setIsVerificationModalOpen(true)}
                                />
                            )}
                            {membershipGate}
                        </>
                    )}
                    <ManagedArmsList onRefresh={() => refetch()} />
                    {hasBusiness && (
                        <TipsList />
                    )}
                </div>
            </main>

            {/* مودال‌ها */}
            <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} onSuccess={handlePasswordChange} />
            {user && <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={user} onUpdate={handleProfileUpdate} />}
            {hasBusiness && selectedBusiness && (
                <VerificationModal
                    isOpen={isVerificationModalOpen}
                    onClose={() => setIsVerificationModalOpen(false)}
                    businessId={selectedBusiness?.id}
                    businessName={selectedBusiness?.name}
                    currentLevel={selectedBusiness?.verificationTier as any || 'none'}
                    isProfileComplete={isComplete}
                    onSuccess={() => { toast.success('مدارک ارسال شد'); refetch(); refetchBalance(); }}
                />
            )}
            {selectedAd && (
                <RefreshModal isOpen={isRefreshModalOpen} onClose={() => { setIsRefreshModalOpen(false); setSelectedAd(null); }} ad={selectedAd} onSuccess={() => { refetch(); refetchBalance(); }} />
            )}
            <AppFooter activeTab="profile" />
        </div>
    );
}