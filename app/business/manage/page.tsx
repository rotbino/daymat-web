// app/business/manage/page.tsx
import type { Metadata } from 'next';
import BusinessManageContent from './BusinessManageContent';

export const metadata: Metadata = {
    title: 'مدیریت کسب‌وکار | دیمت',
    description: 'مشخصات کامل کسب‌وکار خود را ببینید و هر بخش را جداگانه ویرایش کنید.',
};

export default function BusinessManagePage() {
    return <BusinessManageContent />;
}
