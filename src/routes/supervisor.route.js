import { Router } from "express";
import {
  supervisorLogin,
  addStudent,
  getAllStudents,
  updateStudent,
  deleteStudent,
  getPendingProjects,
  approveProject,
  rejectProject,
  getApprovedProjects,
  getRejectedProjects,
  getPendingProposals,
  approveProposal,
  rejectProposal,
  getApprovedProposals,
  getRejectedProposals,
  supervisorLogout,
} from "../controller/supervisor.controller.js";
import { verifySupervisor } from "../middleware/auth.middleware.js";

const supervisorRouter = Router();

supervisorRouter.route("/login-supervisor").post(supervisorLogin);
supervisorRouter.route("/add-student").post(verifySupervisor, addStudent);
supervisorRouter
  .route("/get-all-students")
  .get(verifySupervisor, getAllStudents);
supervisorRouter
  .route("/update-student/:id")
  .patch(verifySupervisor, updateStudent);
supervisorRouter
  .route("/delete-student/:id")
  .delete(verifySupervisor, deleteStudent);

supervisorRouter
  .route("/get-pending-projects")
  .get(verifySupervisor, getPendingProjects);
supervisorRouter
  .route("/approve-project/:projectId")
  .patch(verifySupervisor, approveProject);
supervisorRouter
  .route("/reject-project/:projectId")
  .patch(verifySupervisor, rejectProject);
supervisorRouter
  .route("/get-approved-projects")
  .get(verifySupervisor, getApprovedProjects);
supervisorRouter
  .route("/get-rejected-projects")
  .get(verifySupervisor, getRejectedProjects);
supervisorRouter
  .route("/get-pending-proposals")
  .get(verifySupervisor, getPendingProposals);
supervisorRouter
  .route("/approve-proposal/:proposalId")
  .patch(verifySupervisor, approveProposal);
supervisorRouter
  .route("/reject-proposal/:proposalId")
  .patch(verifySupervisor, rejectProposal);

supervisorRouter
  .route("/get-approved-proposals")
  .get(verifySupervisor, getApprovedProposals);
supervisorRouter
  .route("/get-rejected-proposals")
  .get(verifySupervisor, getRejectedProposals);
supervisorRouter;

supervisorRouter
  .route("/logout-supervisor")
  .post(verifySupervisor, supervisorLogout);

export default supervisorRouter;
