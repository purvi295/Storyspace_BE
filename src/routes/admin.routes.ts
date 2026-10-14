import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/role.middleware";
import validate from "../middlewares/validate.middleware";
import { uuidBodySchema } from "../middlewares/common.validation";
import { uuidParamSchema } from "../middlewares/common.validation";
import { userListQuerySchema } from "../middlewares/user.validation";

const router = Router();

// Protect all admin routes with authentication and requireAdmin middleware
router.use(authenticateToken, requireAdmin);

// GET /api/admin/stats - Overview of platform statistics (commented out - not implemented)
// router.get("/stats", (req, res) => adminController.getStats(req, res));

// GET /api/admin/users - User directory for admin management
router.get(
  "/users",
  validate({ query: userListQuerySchema }),
  (req, res) => adminController.listUsers(req, res)
);

// DELETE /api/admin/stories - Delete any story as admin
router.delete(
  "/stories",
  validate({ body: uuidBodySchema }),
  (req, res) => adminController.deleteStory(req, res)
);

// DELETE /api/admin/comments/:comment_uuid - Delete any comment as admin
router.delete(
  "/comments/:comment_uuid",
  validate({ params: uuidParamSchema }),
  (req, res) => adminController.deleteComment(req, res)
);

export default router;
