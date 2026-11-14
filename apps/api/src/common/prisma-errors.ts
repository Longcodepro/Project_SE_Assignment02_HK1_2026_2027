// Prisma P2025: lệnh update/delete không tìm thấy dòng nào
export const isRecordNotFound = (e: unknown) => (e as { code?: string } | null)?.code === 'P2025';
