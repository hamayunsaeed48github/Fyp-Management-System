import { Router } from "express";
import {
  studentLogin,
  submitProposal,
  getStudentProposals,
  submitProject,
  getStudentProjects,
  studentLogout,
} from "../controller/student.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const studentRouter = Router();

studentRouter.route("/login-student").post(studentLogin);
studentRouter.route("/submit-proposal").post(verifyJWT, submitProposal);
studentRouter
  .route("/get-student-proposals")
  .get(verifyJWT, getStudentProposals);
studentRouter
  .route("/submit-project")
  .post(verifyJWT, upload.single("file"), submitProject);
studentRouter.route("/get-student-projects").get(verifyJWT, getStudentProjects);

studentRouter.route("/student-logout").post(verifyJWT, studentLogout);
export default studentRouter;
