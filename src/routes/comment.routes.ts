import { Router } from "express";
import { commentController } from "../controllers/comment.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import validate from "../middlewares/validate.middleware";
import {
  createCommentSchema,
  updateCommentSchema,
} from "../middlewares/comment.validation";

const router = Router();

// GET /api/comments/:id - Get a single comment by ID
router.get("/:id", (req, res) => commentController.getCommentById(req, res));

// PUT /api/comments/:id - Update own comment
router.put(
  "/:id",
  authenticateToken,
  validate(updateCommentSchema),
  (req, res) => commentController.updateComment(req, res)
);

// DELETE /api/comments/:id - Delete a comment (comment author, story author, or admin)
router.delete("/:id", authenticateToken, (req, res) =>
  commentController.deleteComment(req, res)
);

export default router;
