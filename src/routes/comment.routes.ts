import { Router } from "express";
import { commentController } from "../controllers/comment.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import validate from "../middlewares/validate.middleware";
import {
  commentIdParamSchema,
  updateCommentSchema,
} from "../middlewares/comment.validation";

const router = Router();

// GET /api/comments/:id - Get a single comment by ID
router.get(
  "/:id",
  validate({ params: commentIdParamSchema }),
  (req, res) => commentController.getCommentById(req, res)
);

// PUT /api/comments/:id - Update own comment
router.put(
  "/:id",
  authenticateToken,
  validate({
    params: commentIdParamSchema,
    body: updateCommentSchema,
  }),
  (req, res) => commentController.updateComment(req, res)
);

// DELETE /api/comments/:id - Delete a comment (comment author, story author, or admin)
router.delete(
  "/:id",
  authenticateToken,
  validate({ params: commentIdParamSchema }),
  (req, res) => commentController.deleteComment(req, res)
);

export default router;
