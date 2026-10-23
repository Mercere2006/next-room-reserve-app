import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, bookerName, purpose, startTime, endTime, attendeeCount } = body;

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start <= new Date()) return Response.json({ message: "เวลาเริ่มต้องเป็นอนาคต" }, { status: 400 });
    if (start >= end) return Response.json({ message: "เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด" }, { status: 400 });

    const room = await prisma.room.findUnique({ where: { id: Number(roomId) } });
    if (!room) return Response.json({ message: "ไม่พบห้องประชุม" }, { status: 404 });
    if (attendeeCount > room.capacity) return Response.json({ message: "จำนวนคนเกินความจุห้อง" }, { status: 400 });

    const overlapping = await prisma.booking.findFirst({
      where: {
        roomId: Number(roomId),
        AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
      },
    });
    if (overlapping) return Response.json({ message: "เวลาจองทับซ้อน" }, { status: 400 });

    const booking = await prisma.booking.create({
      data: { roomId: Number(roomId), bookerName, purpose, startTime: start, endTime: end, attendeeCount: Number(attendeeCount) },
    });
    return Response.json(booking, { status: 201 });
  } catch (error) {
    console.error("bookings Error:", error);
    return Response.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      include: { room: true },
      orderBy: { startTime: "asc" },
    });
    return Response.json(bookings, { status: 200 });
  } catch (error) {
    console.error("bookings Error:", error);
    return Response.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}