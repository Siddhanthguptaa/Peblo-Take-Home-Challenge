import { prismaClient } from "@repo/db/client";
import { Request, Response } from "express";

export const getUserTags = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const tags = await prismaClient.tag.findMany({
      where: { userId: Number(userId) },
      include: {
        _count: { select: { notes: true } },
      },
      orderBy: { notes: { _count: "desc" } },
    });

    const formatted = tags.map(t => ({
      id: t.id,
      name: t.name,
      count: t._count.notes,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({ message: "Failed to fetch tags" });
  }
};

export const setRoomTags = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { roomId } = req.params;
    const { tags: tagNames } = req.body;

    if (!userId || !roomId || !Array.isArray(tagNames)) {
      res.status(400).json({ message: "Invalid request" });
      return;
    }

    // Verify user owns this room
    const room = await prismaClient.room.findFirst({
      where: { id: Number(roomId), adminId: Number(userId) },
    });

    if (!room) {
      res.status(404).json({ message: "Room not found" });
      return;
    }

    // Clean tag names
    const cleaned = [
      ...new Set(
        tagNames
          .map((n: string) => n.trim().toLowerCase())
          .filter(Boolean)
      ),
    ];

    // Upsert tags
    const upsertedTags = await Promise.all(
      cleaned.map(name =>
        prismaClient.tag.upsert({
          where: { name_userId: { name, userId: Number(userId) } },
          update: {},
          create: { name, userId: Number(userId) },
        })
      )
    );

    // Delete old tag links
    await prismaClient.noteTag.deleteMany({ where: { noteId: Number(roomId) } });

    // Create new links
    if (upsertedTags.length > 0) {
      await prismaClient.noteTag.createMany({
        data: upsertedTags.map(tag => ({
          noteId: Number(roomId),
          tagId: tag.id,
        })),
        skipDuplicates: true,
      });
    }

    res.json({ tags: upsertedTags });
  } catch (error) {
    console.error("Error setting tags:", error);
    res.status(500).json({ message: "Failed to set tags" });
  }
};
