// components/DateSelector.tsx
"use client";
import React from "react";
import DatePicker, { DatePickerProps, DateObject } from "react-multi-date-picker";
import { X } from "lucide-react";

// calendars & locales
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";
import arabic from "react-date-object/calendars/arabic";
import arabic_ar from "react-date-object/locales/arabic_ar";
import jMoment from "moment-jalaali";

interface DateSelectorProps
    extends Omit<DatePickerProps, "calendar" | "locale" | "value" | "onChange"> {
    lang?: "fa" | "en" | "ar";
    className?: string;
    placeholder?: string;
    value?: string;
    onChange?: (val: string | null) => void;
    clearable?: boolean;
    format?: string;
    defaultValue?: string;
}

const DateSelector: React.FC<DateSelectorProps> = ({
                                                       lang = "fa",
                                                       className = "",
                                                       placeholder = "",
                                                       value,
                                                       onChange,
                                                       clearable = true,
                                                       format = "YYYY-MM-DD",
                                                       defaultValue,
                                                       ...props
                                                   }) => {
    const getCalendarConfig = () => {
        switch (lang) {
            case "fa":
                return { calendar: persian, locale: persian_fa };
            case "ar":
                return { calendar: arabic, locale: arabic_ar };
            default:
                return { calendar: gregorian, locale: gregorian_en };
        }
    };

    const { calendar, locale } = getCalendarConfig();

    const getInputFormat = () => {
        if (format.includes("HH:mm:ss")) {
            return lang === "fa" ? "YYYY/MM/DD HH:mm:ss" : "YYYY-MM-DD HH:mm:ss";
        } else if (format.includes("HH:mm")) {
            return lang === "fa" ? "YYYY/MM/DD HH:mm" : "YYYY-MM-DD HH:mm";
        } else {
            return lang === "fa" ? "YYYY/MM/DD" : "YYYY-MM-DD";
        }
    };

    const parseISODate = (isoDate: string) => {
        if (!isoDate) return null;

        try {
            const dateObj = new DateObject({
                date: isoDate,
                format: format,
                calendar: gregorian,
                locale: gregorian_en,
            });

            if (!dateObj.isValid) {
                console.warn('Invalid date:', isoDate);
                return null;
            }

            return dateObj.convert(calendar);
        } catch (error) {
            console.error('Error parsing date:', error, isoDate);
            return null;
        }
    };

    const convertToFormatted = (dateObj: DateObject) => {
        if (!dateObj || !dateObj.isValid) return null;

        try {
            const gregorianDate = dateObj.convert(gregorian);
            const date = new Date(
                gregorianDate.year,
                gregorianDate.month - 1,
                gregorianDate.day,
                gregorianDate.hour || 0,
                gregorianDate.minute || 0,
                gregorianDate.second || 0
            );

            return jMoment(date).format(format);
        } catch (error) {
            console.error('Error formatting date:', error);
            return null;
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onChange?.(null);
    };

    const getFinalValue = () => {
        if (value) return parseISODate(value);
        if (defaultValue) return parseISODate(defaultValue);
        return null;
    };

    return (
        <div className="relative w-full">
            <DatePicker
                {...props}
                calendar={calendar}
                locale={locale}
                placeholder={placeholder}
                inputClass={`w-full h-12 px-4 pr-[35px] border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${className}`}
                containerClassName="w-full z-[99999]"
                calendarPosition="bottom-right"
                format={getInputFormat()}
                value={getFinalValue()}
                onChange={(dateObj) => {
                    if (!dateObj) {
                        onChange?.(null);
                        return;
                    }

                    const selectedDate = Array.isArray(dateObj) ? dateObj[0] : dateObj;

                    if (selectedDate && selectedDate.isValid) {
                        const formatted = convertToFormatted(selectedDate as DateObject);
                        if (formatted) {
                            onChange?.(formatted);
                        }
                    } else {
                        onChange?.(null);
                    }
                }}
            />
            {value && clearable && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                    <X className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};

export default DateSelector;