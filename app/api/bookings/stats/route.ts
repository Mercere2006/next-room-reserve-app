import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const roomId = searchParams.get("roomId");

    if (!from || !to) {
      return Response.json({ message: "ต้องระบุทั้ง from และ to" }, { status: 400 });
    }

    const where = {
      startTime: { gte: new Date(from), lt: new Date(to) },
      ...(roomId && { roomId: Number(roomId) }),
    };

    const bookings = await prisma.booking.findMany({ where });

    const statsMap: Record<number, { count: number; totalHours: number }> = {};
    bookings.forEach((b) => {
      const hours = (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / (1000 * 60 * 60);
      if (!statsMap[b.roomId]) statsMap[b.roomId] = { count: 0, totalHours: 0 };
      statsMap[b.roomId].count += 1;
      statsMap[b.roomId].totalHours += hours;
    });

    return Response.json(statsMap, { status: 200 });
  } catch (error) {
    console.error("stats Error:", error);
    return Response.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}