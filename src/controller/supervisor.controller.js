import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Supervisor } from "../model/supervisor.model.js";
import { Student } from "../model/student.model.js";
import { Project } from "../model/project.model.js";
import { Proposal } from "../model/proposal.model.js";

// Authentication Controllers
const supervisorLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const supervisor = await Supervisor.findOne({ email });
  if (!supervisor) {
    throw new ApiError(404, "Supervisor not found. Please contact admin");
  }

  const isPasswordValid = await supervisor.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = supervisor.generateAccessToken();
  const refreshToken = supervisor.generateRefreshToken();

  supervisor.refreshToken = refreshToken;
  await supervisor.save();

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "None",
  };

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

const supervisorLogout = asyncHandler(async (req, res) => {
  await Supervisor.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  );

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

// Student Management Controllers
const addStudent = asyncHandler(async (req, res) => {
  const { name, email, password, rollNumber } = req.body;

  if (!name || !email || !password || !rollNumber) {
    throw new ApiError(400, "All fields are required");
  }

  const existingStudent = await Student.findOne({
    $or: [{ email }, { rollNumber }],
  });

  if (existingStudent) {
    throw new ApiError(
      409,
      "Student with this email or roll number already exists"
    );
  }

  const student = await Student.create({
    name,
    email,
    password,
    rollNumber,
    addedBy: req.user._id,
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

const getAllStudents = asyncHandler(async (req, res) => {
  const students = await Student.find({ addedBy: req.user._id })
    .select("-password -refreshToken -__v")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, students, "Students retrieved successfully"));
});

const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = Object.keys(req.body).reduce((acc, key) => {
    if (["name", "email", "rollNumber", "password"].includes(key)) {
      acc[key] = req.body[key];
    }
    return acc;
  }, {});

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "No valid fields provided for update");
  }

  const student = await Student.findOneAndUpdate(
    { _id: id, addedBy: req.user._id },
    { $set: updates },
    { new: true, runValidators: true }
  ).select("-password -refreshToken -__v");

  if (!student) {
    throw new ApiError(404, "Student not found or unauthorized");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, student, "Student updated successfully"));
});

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

// Consolidated Project/Proposal Controllers
const getItemsByStatus = asyncHandler(async (req, res) => {
  const { type } = req.params;

  if (!["project", "proposal"].includes(type)) {
    throw new ApiError(400, "Invalid type specified");
  }

  const Model = type === "project" ? Project : Proposal;
  const items = await Model.find({
    supervisor: req.user._id,
  })
    .populate("submittedBy", "name email rollNumber -_id")
    .select("-__v -supervisor")
    .sort({ updatedAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, items, `${type}s retrieved successfully`));
});

const updateItemStatus = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const { status } = req.body;

  if (!["project", "proposal"].includes(type)) {
    throw new ApiError(400, "Invalid type specified");
  }

  if (!["approved", "rejected"].includes(status)) {
    throw new ApiError(400, "Invalid status specified");
  }

  const Model = type === "project" ? Project : Proposal;
  const item = await Model.findOneAndUpdate(
    {
      _id: id,
      supervisor: req.user._id,
      status: "pending",
    },
    { status },
    { new: true }
  ).select("-__v");

  if (!item) {
    throw new ApiError(404, `${type} not found or already processed`);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, item, `${type} ${status} successfully`));
});

export {
  supervisorLogin,
  supervisorLogout,
  addStudent,
  getAllStudents,
  updateStudent,
  deleteStudent,
  getItemsByStatus,
  updateItemStatus,
};
