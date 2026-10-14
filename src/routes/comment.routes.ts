import { Router } from "express";
import { commentController } from "../controllers/comment.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import validate from "../middlewares/validate.middleware";
import {
  commentUuidParamSchema,
  updateCommentSchema,
} from "../middlewares/comment.validation";

const router = Router();

// GET /api/comments/:comment_uuid - Get a single comment by UUID
router.get(
  "/:comment_uuid",
  validate({ params: commentUuidParamSchema }),
  (req, res) => commentController.getCommentById(req, res)
);

// PUT /api/comments/:comment_uuid - Update own comment
router.put(
  "/:comment_uuid",
  authenticateToken,
  validate({
    params: commentUuidParamSchema,
    body: updateCommentSchema,
  }),
  (req, res) => commentController.updateComment(req, res)
);

// DELETE /api/comments/:comment_uuid - Delete a comment (comment author, story author, or admin)
router.delete(
  "/:comment_uuid",
  authenticateToken,
  validate({ params: commentUuidParamSchema }),
  (req, res) => commentController.deleteComment(req, res)
);

export default router;
