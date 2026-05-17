import express, { Router } from "express";
import { middleware } from "../middlewares/userMiddleware";
import { 
  createRoomController, 
  getAllRoomController, 
  joinRoomByCodeController, 
  joinRoomByIdController,
  getDashboardController,
  getAIHistoryController
} from "../controllers/dashboardController";

const router: Router = express.Router();

router.post("/room", middleware, createRoomController)

router.get("/rooms", middleware, getAllRoomController)

router.post("/join-room", middleware, joinRoomByCodeController);

router.get("/room/:id", middleware, joinRoomByIdController);

// New endpoints
router.get("/insights", middleware, getDashboardController);

router.get("/room/:roomId/ai-history", middleware, getAIHistoryController);

export default router;