import { Router } from "express";
import {
  adminLogin,
  addSupervisor,
  getAllSupervisors,
  updateSupervisor,
  deleteSupervisor,
  searchSupervisors,
  getAllProjects,
  searchProjectsByTitle,
  adminLogout,
} from "../controller/admin.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const adminRouter = Router();

adminRouter.route("/login-admin").post(adminLogin);

adminRouter.route("/supervisor/:id").patch(updateSupervisor);
adminRouter.route("/supervisor/:id").delete(deleteSupervisor);
adminRouter.route("/get-all-supervisors").get(getAllSupervisors);

adminRouter.route("/add-supervisor").post(addSupervisor);
adminRouter.route("/search-supervisors").get(searchSupervisors);

adminRouter.route("/get-all-projects").get(getAllProjects);

adminRouter.route("/search-projects").get(searchProjectsByTitle);

adminRouter.route("/admin-logout").post(verifyJWT, adminLogout);

export default adminRouter;
