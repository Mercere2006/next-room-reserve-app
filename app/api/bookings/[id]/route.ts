import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id: Number(id) },
      include: { room: true },
    });

    if (!booking) return Response.json({ message: "ไม่พบรายการจอง" }, { status: 404 });
    return Response.json(booking, { status: 200 });
  } catch (error) {
    console.error("Failed for :", error);
    return Response.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookingId = Number(id);
    const body = await request.json();

    const existing = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!existing) return Response.json({ message: "ไม่พบรายการจอง" }, { status: 404 });

    if (new Date(existing.startTime) <= new Date()) {
      return Response.json({ message: "ไม่สามารถแก้ไขการจองที่เริ่มไปแล้วได้" }, { status: 400 });
    }

    const roomId = body.roomId ? Number(body.roomId) : existing.roomId;
    const startTime = body.startTime ? new Date(body.startTime) : existing.startTime;
    const endTime = body.endTime ? new Date(body.endTime) : existing.endTime;
    const attendeeCount = body.attendeeCount !== undefined ? Number(body.attendeeCount) : existing.attendeeCount;

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return Response.json({ message: "ไม่พบห้องประชุม" }, { status: 404 });
    if (attendeeCount > room.capacity) return Response.json({ message: "จำนวนคนเกินความจุห้อง" }, { status: 400 });

    const overlapping = await prisma.booking.findFirst({
      where: {
        id: { not: bookingId },
        roomId,
        AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
      },
    });
    if (overlapping) return Response.json({ message: "เวลาการจองทับซ้อน" }, { status: 400 });

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { ...body, roomId, startTime, endTime, attendeeCount },
    });
    return Response.json(updated, { status: 200 });
  } catch (error) {
    console.error("Failed to update booking:", error);
    return Response.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookingId = Number(id);

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return Response.json({ message: "ไม่พบรายการจอง" }, { status: 404 });

    if (new Date(booking.startTime) <= new Date()) {
      return Response.json({ message: "ไม่สามารถยกเลิกการจองที่เริ่มไปแล้วได้" }, { status: 409 });
    }

    await prisma.booking.delete({ where: { id: bookingId } });
    return Response.json({ message: "ยกเลิกการจองเรียบร้อยแล้ว" }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete booking:", error);
    return Response.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}