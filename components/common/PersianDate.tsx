// components/common/PersianDate.tsx

import React, { useState, useEffect, useRef } from "react";
import { Calendar, Search, X } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import jMoment from "moment-jalaali";

interface PersianDateProps {
    value?: string;
    onChange?: (date: string | undefined) => void;
    minDate?: string; // حداقل تاریخ به فرمت YYYY-MM-DD
    maxDate?: string; // حداکثر تاریخ به فرمت YYYY-MM-DD
    placeholder?: string;
    searchYearTitle?: string;
    disabled?: boolean;
    className?: string;
}

const PersianDate: React.FC<PersianDateProps> = ({
                                                     value,
                                                     onChange,
                                                     minDate,
                                                     maxDate,
                                                     placeholder = "تاریخ را انتخاب کنید",
                                                     searchYearTitle="جستجوی سال ...",
                                                     disabled = false,
                                                     className
                                                 }) => {
    const [year, setYear] = useState<number | null>(null);
    const [month, setMonth] = useState<number | null>(null);
    const [day, setDay] = useState<number | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [showPlaceholders, setShowPlaceholders] = useState(true);
    const [showYearModal, setShowYearModal] = useState(false);
    const [showMonthModal, setShowMonthModal] = useState(false);
    const [showDayModal, setShowDayModal] = useState(false);
    const [yearSearchTerm, setYearSearchTerm] = useState("");
    const [monthSearchTerm, setMonthSearchTerm] = useState("");
    const [daySearchTerm, setDaySearchTerm] = useState("");

    const yearModalRef = useRef<HTMLDivElement>(null);
    const monthModalRef = useRef<HTMLDivElement>(null);
    const dayModalRef = useRef<HTMLDivElement>(null);

    // نام‌های ماه‌های شمسی
    const persianMonths = [
        "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
        "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
    ];

    // تبدیل تاریخ میلادی به شمسی
    const gregorianToPersian = (dateStr: string): { year: number; month: number; day: number } | null => {
        if (!dateStr) return null;
        try {
            const momentDate = jMoment(dateStr, 'YYYY-MM-DD');
            if (!momentDate.isValid()) {
                return null;
            }

            return {
                year: momentDate.jYear(),
                month: momentDate.jMonth() + 1,
                day: momentDate.jDate()
            };
        } catch (error) {
            console.error("Error converting Gregorian to Persian:", error);
            return null;
        }
    };

    // تبدیل تاریخ شمسی به میلادی
    const persianToGregorian = (jy: number, jm: number, jd: number): string | null => {
        try {
            const momentDate = jMoment(`${jy}/${jm}/${jd}`, 'jYYYY/jM/jD');
            if (!momentDate.isValid()) {
                return null;
            }
            const d=momentDate.format('YYYY-MM-DD');
            console.log(d);
            return d;
        } catch (error) {
            console.error("Error converting Persian to Gregorian:", error);
            return null;
        }
    };

    // دریافت تعداد روزهای یک ماه شمسی
    const getDaysInMonth = (jy: number, jm: number): number => {
        try {
            const momentDate = jMoment(`${jy}/${jm}/1`, 'jYYYY/jM/jD');

            if (!momentDate.isValid()) {
                return 30;
            }

            if (typeof momentDate.jDaysInMonth === 'function') {
                return momentDate.jDaysInMonth();
            } else {
                const nextMonth = jm === 12 ? 1 : jm + 1;
                const nextYear = jm === 12 ? jy + 1 : jy;

                const firstDayNextMonth = jMoment(`${nextYear}/${nextMonth}/1`, 'jYYYY/jM/jD');
                const lastDayThisMonth = firstDayNextMonth.subtract(1, 'day');

                return lastDayThisMonth.jDate();
            }
        } catch (error) {
            console.error("Error getting days in month:", error);
            return 30;
        }
    };

    // محدوده سال‌ها با در نظر گرفتن minDate و maxDate
    const getYearRange = (): number[] => {
        const currentYear = jMoment().jYear();
        let minYear = currentYear - 100;
        let maxYear = currentYear + 10;

        // اعمال محدودیت minDate
        if (minDate) {
            const minPersianDate = gregorianToPersian(minDate);
            if (minPersianDate) {
                minYear = Math.max(minYear, minPersianDate.year);
            }
        }

        // اعمال محدودیت maxDate
        if (maxDate) {
            const maxPersianDate = gregorianToPersian(maxDate);
            if (maxPersianDate) {
                maxYear = Math.min(maxYear, maxPersianDate.year);
            }
        }

        const years = [];
        for (let y = maxYear; y >= minYear; y--) {
            years.push(y);
        }
        return years;
    };

    // ماه‌های قابل انتخاب با در نظر گرفتن minDate و maxDate
    const getAvailableMonths = (selectedYear: number | null): number[] => {
        if (!selectedYear) return Array.from({ length: 12 }, (_, i) => i + 1);

        const months = [];
        for (let m = 1; m <= 12; m++) {
            if (isMonthAllowed(selectedYear, m)) {
                months.push(m);
            }
        }
        return months;
    };

    // روزهای قابل انتخاب با در نظر گرفتن minDate و maxDate
    const getAvailableDays = (selectedYear: number | null, selectedMonth: number | null): number[] => {
        if (!selectedYear || !selectedMonth) {
            return Array.from({ length: 31 }, (_, i) => i + 1);
        }

        const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
        const days = [];

        for (let d = 1; d <= daysInMonth; d++) {
            if (isDayAllowed(selectedYear, selectedMonth, d)) {
                days.push(d);
            }
        }
        return days;
    };

    // بررسی آیا ماه مجاز است
    const isMonthAllowed = (selectedYear: number, selectedMonth: number): boolean => {
        // اگر minDate وجود دارد
        if (minDate) {
            const minPersianDate = gregorianToPersian(minDate);
            if (minPersianDate) {
                if (selectedYear < minPersianDate.year) return false;
                if (selectedYear === minPersianDate.year && selectedMonth < minPersianDate.month) return false;
            }
        }

        // اگر maxDate وجود دارد
        if (maxDate) {
            const maxPersianDate = gregorianToPersian(maxDate);
            if (maxPersianDate) {
                if (selectedYear > maxPersianDate.year) return false;
                if (selectedYear === maxPersianDate.year && selectedMonth > maxPersianDate.month) return false;
            }
        }

        return true;
    };

    // بررسی آیا روز مجاز است
    const isDayAllowed = (selectedYear: number, selectedMonth: number, selectedDay: number): boolean => {
        // اگر minDate وجود دارد
        if (minDate) {
            const minPersianDate = gregorianToPersian(minDate);
            if (minPersianDate) {
                if (selectedYear < minPersianDate.year) return false;
                if (selectedYear === minPersianDate.year && selectedMonth < minPersianDate.month) return false;
                if (selectedYear === minPersianDate.year && selectedMonth === minPersianDate.month && selectedDay < minPersianDate.day) return false;
            }
        }

        // اگر maxDate وجود دارد
        if (maxDate) {
            const maxPersianDate = gregorianToPersian(maxDate);
            if (maxPersianDate) {
                if (selectedYear > maxPersianDate.year) return false;
                if (selectedYear === maxPersianDate.year && selectedMonth > maxPersianDate.month) return false;
                if (selectedYear === maxPersianDate.year && selectedMonth === maxPersianDate.month && selectedDay > maxPersianDate.day) return false;
            }
        }

        return true;
    };

    // فیلتر سال‌ها بر اساس جستجو
    const filteredYears = getYearRange().filter(year =>
        year.toString().includes(yearSearchTerm)
    );

    // فیلتر ماه‌ها بر اساس جستجو
    const availableMonths = getAvailableMonths(year);
    const filteredMonths = persianMonths
        .map((name, index) => ({ value: index + 1, label: name }))
        .filter(month =>
            (month.label.includes(monthSearchTerm) ||
                month.value.toString().includes(monthSearchTerm)) &&
            availableMonths.includes(month.value)
        );

    // فیلتر روزها بر اساس جستجو
    const availableDays = getAvailableDays(year, month);
    const filteredDays = availableDays.filter(day =>
        day.toString().includes(daySearchTerm)
    );

    // اعتبارسنجی تاریخ نهایی
    const validateDateRange = (gregorianDate: string): boolean => {
        if (minDate && gregorianDate < minDate) return false;
        if (maxDate && gregorianDate > maxDate) return false;
        return true;
    };

    // تابع برای ارسال تاریخ فقط زمانی که هر سه بخش کامل شده باشند
    const triggerOnChangeIfComplete = (newYear: number | null, newMonth: number | null, newDay: number | null) => {
        if (newYear && newMonth && newDay) {
            const newDate = persianToGregorian(newYear, newMonth, newDay);
            if (newDate && validateDateRange(newDate)) {
                onChange?.(newDate);
            } else {
                onChange?.(undefined);
            }
        } else {
            onChange?.(undefined);
        }
    };

    // به‌روزرسانی state‌ها با تغییر value
    useEffect(() => {
        if (value) {
            const persianDate = gregorianToPersian(value);
            if (persianDate) {
                setYear(persianDate.year);
                setMonth(persianDate.month);
                setDay(persianDate.day);
                setShowPlaceholders(false);
            }
        } else {
            setYear(null);
            setMonth(null);
            setDay(null);
            setShowPlaceholders(true);
        }
    }, [value]);

    // مدیریت کلیک خارج از مدال‌ها
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (yearModalRef.current && !yearModalRef.current.contains(event.target as Node)) {
                setShowYearModal(false);
                setYearSearchTerm("");
            }
            if (monthModalRef.current && !monthModalRef.current.contains(event.target as Node)) {
                setShowMonthModal(false);
                setMonthSearchTerm("");
            }
            if (dayModalRef.current && !dayModalRef.current.contains(event.target as Node)) {
                setShowDayModal(false);
                setDaySearchTerm("");
            }
        };

        if (showYearModal || showMonthModal || showDayModal) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showYearModal, showMonthModal, showDayModal]);

    // مدیریت انتخاب سال
    const handleYearSelect = (selectedYear: number) => {
        setYear(selectedYear);
        setShowYearModal(false);
        setYearSearchTerm("");
        setShowPlaceholders(false);

        // اگر ماه و روز قبلاً انتخاب شده بودند، بررسی کن که هنوز معتبر هستند
        if (month && !isMonthAllowed(selectedYear, month)) {
            setMonth(null);
        }
        if (day && month && !isDayAllowed(selectedYear, month, day)) {
            setDay(null);
        }

        // اگر هر سه بخش پر شده‌اند، تبدیل را انجام بده
        if (month && day) {
            triggerOnChangeIfComplete(selectedYear, month, day);
        } else {
            onChange?.(undefined);
        }
    };

    // مدیریت انتخاب ماه
    const handleMonthSelect = (selectedMonth: number) => {
        setMonth(selectedMonth);
        setShowMonthModal(false);
        setMonthSearchTerm("");
        setShowPlaceholders(false);

        // اگر روز قبلاً انتخاب شده بود، بررسی کن که هنوز معتبر است
        if (day && year && !isDayAllowed(year, selectedMonth, day)) {
            setDay(null);
        }

        // اگر هر سه بخش پر شده‌اند، تبدیل را انجام بده
        if (year && day) {
            triggerOnChangeIfComplete(year, selectedMonth, day);
        } else {
            onChange?.(undefined);
        }
    };

    // مدیریت انتخاب روز
    const handleDaySelect = (selectedDay: number) => {
        setDay(selectedDay);
        setShowDayModal(false);
        setDaySearchTerm("");
        setShowPlaceholders(false);

        // اگر هر سه بخش پر شده‌اند، تبدیل را انجام بده
        if (year && month) {
            triggerOnChangeIfComplete(year, month, selectedDay);
        } else {
            onChange?.(undefined);
        }
    };

    // مدیریت فوکوس
    const handleFocus = () => {
        setIsFocused(true);
        if (showPlaceholders) {
            setShowPlaceholders(false);
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        if (!year && !month && !day) {
            setShowPlaceholders(true);
        }
    };

    // مدیریت کلیک روی فیلدها
    const handleYearFieldClick = () => {
        if (!disabled) {
            setShowYearModal(true);
        }
    };

    const handleMonthFieldClick = () => {
        if (!disabled) {
            setShowMonthModal(true);
        }
    };

    const handleDayFieldClick = () => {
        if (!disabled) {
            setShowDayModal(true);
        }
    };

    // مدیریت جستجو
    const handleYearSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) {
            setYearSearchTerm(value);
        }
    };

    const handleMonthSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMonthSearchTerm(e.target.value);
    };

    const handleDaySearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) {
            setDaySearchTerm(value);
        }
    };

    return (
        <>
            <div
                dir={"ltr"}
                className={cn(
                    "relative flex items-center w-full h-12 rounded-md border border-gray-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                    disabled && "opacity-50 cursor-not-allowed",
                    className
                )}
                onFocus={handleFocus}
                onBlur={handleBlur}
                tabIndex={disabled ? -1 : 0}
            >
                <div className="flex w-full h-full pl-10">
                    {/* فیلد سال */}
                    <div className="flex-1">
                        <div
                            onClick={handleYearFieldClick}
                            className={cn(
                                "w-full h-full flex items-center justify-center border-0 bg-transparent text-center cursor-pointer text-base transition-colors",
                                showPlaceholders && "invisible",
                                !year ? "text-gray-400 hover:text-gray-600" : "text-gray-900"
                            )}
                        >
                            {year || "سال"}
                        </div>
                    </div>

                    <div className="flex items-center justify-center text-gray-400 text-base">/</div>

                    {/* فیلد ماه */}
                    <div className="flex-1">
                        <div
                            onClick={handleMonthFieldClick}
                            className={cn(
                                "w-full h-full flex items-center justify-center border-0 bg-transparent text-center cursor-pointer text-base transition-colors",
                                showPlaceholders && "invisible",
                                !month ? "text-gray-400 hover:text-gray-600" : "text-gray-900"
                            )}
                        >
                            {month ? persianMonths[month - 1] : "ماه"}
                        </div>
                    </div>

                    <div className="flex items-center justify-center text-gray-400 text-base">/</div>

                    {/* فیلد روز */}
                    <div className="flex-1">
                        <div
                            onClick={handleDayFieldClick}
                            className={cn(
                                "w-full h-full flex items-center justify-center border-0 bg-transparent text-center cursor-pointer text-base transition-colors",
                                showPlaceholders && "invisible",
                                !day ? "text-gray-400 hover:text-gray-600" : "text-gray-900"
                            )}
                        >
                            {day || "روز"}
                        </div>
                    </div>
                </div>

                {showPlaceholders && (
                    <div className="absolute inset-0 flex items-center justify-end text-base pointer-events-none pr-2 text-gray-500 truncate">
                        {placeholder}
                    </div>
                )}

                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                </div>
            </div>

            {/* مدال انتخاب سال */}
            {showYearModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div
                        ref={yearModalRef}
                        className="bg-white rounded-lg shadow-xl w-11/12 max-w-2xl max-h-[90vh] overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold">انتخاب سال</h3>
                            <button
                                onClick={() => setShowYearModal(false)}
                                className="p-1 hover:bg-gray-100 rounded-full"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-4 border-b">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={yearSearchTerm}
                                    onChange={handleYearSearchChange}
                                    placeholder={searchYearTitle}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-base text-left"
                                    dir="ltr"
                                    inputMode="numeric"
                                />
                            </div>
                        </div>

                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            <div className="grid grid-cols-5 gap-2">
                                {filteredYears.map((yearItem) => (
                                    <button
                                        key={yearItem}
                                        onClick={() => handleYearSelect(yearItem)}
                                        className={cn(
                                            "p-3 rounded-md border text-base transition-colors",
                                            year === yearItem
                                                ? "bg-blue-500 text-white border-blue-500"
                                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                        )}
                                    >
                                        {yearItem}
                                    </button>
                                ))}
                            </div>
                            {filteredYears.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    سالی یافت نشد
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* مدال انتخاب ماه */}
            {showMonthModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div
                        ref={monthModalRef}
                        className="bg-white rounded-lg shadow-xl w-11/12 max-w-md max-h-[80vh] overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold">انتخاب ماه</h3>
                            <button
                                onClick={() => setShowMonthModal(false)}
                                className="p-1 hover:bg-gray-100 rounded-full"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-4 border-b">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={monthSearchTerm}
                                    onChange={handleMonthSearchChange}
                                    placeholder="جستجوی ماه..."
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-base"
                                />
                            </div>
                        </div>

                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            <div className="grid grid-cols-3 gap-3">
                                {filteredMonths.map((monthItem) => (
                                    <button
                                        key={monthItem.value}
                                        onClick={() => handleMonthSelect(monthItem.value)}
                                        className={cn(
                                            "p-4 rounded-md border text-base transition-colors",
                                            month === monthItem.value
                                                ? "bg-blue-500 text-white border-blue-500"
                                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                        )}
                                    >
                                        {monthItem.label}
                                    </button>
                                ))}
                            </div>
                            {filteredMonths.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    ماهی یافت نشد
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* مدال انتخاب روز */}
            {showDayModal && (
                <div dir={'ltr'} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div
                        ref={dayModalRef}
                        className="bg-white rounded-lg shadow-xl w-11/12 max-w-md max-h-[80vh] overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold">انتخاب روز</h3>
                            <button
                                onClick={() => setShowDayModal(false)}
                                className="p-1 hover:bg-gray-100 rounded-full"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-4 border-b">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={daySearchTerm}
                                    onChange={handleDaySearchChange}
                                    placeholder="جستجوی روز..."
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-base text-left"
                                    dir="ltr"
                                    inputMode="numeric"
                                />
                            </div>
                        </div>

                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            <div className="grid grid-cols-7 gap-2">
                                {filteredDays.map((dayItem) => (
                                    <button
                                        key={dayItem}
                                        onClick={() => handleDaySelect(dayItem)}
                                        className={cn(
                                            "aspect-square w-10 h-10 flex items-center justify-center rounded-md border text-base transition-colors",
                                            day === dayItem
                                                ? "bg-blue-500 text-white border-blue-500"
                                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                        )}
                                    >
                                        {dayItem}
                                    </button>
                                ))}
                            </div>
                            {filteredDays.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    روزی یافت نشد
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PersianDate;