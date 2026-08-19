// app/components/AppHeader.tsx
'use client';

import { Fragment } from 'react';
import MobileHeader from './MobileHeader';
import DesktopHeader from './DesktopHeader';

interface AppHeaderProps {
    showLocation?: boolean;
    fixed?: boolean;
    showBack?: boolean;
}

export function AppHeader({ showLocation = false, fixed = true, showBack = true }: AppHeaderProps) {
    return (
        <Fragment>
            <MobileHeader
                showLocation={showLocation}
                showBack={showBack}
                fixed={fixed}
            />
            <DesktopHeader
                showBack={showBack}
                fixed={fixed}
            />
        </Fragment>
    );
}