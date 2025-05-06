import { Router } from "express";
import {
  studentLogin,
  submitProposal,
  getStudentProposals,
  submitProject,
  getStudentProjects,
  studentLogout,
} from "../controller/student.controller.js";
import { verifyStudent } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const studentRouter = Router();

studentRouter.route("/login-student").post(studentLogin);
studentRouter.route("/submit-proposal").post(verifyStudent, submitProposal);
studentRouter
  .route("/get-student-proposals")
  .get(verifyStudent, getStudentProposals);
studentRouter
  .route("/submit-project")
  .post(verifyStudent, upload.single("file"), submitProject);
studentRouter
  .route("/get-student-projects")
  .get(verifyStudent, getStudentProjects);

studentRouter.route("/student-logout").post(verifyStudent, studentLogout);
export default studentRouter;
