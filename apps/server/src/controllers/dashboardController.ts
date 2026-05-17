import { CreateRoomSchema } from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
import { generateAlphanumericCode } from "../utils/genSecret";
import { Request,Response } from "express";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

export const createRoomController = async (req:Request, res:Response) => {
  const parsedData = CreateRoomSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "Incorrect Inputs"
    })
    return;
  }

  const userId = req.userId;
  if (typeof userId !== "number") {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const code8Digits = generateAlphanumericCode();
  try {
    const room = await prismaClient.room.create({
      data: {
        slug: parsedData.data.name,
        adminId: userId,
        secretCode: code8Digits
      }
    })

    await prismaClient.roomMembership.create({
      data: {
        userId,
        roomId: room.id,
      },
    });
    res.json({
      roomId: room.id,
      secretCode: room.secretCode,
    })
  } catch (e) {
    res.status(411).json({
      message: "Room already exists with this name"
    })
  }
}

export const getAllRoomController = async (req:Request, res:Response) => {
  try {
    //@ts-ignore
    const userId: number = req.userId;
    const rooms = await prismaClient.room.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        admin: true,
      },
    });

    if (rooms.length === 0) {
      res.status(404).json({
        message: "No rooms found"
      })
      return;
    }
    res.json({
      rooms: rooms
    })
  } catch (e) {
    res.status(411).json({
      message: "Some error occured"
    })
  }
}

export const joinRoomByCodeController = async (req:Request, res:Response) => {
  const { secretCode } = req.body;

  if (!secretCode) {
    res.status(400).json({ message: "Secret code is required" });
    return;
  }
  //@ts-ignore
  const userId: number = req.userId;

  try {
    const room = await prismaClient.room.findUnique({
      where: { secretCode },
    });

    if (!room) {
      res.status(404).json({ message: "Room not found with provided code" });
      return;
    }

    const existingMembership = await prismaClient.roomMembership.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId: room.id,
        },
      },
    });

    if (!existingMembership) {
      await prismaClient.roomMembership.create({
        data: {
          userId,
          roomId: room.id,
        },
      });
    }

    res.json({ room });
    return;
  } catch (err: any) {

    res.status(500).json({ message: "Internal server error" });
    return;
  }
}

export const joinRoomByIdController = async (req:Request, res:Response) => {
  try {
    const roomId = parseInt(req.params.id as string);
    if (isNaN(roomId)) {
      res.status(400).json({ message: "Invalid room ID" });
      return;
    }

    //@ts-ignore
    const userId = req.userId;

    const room = await prismaClient.room.findFirst({
      where: {
        id: roomId,
        members: {
          some: {
            userId: userId,
          },
        },
      },
    });

    if (!room) {
      res.status(403).json({ message: "Access denied or room not found" });
      return;
    }

    res.json({ room });
  } catch (err) {

    res.status(500).json({ message: "Internal server error" });
  }
}

// ─── Dashboard & Insights ────────────────────────────────────────────────────

export const getDashboardController = async (req: Request, res: Response) => {
  try {
    //@ts-ignore
    const userId: number = req.userId;

    const [
      totalRooms,
      archivedRooms,
      recentRooms,
      topTags,
      aiStats,
      weeklyActivity,
    ] = await Promise.all([
      prismaClient.room.count({
        where: { adminId: userId, isArchived: false },
      }),

      prismaClient.room.count({
        where: { adminId: userId, isArchived: true },
      }),

      prismaClient.room.findMany({
        where: { adminId: userId, isArchived: false },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { id: true, title: true, updatedAt: true },
      }),

      getTopTags(userId),
      getAIStats(userId),
      getWeeklyActivity(userId),
    ]);

    res.json({
      totalRooms,
      archivedRooms,
      recentRooms,
      topTags,
      aiStats,
      weeklyActivity,
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    res.status(500).json({ message: "Failed to fetch dashboard" });
  }
};

async function getTopTags(userId: number) {
  const tags = await prismaClient.tag.findMany({
    where: { userId },
    include: { _count: { select: { notes: true } } },
    orderBy: { notes: { _count: "desc" } },
    take: 8,
  });
  return tags.map(t => ({ name: t.name, count: t._count.notes }));
}

async function getAIStats(userId: number) {
  const [total, byType, tokens] = await Promise.all([
    prismaClient.aIOutput.count({ where: { userId } }),
    prismaClient.aIOutput.groupBy({
      by: ["type"],
      where: { userId },
      _count: { type: true },
    }),
    prismaClient.aIOutput.aggregate({
      where: { userId },
      _sum: { tokensUsed: true },
    }),
  ]);

  return {
    totalCalls: total,
    totalTokensUsed: tokens._sum.tokensUsed ?? 0,
    byType: byType.map(b => ({ type: b.type, count: b._count.type })),
  };
}

async function getWeeklyActivity(userId: number) {
  const days = Array.from({ length: 7 }, (_, i) =>
    subDays(new Date(), 6 - i)
  );

  const activity = await Promise.all(
    days.map(async day => ({
      date: format(day, "EEE"),
      count: await prismaClient.room.count({
        where: {
          adminId: userId,
          updatedAt: {
            gte: startOfDay(day),
            lte: endOfDay(day),
          },
        },
      }),
    }))
  );

  return activity;
}

export const getAIHistoryController = async (req: Request, res: Response) => {
  try {
    //@ts-ignore
    const userId: number = req.userId;
    const { roomId } = req.params;

    if (!roomId) {
      res.status(400).json({ message: "Invalid request" });
      return;
    }

    const history = await prismaClient.aIOutput.findMany({
      where: { roomId: Number(roomId), userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    res.json(history);
  } catch (error) {
    console.error("Error fetching AI history:", error);
    res.status(500).json({ message: "Failed to fetch AI history" });
  }
}