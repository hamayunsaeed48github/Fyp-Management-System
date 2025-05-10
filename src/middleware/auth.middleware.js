import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { Admin } from "../model/admin.model.js";
import { Supervisor } from "../model/supervisor.model.js";
import { Student } from "../model/student.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
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
  if (decodedToken.role === "admin") {
    user = await Admin.findById(decodedToken._id).select(
      "-password -refreshToken"
    );
  } else if (decodedToken.role === "supervisor") {
    user = await Supervisor.findById(decodedToken._id).select(
      "-password -refreshToken"
    );
  } else if (decodedToken.role === "student") {
    user = await Student.findById(decodedToken._id).select(
      "-password -refreshToken"
    );
  } else {
    throw new ApiError(401, "Invalid user role");
  }

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  req.user = user;
  next();
});
