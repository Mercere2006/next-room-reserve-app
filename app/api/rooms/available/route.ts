import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");
    const attendeeCount = searchParams.get("attendeeCount");

    if (!startTime || !endTime) {
      return Response.json({ message: "ต้องระบุ startTime และ endTime" }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    const busyBookings = await prisma.booking.findMany({
      where: {
        AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
      },
      select: { roomId: true },
    });

    const busyRoomIds = busyBookings.map((b) => b.roomId);

    const roomWhere = {
      id: { notIn: busyRoomIds },
      ...(attendeeCount && {
        capacity: { gte: Number(attendeeCount) },
      }),
    };

    const availableRooms = await prisma.room.findMany({ where: roomWhere });
    return Response.json(availableRooms, { status: 200 });
  } catch (error) {
    console.error("Available Error:", error);
    return Response.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}