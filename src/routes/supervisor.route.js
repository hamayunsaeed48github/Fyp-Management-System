import { Router } from "express";
import {
  supervisorLogin,
  addStudent,
  getAllStudents,
  updateStudent,
  deleteStudent,
  getItemsByStatus,
  updateItemStatus,
  supervisorLogout,
} from "../controller/supervisor.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const supervisorRouter = Router();

supervisorRouter.route("/login-supervisor").post(supervisorLogin);
supervisorRouter.route("/add-student").post(verifyJWT, addStudent);
supervisorRouter.route("/get-all-students").get(verifyJWT, getAllStudents);
supervisorRouter.route("/update-student/:id").patch(verifyJWT, updateStudent);
supervisorRouter.route("/delete-student/:id").delete(verifyJWT, deleteStudent);

supervisorRouter.route("/logout-supervisor").post(verifyJWT, supervisorLogout);

// Consolidated Project/Proposal Routes
supervisorRouter.route("/items/:type").get(verifyJWT, getItemsByStatus);

supervisorRouter.route("/items/:type/:id").patch(verifyJWT, updateItemStatus);

export default supervisorRouter;
