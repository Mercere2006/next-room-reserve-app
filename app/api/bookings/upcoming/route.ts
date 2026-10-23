import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get("days") || "7";
    const roomId = searchParams.get("roomId");

    const days = Math.min(Math.max(Number(daysParam), 1), 30);
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    const where = {
      startTime: { gte: now, lte: futureDate },
      ...(roomId && { roomId: Number(roomId) }),
    };

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { startTime: "asc" },
      include: { room: true },
    });
    return Response.json(bookings, { status: 200 });
  } catch (error) {
    console.error("upcoming Error:", error);
    return Response.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}