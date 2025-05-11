import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Admin } from "../model/admin.model.js";
import { Supervisor } from "../model/supervisor.model.js";
import { Project } from "../model/project.model.js";
import { Proposal } from "../model/proposal.model.js";

// Initialize static admin (run this once to create the admin in DB)
const initializeAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ email: "admin@fyp.com" });
    if (!adminExists) {
      await Admin.create({
        email: "admin@fyp.com",
        password: "admin123", // This will be hashed by the pre-save hook
      });
      console.log("Static admin created successfully");
    }
  } catch (error) {
    console.error("Error initializing admin:", error);
  }
};

// Admin login
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const admin = await Admin.findOne({ email });
  if (!admin) {
    throw new ApiError(401, "Invalid admin credentials");
  }

  const isPasswordValid = await admin.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid admin credentials");
  }

  const accessToken = admin.generateAccessToken();
  const refreshToken = admin.generateRefreshToken();

  admin.refreshToken = refreshToken;
  await admin.save();

  const options = {
    httpOnly: true,
    secure: true,
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
          admin: { email: admin.email },
          accessToken,
          refreshToken,
        },
        "Admin logged in successfully"
      )
    );
});

// Add Supervisor (Admin Only)
const addSupervisor = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required");
  }

  // Check if supervisor already exists
  const existingSupervisor = await Supervisor.findOne({ email });
  if (existingSupervisor) {
    throw new ApiError(409, "Supervisor with this email already exists");
  }

  // Create new supervisor
  const supervisor = await Supervisor.create({
    name,
    email,
    password,
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        _id: supervisor._id,
        name: supervisor.name,
        email: supervisor.email,
        createdAt: supervisor.createdAt,
      },
      "Supervisor added successfully"
    )
  );
});

// Get All Supervisors (Admin Only)
const getAllSupervisors = asyncHandler(async (req, res) => {
  const supervisors = await Supervisor.find({})
    .select("-password -refreshToken")
    .populate("email");

  return res
    .status(200)
    .json(
      new ApiResponse(200, supervisors, "Supervisors retrieved successfully")
    );
});

// Update Supervisor (Admin or the Supervisor themselves)
const updateSupervisor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log("ID:", id);
  const { name, email, password } = req.body;

  const supervisor = await Supervisor.findById(id);
  if (!supervisor) {
    throw new ApiError(404, "Supervisor not found");
  }

  // Update fields
  const updateFields = {};
  if (name) updateFields.name = name;
  if (email) updateFields.email = email;
  if (password) updateFields.password = password;

  // Use findByIdAndUpdate for better validation
  const updatedSupervisor = await Supervisor.findByIdAndUpdate(
    id,
    { $set: updateFields },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedSupervisor, "Supervisor updated successfully")
    );
});

// Delete Supervisor (Admin Only)
const deleteSupervisor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const supervisor = await Supervisor.findByIdAndDelete(id);

  if (!supervisor) {
    throw new ApiError(404, "Supervisor not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Supervisor deleted successfully"));
});

// Search supervisors by name (Admin only)
const searchSupervisors = asyncHandler(async (req, res) => {
  const { name } = req.query; // Get search query from URL params

  if (!name || name.trim() === "") {
    throw new ApiError(400, "Search query is required");
  }

  const supervisors = await Supervisor.find({
    name: {
      $regex: name,
      $options: "i", // Case-insensitive
    },
  })
    .select("-password -refreshToken -__v")
    .sort({ name: 1 }) // Sort by name A-Z
    .limit(10); // Limit results

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        supervisors,
        `Found ${supervisors.length} supervisors matching "${name}"`
      )
    );
});

// Get All Projects (Admin) - No status filtering
const getAllProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({})
    .populate({
      path: "submittedBy",
      select: "name rollNumber email -_id",
    })
    .populate({
      path: "supervisor",
      select: "name email -_id",
    })
    .populate({
      path: "proposal",
      select: "description -_id", // select only description
    })
    .select("-__v")
    .sort({ createdAt: -1 });

  // Get counts for dashboard
  const counts = {
    total: await Project.countDocuments(),
    pending: await Project.countDocuments({ status: "pending" }),
    approved: await Project.countDocuments({ status: "approved" }),
    rejected: await Project.countDocuments({ status: "rejected" }),
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { projects, counts },
        "All projects retrieved successfully"
      )
    );
});

// Search Projects by Title (Admin)
const searchProjectsByTitle = asyncHandler(async (req, res) => {
  const { title } = req.query;

  if (!title) {
    throw new ApiError(400, "Project title query is required");
  }

  const projects = await Project.find({
    title: { $regex: title, $options: "i" }, // 'i' for case-insensitive
  })
    .populate({
      path: "submittedBy",
      select: "name rollNumber email -_id",
    })
    .populate({
      path: "supervisor",
      select: "name email -_id",
    })
    .select("-__v")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, projects, "Projects found by title"));
});

// Admin Logout
const adminLogout = asyncHandler(async (req, res) => {
  await Admin.findByIdAndUpdate(req.user._id, {
    $unset: { refreshToken: 1 },
  });

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Admin logged out successfully"));
});

export {
  adminLogin,
  initializeAdmin,
  addSupervisor,
  getAllSupervisors,
  updateSupervisor,
  deleteSupervisor,
  searchSupervisors,
  getAllProjects,
  searchProjectsByTitle,
  adminLogout,
};
