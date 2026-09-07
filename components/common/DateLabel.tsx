// components/DateLabel.tsx
import React from 'react';

interface DateLabelProps {
    date: string | Date;
    showTime?: boolean;
    separator?: string;
    className?: string;
}

export const DateLabel: React.FC<DateLabelProps> = ({
                                                 date,
                                                 showTime = false,
                                                 separator = '\u00A0\u00A0',
                                                 className = ''
                                             }) => {
    const formatDate = () => {
        const dateObj = new Date(date);

        // بخش تاریخ
        const datePart = dateObj.toLocaleDateString("fa-IR");

        // اگر showTime true باشد، بخش زمان را هم اضافه کن
        if (showTime) {
            const timePart = dateObj.toLocaleTimeString("fa-IR", {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            return `${datePart}${separator}${timePart}`;
        }

        return datePart;
    };

    return (
        <span className={className} dir="ltr">
        {formatDate()}
        </span>
);
};

