import { prismaClient } from "@repo/db/client";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { ai } from "../lib/geminiAPI";

// ─── Archive functionality ────────────────────────────────────────────────────

export const toggleArchive = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { roomId } = req.params;
    const { isArchived } = req.body;

    if (!userId || !roomId) {
      res.status(400).json({ message: "Invalid request" });
      return;
    }

    const room = await prismaClient.room.findFirst({
      where: { id: Number(roomId), adminId: Number(userId) },
    });

    if (!room) {
      res.status(403).json({ message: "Only the room admin can archive it" });
      return;
    }

    const updated = await prismaClient.room.update({
      where: { id: Number(roomId) },
      data: { isArchived: Boolean(isArchived) },
      include: {
        tags: { include: { tag: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error toggling archive:", error);
    res.status(500).json({ message: "Failed to toggle archive" });
  }
};

// ─── Share functionality ──────────────────────────────────────────────────────

export const toggleShare = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { roomId } = req.params;

    if (!userId || !roomId) {
      res.status(400).json({ message: "Invalid request" });
      return;
    }

    const room = await prismaClient.room.findFirst({
      where: { id: Number(roomId), adminId: Number(userId) },
    });

    if (!room) {
      res.status(403).json({ message: "Only the room admin can share it" });
      return;
    }

    if (room.isPublic) {
      // Disable sharing
      const updated = await prismaClient.room.update({
        where: { id: Number(roomId) },
        data: { isPublic: false, shareId: null },
      });
      res.json(updated);
    } else {
      // Enable sharing
      const shareId = room.shareId ?? uuidv4();
      const updated = await prismaClient.room.update({
        where: { id: Number(roomId) },
        data: { isPublic: true, shareId },
      });
      res.json(updated);
    }
  } catch (error) {
    console.error("Error toggling share:", error);
    res.status(500).json({ message: "Failed to toggle share" });
  }
};

export const getSharedRoom = async (req: Request, res: Response) => {
  try {
    const shareId = req.params.shareId as string;

    const room = await prismaClient.room.findFirst({
      where: { shareId, isPublic: true },
      include: {
        admin: { select: { name: true } },
      },
    });

    if (!room) {
      res.status(404).json({ message: "Room not found or not public" });
      return;
    }

    res.json({
      id: room.id,
      title: room.title,
      content: room.content,
      author: room.admin.name,
      updatedAt: room.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching shared room:", error);
    res.status(500).json({ message: "Failed to fetch room" });
  }
};

// ─── AI functionality ─────────────────────────────────────────────────────────

const saveAIOutput = async (
  roomId: number,
  userId: number,
  type: "SUMMARY" | "ACTION_ITEMS" | "TITLE_SUGGESTION" | "GRAMMAR_CHECK",
  inputContent: string,
  output: object,
  tokensUsed = 0
) => {
  const inputHash = crypto.createHash("md5").update(inputContent).digest("hex");

  return prismaClient.aIOutput.create({
    data: {
      roomId,
      userId,
      type,
      inputHash,
      output: output as any,
      tokensUsed,
    },
  });
};

export const generateActionItems = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { roomId } = req.params;

    if (!userId || !roomId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const room = await prismaClient.room.findFirst({
      where: { id: Number(roomId) },
    });

    if (!room) {
      res.status(404).json({ message: "Room not found" });
      return;
    }

    const prompt = `
You are a productivity assistant. Extract all action items, tasks, and to-dos from the note below.
Respond ONLY with valid JSON — no explanation, no markdown.

Note:
${room.content}

JSON format:
{
  "actionItems": ["First action item", "Second action item"]
}

If there are no action items, return: { "actionItems": [] }
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const resultText = response.candidates?.[0]?.content?.parts?.[0]?.text || '{"actionItems": []}';
    let resultJson;
    try {
      resultJson = JSON.parse(resultText);
    } catch {
      resultJson = { actionItems: [] };
    }

    res.status(200).json(resultJson);

    await saveAIOutput(
      Number(roomId),
      Number(userId),
      "ACTION_ITEMS",
      room.content,
      resultJson
    );
  } catch (error) {
    console.error("Error generating action items:", error);
    res.status(500).json({ message: "Failed to generate action items" });
  }
};

export const suggestTitle = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { roomId } = req.params;

    if (!userId || !roomId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const room = await prismaClient.room.findFirst({
      where: { id: Number(roomId) },
    });

    if (!room) {
      res.status(404).json({ message: "Room not found" });
      return;
    }

    const prompt = `
Suggest a short, descriptive title for the note below.
Respond ONLY with valid JSON — no explanation, no markdown.

Note:
${room.content}

JSON format:
{
  "suggestedTitle": "Your suggested title"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const resultText = response.candidates?.[0]?.content?.parts?.[0]?.text || '{"suggestedTitle": ""}';
    let resultJson;
    try {
      resultJson = JSON.parse(resultText);
    } catch {
      resultJson = { suggestedTitle: "" };
    }

    res.status(200).json(resultJson);

    await saveAIOutput(
      Number(roomId),
      Number(userId),
      "TITLE_SUGGESTION",
      room.content,
      resultJson
    );
  } catch (error) {
    console.error("Error suggesting title:", error);
    res.status(500).json({ message: "Failed to suggest title" });
  }
};

// ─── Search and filter ────────────────────────────────────────────────────────

export const searchRooms = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { search, tags: tagParam, archived, sort } = req.query;

    const tagNames =
      typeof tagParam === "string"
        ? tagParam
            .split(",")
            .map(t => t.trim())
            .filter(Boolean)
        : [];

    const rooms = await prismaClient.room.findMany({
      where: {
        adminId: Number(userId),
        isArchived: archived === "true",
        ...(search && {
          OR: [
            { title: { contains: search as string, mode: "insensitive" } },
            { content: { contains: search as string, mode: "insensitive" } },
          ],
        }),
        ...(tagNames.length && {
          tags: {
            some: {
              tag: { name: { in: tagNames } },
            },
          },
        }),
      },
      include: {
        tags: { include: { tag: true } },
        aiOutputs: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy:
        sort === "created"
          ? { id: "desc" }
          : { updatedAt: "desc" },
    });

    res.json(rooms);
  } catch (error) {
    console.error("Error searching rooms:", error);
    res.status(500).json({ message: "Failed to search rooms" });
  }
};
