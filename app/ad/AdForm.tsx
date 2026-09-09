// app/ad/AdForm.tsx
// ✅ ویزارد آگهی — نسخهٔ ماژولار
// منطق و state در استور: app/ad/form/AdFormStore.tsx (Context + React Query)
// UI مراحل: app/ad/form/Step*.tsx — این فایل فقط هماهنگ‌کننده است.

'use client';

import React from 'react';
import { Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AdFormProvider, useAdForm, ImageFileInput } from './form/AdFormStore';
import { AdFormHeader } from './form/AdFormHeader';
import { StepProgress } from './form/StepProgress';
import { StepProduct } from './form/StepProduct';
import { StepPricing } from './form/StepPricing';
import { StepTerms } from './form/StepTerms';
import { StepReview } from './form/StepReview';
import { WizardNav } from './form/WizardNav';
import UnitSettingsModal from './components/UnitSettingsModal';
import CategorySettingsModal from './components/CategorySettingsModal';

export function AdForm({ adId, onSuccess }: { adId?: string; onSuccess?: () => void }) {
    return (
        <AdFormProvider adId={adId} onSuccess={onSuccess}>
            <AdFormShell />
        </AdFormProvider>
    );
}

// ═══ شل ویزارد — گاردها + چیدمان مراحل ═══
function AdFormShell() {
    const router = useRouter();
    const { currentStep, hasCatalogId, selectedCatalog, catalogLoading, isEditMode, adLoading } = useAdForm();

    // ═══ گاردها ═══
    if (!hasCatalogId) {
        return (
            <div className="min-h-screen grid place-items-center bg-surface dark:bg-gray-950 text-center px-4">
                <div>
                    <Package className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-4" />
                    <p className="text-sm font-bold text-on-surface">کاتالوگ مقصد مشخص نیست</p>
                    <p className="text-xs text-on-surface-variant mt-2">از کاتالوگ موردنظرت دکمهٔ «افزودن محصول» را بزن.</p>
                    <button onClick={() => router.push('/my-catalogs')}
                            className="mt-4 text-primary text-sm font-bold">رفتن به کاتالوگ‌های من</button>
                </div>
            </div>
        );
    }
    if (catalogLoading || (isEditMode && !selectedCatalog && adLoading)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
            </div>
        );
    }
    if (!selectedCatalog) {
        return (
            <div className="min-h-screen grid place-items-center bg-surface dark:bg-gray-950 text-center px-4">
                <div>
                    <Package className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-4" />
                    <p className="text-sm font-bold text-on-surface">کاتالوگ یافت نشد</p>
                    <button onClick={() => router.push('/my-catalogs')}
                            className="mt-4 text-primary text-sm font-bold">رفتن به کاتالوگ‌های من</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-surface via-surface to-surface-container-low/40 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900/40 pb-36">
            <AdFormHeader />

            <main className="max-w-lg mx-auto px-4 pt-5 space-y-4">
                <StepProgress />

                {/* ═══ مراحل ═══ */}
                {currentStep === 1 && <StepProduct />}
                {currentStep === 2 && <StepPricing />}
                {currentStep === 3 && <StepTerms />}
                {currentStep === 4 && <StepReview />}
            </main>

            <WizardNav />

            {/* المان مخفی انتخاب فایل عکس */}
            <ImageFileInput />

            {/* مودال‌ها */}
            <Modals />
        </div>
    );
}

// ═══ مودال‌های تنظیمات کاتالوگ ═══
function Modals() {
    const {
        catalogId, unitModalOpen, setUnitModalOpen, catModalOpen, setCatModalOpen,
        localUnitSettings, localCategoryTree, setLocalUnitSettings, setLocalCategoryTree,
        invalidateCatalog,
    } = useAdForm();

    return (
        <>
            <UnitSettingsModal
                isOpen={unitModalOpen}
                onClose={() => setUnitModalOpen(false)}
                catalogId={catalogId}
                initialUnits={localUnitSettings}
                onSaved={(units) => {
                    setLocalUnitSettings(units);
                    invalidateCatalog();
                }}
            />
            <CategorySettingsModal
                isOpen={catModalOpen}
                onClose={() => setCatModalOpen(false)}
                catalogId={catalogId}
                initialTree={localCategoryTree}
                onSaved={(tree) => {
                    setLocalCategoryTree(tree);
                    invalidateCatalog();
                }}
            />
        </>
    );
}
