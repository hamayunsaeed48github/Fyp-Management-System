import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Student } from "../model/student.model.js";
import { Proposal } from "../model/proposal.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Project } from "../model/project.model.js";

// Student Login
const studentLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation - Check empty fields
  if (!email?.trim() || !password?.trim()) {
    throw new ApiError(400, "Email and password are required");
  }

  // Find student by email
  const student = await Student.findOne({ email });
  if (!student) {
    throw new ApiError(
      404,
      "Student not found. Please contact your supervisor"
    );
  }

  // Verify password
  const isPasswordValid = await student.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Generate tokens
  const accessToken = student.generateAccessToken();
  const refreshToken = student.generateRefreshToken();

  // Update refresh token in database
  student.refreshToken = refreshToken;
  await student.save();

  // Secure cookie options
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "None",
  };

  // Return response with all required fields
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          student: {
            _id: student._id,
            name: student.name,
            email: student.email,
            rollNumber: student.rollNumber,
            role: student.role,
            addedBy: student.addedBy,
          },
          accessToken,
          refreshToken,
        },
        "Student logged in successfully"
      )
    );
});

// Submit Proposal (Student Only)
const submitProposal = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const studentId = req.user._id;

  // Validation
  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title and description are required");
  }

  // Get student to find their supervisor
  const student = await Student.findById(studentId);
  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  // Create proposal
  const proposal = await Proposal.create({
    title,
    description,
    submittedBy: studentId,
    supervisor: student.addedBy, // Supervisor who added this student
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        _id: proposal._id,
        title: proposal.title,
        status: proposal.status,
        submittedAt: proposal.createdAt,
      },
      "Proposal submitted successfully"
    )
  );
});

// Get Student's Proposals (Student Only)
const getStudentProposals = asyncHandler(async (req, res) => {
  const proposals = await Proposal.find({ submittedBy: req.user._id })
    .select("-__v")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, proposals, "Proposals retrieved successfully"));
});

// Submit Project (Student Only)
const submitProject = asyncHandler(async (req, res) => {
  const { title } = req.body;
  const studentId = req.user._id;

  // Validation
  if (!title?.trim()) {
    throw new ApiError(400, "Project title is required");
  }

  if (!req.file) {
    throw new ApiError(400, "Project file is required");
  }

  // Get student to find supervisor
  const student = await Student.findById(studentId);
  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  // Upload file to Cloudinary
  const file = await uploadOnCloudinary(req.file.path);
  if (!file?.url) {
    throw new ApiError(500, "Failed to upload project file");
  }

  // Create project
  const project = await Project.create({
    title,
    submittedBy: studentId,
    supervisor: student.addedBy,
    file: {
      url: file.url,
      public_id: file.public_id,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, project, "Project submitted successfully"));
});

// Get Student Projects (Student Only)
const getStudentProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ submittedBy: req.user._id })
    .select("-__v -submittedBy -file.public_id")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, projects, "Projects retrieved successfully"));
});

// Student Logout
const studentLogout = asyncHandler(async (req, res) => {
  // Remove refresh token from database
  await Student.findByIdAndUpdate(
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
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Student logged out successfully"));
});

export {
  studentLogin,
  submitProposal,
  getStudentProposals,
  submitProject,
  getStudentProjects,
  studentLogout,
};
