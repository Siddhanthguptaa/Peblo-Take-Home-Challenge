import express, { Router } from "express";
import { middleware } from "../middlewares/userMiddleware";
import {
  toggleArchive,
  toggleShare,
  getSharedRoom,
  generateActionItems,
  suggestTitle,
  searchRooms,
} from "../controllers/advancedRoomController";

const router: Router = express.Router();

// Archive
router.patch("/:roomId/archive", middleware, toggleArchive);

// Share
router.patch("/:roomId/share", middleware, toggleShare);
router.get("/shared/:shareId", getSharedRoom);

// AI
router.post("/:roomId/ai/action-items", middleware, generateActionItems);
router.post("/:roomId/ai/title", middleware, suggestTitle);

// Search & filter
router.get("/search/rooms", middleware, searchRooms);

export default router;
