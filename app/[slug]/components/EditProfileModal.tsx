// app/[slug]/components/EditProfileModal.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { setUser } from '@/lib/store/slices/authSlice';
import { Check, Camera, Loader2, User, X, IdCard, Mail, Cake } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiService } from '@/lib/api/apiService';
import { useUploadFile } from '@/lib/api/apiHooks';
import { IranLocationSelector } from '@/app/components/IranLocationSelector';
import PersianDate from '@/components/common/PersianDate';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    /** بعد از ذخیرهٔ موفق — CatalogClient با آن owner کاتالوگ را تازه می‌کند */
    onSaved?: () => void;
}

export default function EditProfileModal({ isOpen, onClose, onSaved }: Props) {
    const dispatch = useDispatch();
    const { user } = useSelector((s: RootState) => s.auth);
    const uploadMutation = useUploadFile();
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const [fullName, setFullName] = useState('');
    const [gender, setGender] = useState('');
    const [bio, setBio] = useState('');
    const [provinceCode, setProvinceCode] = useState('');
    const [cityCode, setCityCode] = useState('');
    const [birthDate, setBirthDate] = useState<string | undefined>();
    const [email, setEmail] = useState('');

    // ─── آواتار ───
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [currentAvatarFileId, setCurrentAvatarFileId] = useState<string | undefined>(undefined);
    const [isUploading, setIsUploading] = useState(false);
    const uploadedFileRef = useRef<{ id: string; thumbnailPath?: string; path?: string } | null>(null);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [savedTick, setSavedTick] = useState(false);

    const maxBirthDate = useMemo(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 10);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }, []);

    useEffect(() => {
        if (!isOpen || !user) return;
        setFullName(user.fullName || '');
        setGender(user.gender || '');
        setBio(user.bio || '');
        setProvinceCode(user.provinceCode || '');
        setCityCode(user.cityCode || '');
        setBirthDate(user.birthDate);
        setEmail(user.email || '');
        setCurrentAvatarFileId(user.avatarFile?.id);
        setSelectedFile(null);
        setAvatarPreview(null);
        uploadedFileRef.current = null;
        setErrors({});
        setSavedTick(false);
    }, [isOpen, user]);

    useEffect(() => {
        if (!selectedFile) { setAvatarPreview(null); return; }
        const url = URL.createObjectURL(selectedFile);
        setAvatarPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [selectedFile]);

    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) handleClose(); };
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prev;
            document.removeEventListener('keydown', onKey);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, saving]);

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!fullName.trim()) e.fullName = 'نام و نام خانوادگی الزامی است';
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'ایمیل نامعتبر است';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleClose = () => {
        if (saving || isUploading) return;
        onClose();
    };

    // ✅ آپلود آواتار — همان الگوی اثبات‌شده
    const uploadAvatar = async (): Promise<{ id: string; thumbnailPath?: string; path?: string } | null> => {
        if (!selectedFile) {
            if (currentAvatarFileId) return { id: currentAvatarFileId };
            return null;
        }
        if (uploadedFileRef.current) return uploadedFileRef.current;

        setIsUploading(true);
        try {
            const result = await uploadMutation.mutateAsync({
                file: selectedFile,
                model: 'User',
                modelId: user.id,
                fieldKey: 'avatar',
            });
            const data = {
                id: result.id,
                thumbnailPath: result.thumbnailPath || result.path,
                path: result.path,
            };
            uploadedFileRef.current = data;
            setCurrentAvatarFileId(result.id);
            setSelectedFile(null);
            return data;
        } catch (err: any) {
            toast.error(err?.message || 'خطا در آپلود تصویر');
            throw err;
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const avatarFileData = await uploadAvatar();

            // ✅ avatarFileId هرگز به /auth/profile نمی‌رود (DTO ندارد)
            const payload: any = {
                fullName: fullName.trim(),
                gender: gender || undefined,
                bio: bio.trim() || undefined,
                provinceCode: provinceCode || undefined,
                cityCode: cityCode || undefined,
                countryCode: 'IR',
                birthDate: birthDate || undefined,
                email: email.trim() || undefined,
            };

            const updatedUser = await apiService.auth.updateProfile(payload);

            const finalAvatarFile = avatarFileData
                ? { id: avatarFileData.id, thumbnailPath: avatarFileData.thumbnailPath, path: avatarFileData.path }
                : user.avatarFile;

            dispatch(setUser({
                ...user,
                ...updatedUser,
                fullName: fullName.trim(),
                avatarFile: finalAvatarFile,
            }));

            onSaved?.();

            setSavedTick(true);
            // ✅ بازخورد کوتاه، بعد بستن
            setTimeout(() => onClose(), 450);
        } catch (err: any) {
            toast.error(err?.message || 'خطا در ذخیره پروفایل');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !user) return null;

    const inputCls = (hasErr?: string) => cn(
        'w-full h-11 px-3.5 text-sm text-right rounded-xl bg-surface-container-lowest border',
        'focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all',
        hasErr ? 'border-error' : 'border-outline-variant/40 dark:border-gray-700',
    );

    const SectionTitle = ({ icon: Icon, text }: any) => (
        <p className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1.5 mb-2">
            <Icon className="w-3.5 h-3.5 text-primary" /> {text}
        </p>
    );

    const buttonState = isUploading ? 'uploading' : saving ? 'saving' : savedTick ? 'saved' : 'idle';

    return (
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-200"
             onClick={handleClose}>
            <div onClick={(e) => e.stopPropagation()}
                 className="bg-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl
                     max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden
                     animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

                {/* ─── هدر ─── */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <User className="w-4.5 h-4.5 text-primary" />
                        </span>
                        <div>
                            <h3 className="text-sm font-extrabold text-on-surface">پروفایل من</h3>
                            <p className="text-[10px] text-on-surface-variant/70" dir="ltr">{user?.phone}</p>
                        </div>
                    </div>
                    <button onClick={handleClose} aria-label="بستن"
                            className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ─── بدنه ─── */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim px-4 py-4 space-y-4">

                    {/* ✅ باکس ۱: هویت — آواتار گرد + نام + بیو + جنسیت */}
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4">
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => avatarInputRef.current?.click()}
                                disabled={isUploading}
                                className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0
                                    ring-2 ring-primary/20 hover:ring-primary/50 transition-all group"
                            >
                                {avatarPreview ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                                ) : user.avatarFile?.thumbnailPath ? (
                                    <img src={user.avatarFile.thumbnailPath} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full grid place-items-center bg-primary/10 text-primary">
                                        <User className="w-8 h-8" />
                                    </div>
                                )}
                                <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100
                                    group-active:opacity-100 transition-opacity grid place-items-center">
                                    <Camera className="w-5 h-5 text-white" />
                                </span>
                                {isUploading && (
                                    <span className="absolute inset-0 bg-black/50 grid place-items-center">
                                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                                    </span>
                                )}
                            </button>
                            <div className="flex-1 min-w-0 space-y-2">
                                <input type="text" value={fullName}
                                       onChange={(e) => { setFullName(e.target.value); setErrors((p) => ({ ...p, fullName: '' })); }}
                                       placeholder="نام و نام خانوادگی"
                                       className={cn(inputCls(errors.fullName), 'font-bold')} />
                                {errors.fullName && <p className="text-error text-[11px] -mt-1">{errors.fullName}</p>}
                                <input type="text" value={bio} onChange={(e) => setBio(e.target.value)}
                                       placeholder="مثلاً فروشنده عمده آهن‌آلات" className={cn(inputCls(), 'h-9 text-[13px]')} />
                            </div>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) setSelectedFile(f);
                                    e.target.value = '';
                                }}
                            />
                        </div>

                        <div className="mt-3">
                            <label className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1.5 mb-1.5">
                                <IdCard className="w-3.5 h-3.5 text-primary" /> جنسیت
                            </label>
                            <div className="flex gap-1.5">
                                {[['male', 'مرد'], ['female', 'زن'], ['other', 'سایر']].map(([v, l]) => (
                                    <button key={v} type="button" onClick={() => setGender(v)}
                                            className={cn('flex-1 h-9 rounded-xl text-xs font-bold border transition-colors',
                                                gender === v ? 'bg-primary/10 border-primary/40 text-primary' : 'border-outline-variant/50 text-on-surface-variant')}>
                                        {l}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ✅ باکس ۲: اطلاعات شخصی */}
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-3">
                        <SectionTitle icon={Mail} text="اطلاعات شخصی" />

                        <IranLocationSelector
                            provinceCode={provinceCode}
                            cityCode={cityCode}
                            onProvinceChange={setProvinceCode}
                            onCityChange={setCityCode}
                            disabled={saving}
                        />

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface block flex items-center gap-1.5">
                                <Cake className="w-3.5 h-3.5 text-primary/60" /> تاریخ تولد
                            </label>
                            <PersianDate value={birthDate} onChange={(d) => setBirthDate(d)} placeholder="انتخاب تاریخ" maxDate={maxBirthDate} disabled={saving} />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface block flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-primary/60" /> ایمیل <span className="text-on-surface-variant/50 text-[10px]">(اختیاری)</span>
                            </label>
                            <input type="email" dir="ltr" value={email}
                                   onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
                                   placeholder="example@domain.com"
                                   className={cn(inputCls(errors.email), 'text-left')} />
                            {errors.email && <p className="text-error text-[11px]">{errors.email}</p>}
                        </div>
                    </section>
                </div>

                {/* ─── فوتر ─── */}
                <div className="flex-shrink-0 px-4 py-3 border-t border-outline-variant/20 flex items-center gap-2.5">
                    <button onClick={handleClose} disabled={saving || isUploading}
                            className="h-10 px-4 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant
                            hover:bg-surface-container-high transition-colors disabled:opacity-50 flex-shrink-0">
                        بستن
                    </button>
                    <button onClick={handleSave} disabled={saving || isUploading}
                            className={cn('flex-1 h-10 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all',
                                savedTick ? 'bg-emerald-500 text-white' : 'bg-primary text-on-primary hover:bg-primary/90 shadow-sm',
                                'disabled:opacity-50')}>
                        {buttonState === 'uploading' && <><Loader2 className="w-4 h-4 animate-spin" /> در حال آپلود تصویر...</>}
                        {buttonState === 'saving' && <><Loader2 className="w-4 h-4 animate-spin" /> در حال ذخیره...</>}
                        {buttonState === 'saved' && <><Check className="w-4 h-4" /> ذخیره شد</>}
                        {buttonState === 'idle' && 'ذخیره'}
                    </button>
                </div>
            </div>
        </div>
    );
}