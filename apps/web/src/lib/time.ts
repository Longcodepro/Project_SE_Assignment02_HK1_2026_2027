// Khoảng cách thời gian từ lúc khách đặt món. Hàm thuần túy (nhận mốc thời gian vào) để qua luật prerender của Next.js
export function getWaitingTime(dateStr: string, currentTimestamp: number | null): string {
    if (!currentTimestamp) return 'Đang tải...';
    const diffMs = Math.max(0, currentTimestamp - new Date(dateStr).getTime());
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Vừa đặt';
    if (diffMins >= 60) return `${Math.floor(diffMins / 60)}h ${diffMins % 60}p`;
    return `${diffMins} phút trước`;
}
