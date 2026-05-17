import express, { Router } from "express";
import { getUserTags, setRoomTags } from "../controllers/tagsController";
import { middleware } from "../middlewares/userMiddleware";

const router: Router = express.Router();

router.get("/", middleware, getUserTags);
router.post("/:roomId/set", middleware, setRoomTags);

export default router;
