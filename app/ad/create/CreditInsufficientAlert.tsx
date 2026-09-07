// components/ad/CreditInsufficientAlert.tsx
import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface CreditInsufficientAlertProps {
    open: boolean;
    onClose: () => void;
    needed: number;
    balance: number;
    maxFreeAds: number;
}

export function CreditInsufficientAlert({
                                            open,
                                            onClose,
                                            needed,
                                            balance,
                                            maxFreeAds,
                                        }: CreditInsufficientAlertProps) {
    const router = useRouter();

    const handleBuyCredit = () => {
        router.push('/credit/purchase');
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-warning">
                        <AlertCircle className="w-6 h-6" />
                        <DialogTitle>اعتبار ناکافی</DialogTitle>
                    </div>
                    <DialogDescription className="text-right space-y-3 pt-2">
                        <p>
                            سهمیه آگهی رایگان شما ({maxFreeAds} عدد در ماه) تمام شده است.
                        </p>
                        <p>
                            برای ثبت آگهی جدید به <span className="font-bold text-primary">{needed}</span> اعتبار نیاز دارید.
                            موجودی فعلی شما <span className="font-bold">{balance}</span> اعتبار است.
                        </p>
                        <p className="text-sm text-on-surface-variant">
                            هر اعتبار معادل {new Intl.NumberFormat('fa-IR').format(2000)} تومان است.
                        </p>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                        انصراف
                    </Button>
                    <Button onClick={handleBuyCredit} className="w-full sm:w-auto flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        خرید اعتبار
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}