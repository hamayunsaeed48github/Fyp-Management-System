import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Supervisor } from "../model/supervisor.model.js";
import { Student } from "../model/student.model.js";
import { Project } from "../model/project.model.js";
import { Proposal } from "../model/proposal.model.js";

const supervisorLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // Check if supervisor exists
  const supervisor = await Supervisor.findOne({ email });
  if (!supervisor) {
    throw new ApiError(404, "Supervisor not found. Please contact admin");
  }

  // Verify password
  const isPasswordValid = await supervisor.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Generate tokens
  const accessToken = supervisor.generateAccessToken();
  const refreshToken = supervisor.generateRefreshToken();

  // Save refresh token to database
  supervisor.refreshToken = refreshToken;
  await supervisor.save();

  // Secure cookie options
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  // Return response
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          supervisor: {
            _id: supervisor._id,
            name: supervisor.name,
            email: supervisor.email,
            department: supervisor.department,
          },
          accessToken,
          refreshToken,
        },
        "Supervisor logged in successfully"
      )
    );
});

// Add Student (Supervisor Only)
const addStudent = asyncHandler(async (req, res) => {
  const { name, email, password, rollNumber } = req.body;

  // Validation
  if (!name || !email || !password || !rollNumber) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if student already exists
  const existingStudent = await Student.findOne({
    $or: [{ email }, { rollNumber }],
  });

  if (existingStudent) {
    throw new ApiError(
      409,
      "Student with this email or roll number already exists"
    );
  }

  // Create student
  const student = await Student.create({
    name,
    email,
    password,
    rollNumber,
    addedBy: req.user._id, // Supervisor who added this student
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        _id: student._id,
        name: student.name,
        email: student.email,
        rollNumber: student.rollNumber,
      },
      "Student added successfully"
    )
  );
});

// Get All Students (Supervisor Only)
const getAllStudents = asyncHandler(async (req, res) => {
  const students = await Student.find({ addedBy: req.user._id })
    .select("-password -refreshToken -__v")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, students, "Students retrieved successfully"));
});

// Update Student (Supervisor Only)
const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, rollNumber, password } = req.body;

  const student = await Student.findOneAndUpdate(
    {
      _id: id,
      addedBy: req.user._id,
    },
    {
      $set: {
        ...(name && { name }),
        ...(email && { email }),
        ...(rollNumber && { rollNumber }),
        ...(password && { password }),
      },
    },
    { new: true, runValidators: true }
  ).select("-password -refreshToken -__v");

  if (!student) {
    throw new ApiError(404, "Student not found or unauthorized");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, student, "Student updated successfully"));
});

// Delete Student (Supervisor Only)
const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const student = await Student.findOneAndDelete({
    _id: id,
    addedBy: req.user._id,
  });

  if (!student) {
    throw new ApiError(404, "Student not found or unauthorized");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Student deleted successfully"));
});

// Get Pending Projects (Supervisor)
const getPendingProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({
    supervisor: req.user._id,
    status: "pending",
  })
    .populate({
      path: "submittedBy",
      select: "name email rollNumber -_id",
    })
    .select("-__v -supervisor");

  return res
    .status(200)
    .json(new ApiResponse(200, projects, "Pending projects retrieved"));
});

// Approve Project (Supervisor)
const approveProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findOneAndUpdate(
    {
      _id: projectId,
      supervisor: req.user._id,
      status: "pending",
    },
    {
      status: "approved",
    },
    { new: true }
  ).select("-__v");

  if (!project) {
    throw new ApiError(404, "Project not found or already processed");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project approved successfully"));
});

// Reject Project (Supervisor)
const rejectProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findOneAndUpdate(
    {
      _id: projectId,
      supervisor: req.user._id,
      status: "pending",
    },
    {
      status: "rejected",
    },
    { new: true }
  ).select("-__v");

  if (!project) {
    throw new ApiError(404, "Project not found or already processed");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project rejected successfully"));
});

// Get Approved Projects (Supervisor)
const getApprovedProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({
    supervisor: req.user._id,
    status: "approved",
  })
    .populate("submittedBy", "name rollNumber -_id")
    .select("-__v -supervisor");

  return res
    .status(200)
    .json(new ApiResponse(200, projects, "Approved projects retrieved"));
});

// Get Rejected Projects (Supervisor)
const getRejectedProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({
    supervisor: req.user._id,
    status: "rejected",
  })
    .populate("submittedBy", "name email -_id")
    .select("-__v -supervisor");

  return res
    .status(200)
    .json(new ApiResponse(200, projects, "Rejected projects retrieved"));
});

// Proposal Management (Same pattern as projects)
const getPendingProposals = asyncHandler(async (req, res) => {
  const proposals = await Proposal.find({
    supervisor: req.user._id,
    status: "pending",
  })
    .populate("submittedBy", "name rollNumber -_id")
    .select("-__v -supervisor");

  return res
    .status(200)
    .json(new ApiResponse(200, proposals, "Pending proposals retrieved"));
});

const approveProposal = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;

  const proposal = await Proposal.findOneAndUpdate(
    {
      _id: proposalId,
      supervisor: req.user._id,
      status: "pending",
    },
    {
      status: "approved",
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, proposal, "Proposal approved"));
});

const rejectProposal = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;

  const proposal = await Proposal.findOneAndUpdate(
    {
      _id: proposalId,
      supervisor: req.user._id,
      status: "pending",
    },
    {
      status: "rejected",
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, proposal, "Proposal rejected"));
});

// Get Approved Proposals (Supervisor)
const getApprovedProposals = asyncHandler(async (req, res) => {
  const proposals = await Proposal.find({
    supervisor: req.user._id,
    status: "approved",
  })
    .populate({
      path: "submittedBy",
      select: "name rollNumber email -_id",
    })
    .select("-__v -supervisor")
    .sort({ updatedAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, proposals, "Approved proposals retrieved"));
});

// Get Rejected Proposals (Supervisor)
const getRejectedProposals = asyncHandler(async (req, res) => {
  const proposals = await Proposal.find({
    supervisor: req.user._id,
    status: "rejected",
  })
    .populate({
      path: "submittedBy",
      select: "name rollNumber email -_id",
    })
    .select("-__v -supervisor")
    .sort({ updatedAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, proposals, "Rejected proposals retrieved"));
});

// Supervisor Logout
const supervisorLogout = asyncHandler(async (req, res) => {
  // Remove refresh token from database
  await Supervisor.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // Removes the field from document
      },
    },
    {
      new: true,
    }
  );

  // Clear cookies
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Supervisor logged out successfully"));
});

export {
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
};
