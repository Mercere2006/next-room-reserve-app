import prisma from "@/lib/prisma";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const before = searchParams.get("before");

    if (!roomId || !before) {
      return Response.json({ message: "ต้องระบุ roomId และ before" }, { status: 400 });
    }

    const beforeDate = new Date(before);
    if (beforeDate > new Date()) {
      return Response.json({ message: "before ต้องไม่เกินเวลาปัจจุบัน" }, { status: 400 });
    }

    const result = await prisma.booking.deleteMany({
      where: {
        roomId: Number(roomId),
        endTime: { lt: beforeDate },
      },
    });

    return Response.json({ deletedCount: result.count }, { status: 200 });
  } catch (error) {
    console.error("deleted Expired Error:", error);
    return Response.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}