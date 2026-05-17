import express,{Request,Response} from "express";
import cors from "cors"
import authRoutes from "./routes/authRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import roomRoutes from "./routes/roomRoutes";
import tagsRoutes from "./routes/tagsRoutes";
import roomAdvancedRoutes from "./routes/roomAdvancedRoutes";
import cookieParser from "cookie-parser";
import dotenv from "dotenv"
import morgan from "morgan";
import { globalLimiter, apiLimiter } from "./middlewares/rateLimiter";
import { errorHandler } from "./middlewares/errorHandler";
import { logger } from "./utils/logger";

dotenv.config()


const app = express();
app.use(express.json())
app.use(cors({
    origin: process.env.NEXT_APP_URL,
    credentials: true,
}))


app.use(cookieParser())
app.use(morgan("dev"));
app.use(globalLimiter);

// Apply API limiter to specific routes if needed
app.use("/api/auth", apiLimiter, authRoutes)

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/room",roomRoutes);

app.use("/api/tags", tagsRoutes);

app.use("/api/room-advanced", roomAdvancedRoutes);

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3001; 

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

