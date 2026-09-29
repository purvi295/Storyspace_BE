import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/role.middleware";
import validate from "../middlewares/validate.middleware";
import { storyIdentifierParamSchema } from "../middlewares/story.validation";
import { idParamSchema } from "../middlewares/common.validation";
import { userListQuerySchema } from "../middlewares/user.validation";

const router = Router();

// Protect all admin routes with authentication and requireAdmin middleware
router.use(authenticateToken, requireAdmin);

// GET /api/admin/stats - Overview of platform statistics
router.get("/stats", (req, res) => adminController.getStats(req, res));

// GET /api/admin/users - User directory for admin management
router.get(
  "/users",
  validate({ query: userListQuerySchema }),
  (req, res) => adminController.listUsers(req, res)
);

// DELETE /api/admin/stories/:identifier - Delete any story as admin
router.delete(
  "/stories/:identifier",
  validate({ params: storyIdentifierParamSchema }),
  (req, res) => adminController.deleteStory(req, res)
);

// DELETE /api/admin/comments/:id - Delete any comment as admin
router.delete(
  "/comments/:id",
  validate({ params: idParamSchema }),
  (req, res) => adminController.deleteComment(req, res)
);

export default router;
