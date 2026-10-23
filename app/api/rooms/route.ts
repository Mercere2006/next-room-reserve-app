import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomCode, roomName, capacity, location } = body;

    if (!roomCode || !roomName || capacity === undefined || !location) {
      return Response.json({ message: "ข้อความห้ามว่าง" }, { status: 400 });
    }
    if (typeof capacity !== "number" || capacity <= 0) {
      return Response.json({ message: "capacity ต้องมากกว่า 0" }, { status: 400 });
    }

    const existingRoom = await prisma.room.findUnique({ where: { roomCode } });
    if (existingRoom) {
      return Response.json({ message: "รหัสห้องซ้ำ" }, { status: 400 });
    }

    const room = await prisma.room.create({
      data: { roomCode, roomName, capacity, location },
    });
    return Response.json(room, { status: 201 });
  } catch (error) {
    console.error("Rooms Error:", error);
    return Response.json({ message: "เกิดข้อผิดพลาดในการเพิ่มห้อง" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const minCapacity = searchParams.get("minCapacity");

    const where = {
      ...(search && {
        OR: [
          { roomName: { contains: search } },
          { location: { contains: search } },
        ],
      }),
      ...(minCapacity && {
        capacity: { gte: Number(minCapacity) },
      }),
    };

    const rooms = await prisma.room.findMany({ where });
    return Response.json(rooms, { status: 200 });
  } catch (error) {
    console.error("Failed for :", error);
    return Response.json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 });
  }
}