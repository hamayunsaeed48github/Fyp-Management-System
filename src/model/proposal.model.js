import mongoose, { Schema } from "mongoose";

const proposalSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    supervisor: {
      type: Schema.Types.ObjectId,
      ref: "Supervisor",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const Proposal = mongoose.model("Proposal", proposalSchema);
