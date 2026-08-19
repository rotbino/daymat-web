// app/admin/arm/create/page.tsx
'use client';

import React from 'react';
import { ArmCreateWizard } from '../components/ArmCreateWizard';
import { FormHeader } from '@/app/components/FormHeader';

export default function CreateArmPage() {
    return (
        <div className="min-h-screen bg-background">
            <FormHeader
                title="ساخت بازار جدید"
                subtitle="بازار عمده فروشی تخصصی خود را ایجاد کنید"
                backUrl="/admin/arm"
            />
            <main className="pb-32">
                <ArmCreateWizard />
            </main>
        </div>
    );
}