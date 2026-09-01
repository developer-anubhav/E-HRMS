/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import MainLayout from "../../../layouts/MainLayout";
import Card from "../../../components/ui/Card";
import Loader from "../../../components/ui/Loader";
import { useAuth } from "../../../context/AuthContext";
import {
  getDocuments,
  uploadDocument,
  deleteDocument,
  downloadDocument,
} from "../../../api/documentApi";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Search,
  Plus,
  X,
  FileCheck,
  BookOpen,
  Scale,
  Shield,
  FileCode,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const CATEGORIES = [
  { value: "ALL", label: "All Categories" },
  { value: "TERMS_AND_CONDITIONS", label: "Terms & Conditions" },
  { value: "POLICY", label: "Company Policies" },
  { value: "HANDBOOK", label: "Employee Handbooks" },
  { value: "COMPLIANCE", label: "Compliance & Regulatory" },
  { value: "OTHER", label: "Other Documents" },
];

const CATEGORY_COLORS = {
  TERMS_AND_CONDITIONS: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  POLICY: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  HANDBOOK: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  COMPLIANCE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  OTHER: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const CATEGORY_ICONS = {
  TERMS_AND_CONDITIONS: Scale,
  POLICY: FileCheck,
  HANDBOOK: BookOpen,
  COMPLIANCE: Shield,
  OTHER: FileCode,
};

export default function Documents() {
  const { user } = useAuth();
  const isManagerOrAdminOrHR = ["ADMIN", "HR", "MANAGER"].includes(user?.role);
  const canManageDocs = ["ADMIN", "HR"].includes(user?.role);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("POLICY");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  // Delete modal state
  const [docToDelete, setDocToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [selectedCategory]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await getDocuments({
        category: selectedCategory,
        search: searchQuery,
      });
      setDocuments(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDocuments();
  };

  const handleDownload = async (doc) => {
    try {
      setDownloadingId(doc._id);
      await downloadDocument(doc._id, doc.fileName);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download document. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setUploadError("");
    if (!file) {
      setUploadFile(null);
      return;
    }

    // 15MB limit check
    if (file.size > 15 * 1024 * 1024) {
      setUploadError("File size exceeds the 15MB maximum limit.");
      setUploadFile(null);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];

    if (!allowedTypes.includes(file.type)) {
      setUploadError(
        "Invalid file format. Allowed types: PDF, DOC, DOCX, PNG, JPEG."
      );
      setUploadFile(null);
      return;
    }

    setUploadFile(file);
    if (!uploadTitle) {
      // Auto fill title without extension
      const nameWithoutExt = file.name.substring(
        0,
        file.name.lastIndexOf(".")
      );
      setUploadTitle(nameWithoutExt || file.name);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError("Please select a file to upload.");
      return;
    }
    if (!uploadTitle.trim()) {
      setUploadError("Document title is required.");
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadTitle.trim());
      formData.append("category", uploadCategory);

      await uploadDocument(formData);
      setUploadSuccess("Document uploaded successfully!");

      setTimeout(() => {
        setShowUploadModal(false);
        setUploadTitle("");
        setUploadCategory("POLICY");
        setUploadFile(null);
        setUploadSuccess("");
        fetchDocuments();
      }, 1000);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to upload document.";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!docToDelete) return;
    setDeleting(true);
    try {
      await deleteDocument(docToDelete._id);
      setDocToDelete(null);
      fetchDocuments();
    } catch (err) {
      console.error("Failed to delete document:", err);
      alert(err.response?.data?.message || "Failed to delete document.");
    } finally {
      setDeleting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <FileText className="text-primary h-7 w-7" />
              Company Document Storage
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Store and distribute enterprise policy documents, compliance agreements, and employee handbooks across your organization.
            </p>
          </div>

          {canManageDocs && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus size={18} />
              Upload Document
            </button>
          )}
        </div>

        {/* Category Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Total Docs</span>
              <FileText size={18} className="text-primary" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{documents.length}</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Policies</span>
              <FileCheck size={18} className="text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">
              {documents.filter((d) => d.category === "POLICY").length}
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Handbooks</span>
              <BookOpen size={18} className="text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">
              {documents.filter((d) => d.category === "HANDBOOK").length}
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Compliance</span>
              <Shield size={18} className="text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">
              {documents.filter((d) => d.category === "COMPLIANCE").length}
            </p>
          </div>
        </div>

        {/* Toolbar: Category Filter Tabs & Search */}
        <Card className="p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.value
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Title Search Form */}
            <form onSubmit={handleSearchSubmit} className="relative min-w-[260px]">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search documents by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
              />
            </form>
          </div>
        </Card>

        {/* Main Document Grid */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader />
          </div>
        ) : documents.length === 0 ? (
          <Card className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="p-4 bg-slate-800/60 rounded-2xl text-slate-500">
              <FileText size={36} />
            </div>
            <h3 className="text-lg font-semibold text-white">No documents found</h3>
            <p className="text-sm text-slate-400 max-w-md">
              {searchQuery
                ? `No documents matching "${searchQuery}".`
                : "There are currently no documents in this category for your organization."}
            </p>
            {canManageDocs && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-2 px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-xl text-xs font-semibold hover:bg-primary/30 transition-all"
              >
                Upload First Document
              </button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {documents.map((doc) => {
              const CategoryIcon =
                CATEGORY_ICONS[doc.category] || FileText;
              const colorClasses =
                CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.OTHER;

              return (
                <Card
                  key={doc._id}
                  className="p-5 flex flex-col justify-between hover:border-slate-700/80 transition-all group"
                >
                  <div className="space-y-4">
                    {/* Header: Category Badge & Actions */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[11px] font-semibold uppercase tracking-wider ${colorClasses}`}
                      >
                        <CategoryIcon size={13} />
                        {doc.category.replace(/_/g, " ")}
                      </span>

                      {canManageDocs && (
                        <button
                          onClick={() => setDocToDelete(doc)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete document"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* Document Title */}
                    <div>
                      <h3 className="font-bold text-white text-base group-hover:text-primary transition-colors line-clamp-2">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        {doc.fileName}
                      </p>
                    </div>
                  </div>

                  {/* Footer Info & Download */}
                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <p>{formatFileSize(doc.fileSize)} • {new Date(doc.createdAt).toLocaleDateString()}</p>
                      <p className="text-slate-400">
                        By {doc.uploadedBy?.name || "Admin"}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDownload(doc)}
                      disabled={downloadingId === doc._id}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-primary text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 hover:border-primary transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Download size={14} />
                      {downloadingId === doc._id ? "Downloading..." : "Download"}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <Upload size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Upload Company Document</h2>
                  <p className="text-xs text-slate-400">Add policies or agreements for all staff</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadError("");
                  setUploadSuccess("");
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {uploadError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-xs">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 text-xs">
                <CheckCircle2 size={18} className="flex-shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Employee Handbook 2026"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category *
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary"
                >
                  <option value="TERMS_AND_CONDITIONS">Terms & Conditions</option>
                  <option value="POLICY">Company Policy</option>
                  <option value="HANDBOOK">Employee Handbook</option>
                  <option value="COMPLIANCE">Compliance & Regulatory</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  File Attachment (PDF, DOC, DOCX, PNG, JPEG - Max 15MB) *
                </label>
                <div className="relative border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/50 rounded-2xl p-6 text-center transition-colors">
                  <input
                    type="file"
                    required
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="space-y-2 pointer-events-none">
                    <Upload className="mx-auto text-slate-500 h-8 w-8" />
                    {uploadFile ? (
                      <p className="text-xs font-semibold text-primary">
                        {uploadFile.name} ({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </p>
                    ) : (
                      <>
                        <p className="text-xs text-slate-300 font-medium">
                          Click or drag file to upload
                        </p>
                        <p className="text-[11px] text-slate-500">PDF, DOC, DOCX, PNG, JPEG up to 15MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-primary/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {uploading ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-500/10 rounded-xl">
                <Trash2 size={22} />
              </div>
              <h3 className="text-lg font-bold text-white">Remove Document</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to remove <span className="font-bold text-white">"{docToDelete.title}"</span>?
              This will soft-delete the document for all employees.
            </p>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm Soft Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
