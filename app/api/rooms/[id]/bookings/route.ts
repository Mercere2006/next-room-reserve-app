import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if ((from && !to) || (!from && to)) {
      return Response.json({ message: "ต้องส่งทั้ง from และ to หรือไม่ส่งเลย" }, { status: 400 });
    }

    const where = {
      roomId: Number(id),
      ...(from && to && {
        AND: [
          { startTime: { lt: new Date(to) } },
          { endTime: { gt: new Date(from) } },
        ],
      }),
    };

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { startTime: "asc" },
    });
    return Response.json(bookings, { status: 200 });
  } catch (error) {
    console.error("Bookings Error:", error);
    return Response.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}