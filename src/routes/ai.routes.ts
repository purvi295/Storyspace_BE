// src/routes/ai.routes.ts
import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import Joi from "joi";
import { authenticateToken } from "../middlewares/auth.middleware";
import { sendErrorResponse, sendApiResponse } from "../utils/api.response";

const router = Router();

// Rate limit: 20 AI requests per user per minute
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  keyGenerator: (req) => req.user?.user_uuid ?? req.ip ?? "anonymous",
  message: { error: "Too many requests to AI. Please wait a minute." },
});

const chatBodySchema = Joi.object({
  message: Joi.string().min(1).max(1000).required(),
});

router.post(
  "/chat",
  authenticateToken,
  aiRateLimiter,
  async (req: Request, res: Response) => {
    // 1. Validate input
    const { error, value } = chatBodySchema.validate(req.body);
    if (error) return sendErrorResponse(res, 400, error.details[0].message);

    const { message } = value;
    const user = req.user!;

    // 2. Log the request
    console.log(
      `[AI] user=${user.user_uuid} role=${user.role} message="${message}"`,
    );

    try {
      // 3. Forward to Python agent
      const agentRes = await fetch(`${process.env.PYTHON_AGENT_URL}/agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": process.env.AI_INTERNAL_KEY!,
        },
        body: JSON.stringify({
          message,
          userId: user.user_uuid,
          role: user.role,
        }),
      });

      if (!agentRes.ok) {
        throw new Error(`Agent returned ${agentRes.status}`);
      }

      const data = await agentRes.json();
      return sendApiResponse(res, 200, "AI response", data);
    } catch (err) {
      console.error("[AI] Agent call failed:", err);
      return sendErrorResponse(res, 502, "AI service unavailable");
    }
  },
);

export default router;
