import mongoose from "mongoose";

const companyDocumentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Document title is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "TERMS_AND_CONDITIONS",
        "POLICY",
        "HANDBOOK",
        "COMPLIANCE",
        "OTHER",
      ],
      required: [true, "Document category is required"],
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "GridFS file ID is required"],
    },
    fileName: {
      type: String,
      required: [true, "Original file name is required"],
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
    },
    mimeType: {
      type: String,
      required: [true, "Mime type is required"],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploader user ID is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast tenant-scoped listing and filtering
companyDocumentSchema.index({ companyId: 1, isActive: 1, category: 1 });
companyDocumentSchema.index({ companyId: 1, createdAt: -1 });

export default mongoose.model("CompanyDocument", companyDocumentSchema);
