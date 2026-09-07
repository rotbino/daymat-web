interface OtpTimerProps {
    totalTime: number;       // کل زمان OTP بر حسب ثانیه
    currentTime: number;     // مقدار فعلی ثانیه
    size?: number;
    emptyColor?: string;     // رنگ دایره خالی
    color?: string;      // رنگ دور دایره (بیرونی)
    textColor?: string;      // رنگ متن وسط (اختیاری، اگر نخوای خودش کانتینر میگیره)
}

export default function Timer({
                                  totalTime = 120,
                                  currentTime,
                                  size = 100,
                                  emptyColor = "rgba(245, 245, 245, 0.3)",
                                  color = "#F59E0B",
                                  textColor= "#3a3836",
                              }: OtpTimerProps) {
    if (currentTime <= 0) return null;

    const radius = size / 2;
    const stroke = size * 0.1; // ضخامت دایره
    const normalizedRadius = radius - stroke;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset =
        circumference - (currentTime / totalTime) * circumference;

    return (
        <div
            className="flex flex-col items-center justify-center"
            style={{ color: textColor || "currentColor" }} // متن وسط از کانتینر می‌گیره اگر textColor پاس داده نشده
        >
            <svg height={size} width={size}>
                {/* دایره خالی */}
                <circle
                    stroke={emptyColor}       // رنگ دایره خالی
                    fill="currentColor"       // رنگ وسط از والد گرفته می‌شود
                    fillOpacity={0.1}         // کمرنگ بودن
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />

                {/* دایره پر شده */}
                <circle
                    stroke={color}
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={`${circumference} ${circumference}`}
                    style={{strokeDashoffset}}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    transform={`rotate(-90 ${radius} ${radius})`}
                />
                {/* متن وسط */}
                <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dy="0.3em"
                    fontSize={size * 0.32}
                    fill="currentColor" // همون رنگ کانتینر یا textColor
                    fontWeight="bold"
                >
                    {currentTime}
                </text>
            </svg>
        </div>
    );
}
