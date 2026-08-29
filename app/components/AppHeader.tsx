// app/components/AppHeader.tsx
'use client';
import { Fragment } from 'react';
import MobileHeader from './MobileHeader';
import DesktopHeader from './DesktopHeader';

interface AppHeaderProps {
    showLocation?: boolean;
    fixed?: boolean;
    showBack?: boolean;
    showSearch?: boolean;
    /** مسیر تصویر لوگو؛ اگر ندهی از currentArm.logoUrl و در نهایت آیکون پیش‌فرض استفاده می‌شود */
    logoSrc?: string;
}

export function AppHeader({ showLocation = false, fixed = true, showBack = true, showSearch = false, logoSrc }: AppHeaderProps) {
    return (
        <Fragment>
            <MobileHeader showLocation={showLocation} showBack={showBack} fixed={fixed} logoSrc={logoSrc} />
            <DesktopHeader showLocation={showLocation} showBack={showBack} fixed={fixed} showSearch={showSearch} logoSrc={logoSrc} />
        </Fragment>
    );
}