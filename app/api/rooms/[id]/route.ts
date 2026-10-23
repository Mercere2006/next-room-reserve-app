import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const room = await prisma.room.findUnique({ where: { id: Number(id) } });
    if (!room) return Response.json({ message: "ไม่พบห้องประชุม" }, { status: 404 });
    return Response.json(room, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const roomId = Number(id);
    const body = await request.json();
    const { roomCode, roomName, capacity, location } = body;

    const existingRoom = await prisma.room.findUnique({ where: { id: roomId } });
    if (!existingRoom) return Response.json({ message: "ไม่พบห้องประชุม" }, { status: 404 });

    if (roomCode && roomCode !== existingRoom.roomCode) {
      const duplicateCode = await prisma.room.findUnique({ where: { roomCode } });
      if (duplicateCode) return Response.json({ message: "รหัสห้องซ้ำ" }, { status: 400 });
    }

    if (capacity !== undefined) {
      if (typeof capacity !== "number" || capacity <= 0) {
        return Response.json({ message: "ต้องเป็นจำนวนเต็มมากกว่า 0" }, { status: 400 });
      }

      const activeBookings = await prisma.booking.findMany({
        where: { roomId, endTime: { gt: new Date() } },
      });
      const maxAttendees = activeBookings.reduce((max, b) => Math.max(max, b.attendeeCount), 0);
      if (capacity < maxAttendees) {
        return Response.json(
          { message: `ห้ามลดความจุต่ำกว่า ${maxAttendees} ตามรายการจองที่ยังไม่สิ้นสุด` },
          { status: 400 }
        );
      }
    }

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: { roomCode, roomName, capacity, location },
    });
    return Response.json(updatedRoom, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const roomId = Number(id);

    const bookingCount = await prisma.booking.count({ where: { roomId } });
    if (bookingCount > 0) {
      return Response.json({ message: "มีรายการจองอยู่ในระบบ ไม่สามารถลบได้" }, { status: 409 });
    }

    await prisma.room.delete({ where: { id: roomId } });
    return Response.json({ message: "ลบห้องประชุมเรียบร้อยแล้ว" }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}