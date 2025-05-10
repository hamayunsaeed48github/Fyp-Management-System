import mongoose, { Schema } from "mongoose";

const projectSchema = new Schema(
  {
    title: {
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
    file: {
      url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    proposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proposal",
    },
  },
  { timestamps: true }
);

export const Project = mongoose.model("Project", projectSchema);
