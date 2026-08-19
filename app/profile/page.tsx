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
import { Key, Factory, Store, AlertCircle, UserPlus, XCircle, CheckCircle, Clock } from 'lucide-react';
import { ChangePasswordModal } from '@/app/register/ChangePasswordModal';
import { toast } from 'sonner';
import { VerificationModal } from '../business/VerificationModal';
import { cn } from '@/lib/utils';
import { ManagedArmsList } from "./components/ManagedArmsList";
import { apiService } from '@/lib/api/apiService';

import ProfileHeader from './components/ProfileHeader';
import BusinessCard from './components/BusinessCard';
import AdsList from './components/AdsList';
import CreditsCard from './components/CreditsCard';
import TipsList from './components/TipsList';
import BusinessList from './components/BusinessList';

// ─── کارت عضویت در بازار ───
function JoinArmCard({armName, onJoin }: { onJoin: () => void }) {
    return (
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-2 border-primary/20 rounded-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <UserPlus className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-on-surface">برای ثبت آگهی، عضو این بازار شوید</h3>
            <p className="text-sm text-on-surface-variant">
                عضویت رایگان است و فقط چند ثانیه طول می‌کشد.
            </p>
            <button
                onClick={onJoin}
                className="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
            >
                عضویت در {armName}
            </button>
        </div>
    );
}

// ─── کارت انتظار تأیید عضویت ───
function PendingMembershipCard() {
    return (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                <Clock className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-base font-semibold text-amber-800 dark:text-amber-300">
                درخواست عضویت شما در انتظار تأیید است
            </h3>
            <p className="text-sm text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                پس از تأیید مدیر بازار، امکان ثبت آگهی برای شما فعال خواهد شد.
            </p>
        </div>
    );
}

// ─── کارت رد عضویت ───
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
             نیاز به اصلاح برای تایید عضویت
            </h3>
            <p className="text-sm  leading-relaxed">
                تایید عضویت شما نیاز به اصلاحات زیر دارد. بعد از انجام اصلاحات درخواست عضویت فشار دهید.
            </p>
            <p className="text-sm text-red-700/80 dark:text-red-400/80 leading-relaxed">
                {reason ? ` ${reason}` : 'مدیر بازار درخواست عضویت شما را رد کرده است.'}
            </p>
            {onReapply && (
                <button
                    onClick={onReapply}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-green-500 text-on-primary rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
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
    const { data: userArms, isLoading: armsLoading, refetch: refetchArms } = useArms();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
    const [selectedAd, setSelectedAd] = useState<any>(null);
    const [isRefreshModalOpen, setIsRefreshModalOpen] = useState(false);
    const [isArmOwner, setIsArmOwner] = useState(false);
    const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
    const [reapplying, setReapplying] = useState(false);
    const { data: businessesList } = useBusinesses();
    const { data: selectedBusiness, isLoading: businessLoading, refetch: refetchBusiness } = useBusiness(selectedBusinessId || '');

    const hasTemporaryPassword = user?.temporaryPassword === true;
    const hasBusiness = !!activeBusiness;
    const isSystemAdmin = user?.role === 'system_admin';

    useEffect(() => {
        if (activeBusiness && !selectedBusinessId) {
            setSelectedBusinessId(activeBusiness.id);
        }
    }, [activeBusiness, selectedBusinessId]);

    // ⭐ عضویت در بازوی فعلی
    const currentMembership = useMemo(() => {
        if (!userArms || !currentSlug) return null;
        return userArms.find((a: any) => a.slug === currentSlug) || null;
    }, [userArms, currentSlug]);

    const isMember = currentMembership?.status === 'active';
    const isPending = currentMembership?.status === 'pending';
    const isRejected = currentMembership?.status === 'rejected';
    const rejectionReason = currentMembership?.rejectionReason;



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

    const totalAds = selectedBusiness?.ads?.length || 0;
    const activeAds = selectedBusiness?.ads?.filter((ad: any) => ad.status === 'active').length || 0;
    const expiredAds = selectedBusiness?.ads?.filter((ad: any) => ad.status === 'expired' || new Date(ad.expiresAt) < new Date()).length || 0;

    const armConfig = currentArm?.config as any || {};
    const bumpCost = armConfig?.economy?.bumpCost || 10;
    const maxActiveAds = armConfig?.modules?.priceTable?.maxActiveAdsPerUser || 5;

    const handleReapply = async () => {
        if (!currentSlug || !selectedBusinessId) return;
        setReapplying(true);
        try {
            await apiService.arm.join(currentSlug, {
                businessId: selectedBusinessId,
                roleType: 'seller',
            });
            await refetchArms();   // ✅ مهم: رفرش لیست بازوها
            toast.success('درخواست عضویت مجدد ثبت شد');
        } catch (error: any) {
            toast.error(error?.message || 'خطا در ارسال درخواست');
        } finally {
            setReapplying(false);
        }
    };

    useEffect(() => {
        const checkArmOwner = async () => {
            if (!user || !currentSlug) return;
            try {
                const arms = await apiService.arm.getUserArms();
                const isOwner = arms.some(
                    (a: any) => a.slug === currentSlug && a.role === 'arm_owner'
                );
                setIsArmOwner(isOwner);
            } catch (error) {
                console.error(error);
            }
        };
        checkArmOwner();
    }, [user, currentSlug]);  // ✅ حالا با تغییر بازو یا کاربر دوباره اجرا می‌شود

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

    // ⭐ عضویت در بازار
    const handleJoinArm = async () => {

        if (!currentSlug || !selectedBusinessId) return;
        try {
            await apiService.arm.join(currentSlug, {
                businessId: selectedBusinessId,
                roleType: 'seller',
            });
            await refetchArms();
            toast.success('درخواست عضویت ثبت شد');
        } catch (error: any) {
            toast.error(error?.message || 'خطا در عضویت');
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
                                className="flex-1 sm:flex-none bg-error text-white px-6 py-2.5 text-sm font-bold rounded-lg hover:bg-error/90 transition-colors shadow-lg shadow-error/30 flex items-center justify-center gap-2 animate-pulse"
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
                        <CreditsCard balance={creditBalance?.balance} />
                        <TipsList />
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        {!hasBusiness ? (
                            <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/15 dark:to-primary/10 border-2 border-primary/30 dark:border-primary/20 rounded-2xl p-6">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center"><Factory className="w-6 h-6 text-primary" /></div>
                                        <div>
                                            <h3 className="text-base font-semibold text-on-surface dark:text-gray-100">شروع فعالیت صنعتی</h3>
                                            <p className="text-sm text-on-surface-variant dark:text-gray-400">کسب و کار خود را در یک دقیقه ثبت کنید.</p>
                                        </div>
                                    </div>
                                    <button onClick={() => router.push('/business/register')} className="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-medium">ثبت کسب‌وکار</button>
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
                                        activeAds={activeAds}
                                        expiredAds={expiredAds}
                                        onVerificationClick={() => setIsVerificationModalOpen(true)}
                                    />
                                )}

                                {/* ⭐ گیت عضویت برای آگهی‌ها */}
                                {isMember ? (
                                    <AdsList
                                        ads={selectedBusiness?.ads || []}
                                        businessId={selectedBusinessId || ''}
                                        totalAds={totalAds}
                                        activeAds={activeAds}
                                        expiredAds={expiredAds}
                                        onRefreshClick={(ad) => { setSelectedAd(ad); setIsRefreshModalOpen(true); }}
                                        onEditClick={(ad) => { router.push(`/ad/edit/${ad.id}`); }}
                                        onRepublishClick={(ad) => { setSelectedAd(ad); setIsRefreshModalOpen(true); }}
                                        onToggleActive={handleToggleActive}
                                        onDeleteClick={handleDeleteAd}
                                        maxActiveAds={maxActiveAds}
                                        creditBalance={creditBalance?.balance || 0}
                                        bumpCost={bumpCost}
                                    />
                                ) : isPending ? (
                                    <PendingMembershipCard />
                                ) : isRejected ? (
                                    <RejectedMembershipCard
                                        reason={rejectionReason}
                                        onReapply={handleReapply}
                                        isSubmitting={reapplying}
                                    />
                                ) : (
                                    <JoinArmCard onJoin={handleJoinArm} armName={currentArm.name} />
                                )}
                            </>
                        )}
                        <ManagedArmsList onRefresh={() => refetch()} />
                    </div>
                </div>

                {/* موبایل */}
                <div className="lg:hidden space-y-6">
                    <ProfileHeader user={user} business={selectedBusiness} isArmOwner={isArmOwner} isSystemAdmin={isSystemAdmin} onEditClick={() => setIsEditModalOpen(true)} />
                    <CreditsCard balance={creditBalance?.balance} />
                    {!hasBusiness ? (
                        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/15 dark:to-primary/10 border-2 border-primary/30 dark:border-primary/20 rounded-2xl p-6">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <Factory className="w-6 h-6 text-primary" />
                                    <div><h3 className="text-base font-semibold text-on-surface dark:text-gray-100">شروع فعالیت صنعتی</h3><p className="text-sm text-on-surface-variant dark:text-gray-400">کسب و کار خود را ثبت کنید.</p></div>
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
                                    activeAds={activeAds}
                                    expiredAds={expiredAds}
                                    onVerificationClick={() => setIsVerificationModalOpen(true)}
                                />
                            )}

                            {/* ⭐ گیت عضویت برای آگهی‌ها */}
                            {isMember ? (
                                <AdsList
                                    ads={selectedBusiness?.ads || []}
                                    businessId={selectedBusinessId || ''}
                                    totalAds={totalAds}
                                    activeAds={activeAds}
                                    expiredAds={expiredAds}
                                    onRefreshClick={(ad) => { setSelectedAd(ad); setIsRefreshModalOpen(true); }}
                                    onEditClick={(ad) => { router.push(`/ad/edit/${ad.id}`); }}
                                    onRepublishClick={(ad) => { setSelectedAd(ad); setIsRefreshModalOpen(true); }}
                                    onToggleActive={handleToggleActive}
                                    onDeleteClick={handleDeleteAd}
                                    maxActiveAds={maxActiveAds}
                                    creditBalance={creditBalance?.balance || 0}
                                    bumpCost={bumpCost}
                                />
                            ) : isPending ? (
                                <PendingMembershipCard />
                            ) : isRejected ? (
                                <RejectedMembershipCard
                                    reason={rejectionReason}
                                    onReapply={handleReapply}
                                    isSubmitting={reapplying}
                                />
                            ) : (
                                <JoinArmCard onJoin={handleJoinArm} />
                            )}
                        </>
                    )}
                    <ManagedArmsList onRefresh={() => refetch()} />
                    <TipsList />
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