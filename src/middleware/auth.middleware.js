import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { Admin } from "../model/admin.model.js";
import { Supervisor } from "../model/supervisor.model.js";
import { Student } from "../model/student.model.js";

// Common JWT verification for all roles
const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized Access!");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decodedToken?._id || !decodedToken?.role) {
      throw new ApiError(401, "Invalid token payload");
    }

    let user;
    switch (decodedToken.role) {
      case "admin":
        user = await Admin.findById(decodedToken._id).select(
          "-password -refreshToken"
        );
        break;
      case "supervisor":
        user = await Supervisor.findById(decodedToken._id).select(
          "-password -refreshToken"
        );
        break;
      case "student":
        user = await Student.findById(decodedToken._id).select(
          "-password -refreshToken"
        );
        break;
      default:
        throw new ApiError(401, "Invalid user role");
    }

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access Token");
  }
});

// Admin-specific verification
export const verifyAdmin = asyncHandler(async (req, res, next) => {
  await verifyJWT(req, res, () => {
    if (req.user.role !== "admin") {
      throw new ApiError(403, "Forbidden: Admin access required");
    }
    next();
  });
});

// Supervisor-specific verification
export const verifySupervisor = asyncHandler(async (req, res, next) => {
  await verifyJWT(req, res, () => {
    if (req.user.role !== "supervisor") {
      throw new ApiError(403, "Forbidden: Supervisor access required");
    }
    next();
  });
});

// Student-specific verification
export const verifyStudent = asyncHandler(async (req, res, next) => {
  await verifyJWT(req, res, () => {
    if (req.user.role !== "student") {
      throw new ApiError(403, "Forbidden: Student access required");
    }
    next();
  });
});

// Optional: Combined role verification
export const verifyRoles = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    await verifyJWT(req, res, () => {
      if (!roles.includes(req.user.role)) {
        throw new ApiError(
          403,
          `Forbidden: ${roles.join(", ")} access required`
        );
      }
      next();
    });
  });
};
