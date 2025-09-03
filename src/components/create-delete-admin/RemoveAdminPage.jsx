"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Image from "next/image";
import toast from "react-hot-toast";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  UserMinus,
  User,
  Mail,
  Calendar,
  Shield,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import Link from "next/link";

export default function RemoveAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deletingAdminId, setDeletingAdminId] = useState(null);
  const [adminList, setAdminList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("adminAuthToken") ||
        sessionStorage.getItem("adminAuthToken");

      if (!token) {
        // Redirect to login if token is missing
        router.push("/"); // change this to your login route
      }
    }
  }, [router]);

  const fetchAdminList = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/superadmin/getadminlist`
      );
      console.log(res.data);
      setAdminList(res.data.admins || []);
    } catch (err) {
      toast.error("Failed to load admin list");
    }
  };

  useEffect(() => {
    fetchAdminList();
  }, []);

  const handleDeleteClick = (admin) => {
    setSelectedAdmin(admin);
    setShowDeleteModal(true);
    setDeleteReason("");
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAdmin || !deleteReason.trim()) {
      toast.error("Please provide a reason for deletion");
      return;
    }

    setDeletingAdminId(selectedAdmin.AdminId);
    setError(null);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/superadmin/deleteadmin`,
        { AdminId: selectedAdmin.AdminId, reason: deleteReason }
      );

      toast.success(`Admin ${selectedAdmin.AdminId} removed successfully ✅`, {
        duration: 5000,
      });
      setShowDeleteModal(false);
      setSelectedAdmin(null);
      setDeleteReason("");
      fetchAdminList();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.", {
        duration: 5000,
      });
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setDeletingAdminId(null);
    }
  };

  const getStatusTag = (expiryDate) => {
    if (!expiryDate)
      return (
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
          <Clock className="w-3 h-3 mr-1.5" />
          No Expiry
        </span>
      );

    const today = new Date();
    const exp = new Date(expiryDate);
    return exp > today ? (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
        <CheckCircle className="w-3 h-3 mr-1.5" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
        <XCircle className="w-3 h-3 mr-1.5" />
        Expired
      </span>
    );
  };

  // Map: id -> admin (to resolve created_by_admin_id -> creator)
  const idToAdmin = useMemo(() => {
    const m = new Map();
    (adminList || []).forEach((a) => m.set(a.id, a));
    return m;
  }, [adminList]);

  const filteredAdmins = useMemo(() => {
    return (adminList || []).filter((admin) => {
      const matchesSearch =
        admin.AdminId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.Email?.toLowerCase().includes(searchTerm.toLowerCase());

      const isActive = admin.ExpiryDate
        ? new Date(admin.ExpiryDate) > new Date()
        : false;

      // status filter
      let statusPass = true;
      if (filterStatus === "active") statusPass = isActive;
      else if (filterStatus === "expired") statusPass = !isActive;
      else if (filterStatus === "null") statusPass = !admin.ExpiryDate;
      else if (filterStatus === "sub")
        statusPass = admin.created_by_admin_id != null;
      else if (filterStatus === "roots")
        statusPass = admin.created_by_admin_id == null;

      return matchesSearch && statusPass;
    });
  }, [adminList, searchTerm, filterStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/60 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Remove Admin
                </h1>
                <p className="text-sm text-gray-500">
                  Manage and remove admin accounts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/add-admin"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                Add Admin
              </Link>
              <div className="hidden md:block">
                <Image
                  src="/neet720_logo.jpg"
                  alt="Neet720 Logo"
                  width={60}
                  height={20}
                  className="object-fit"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Admin List */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-8 py-8 border-b border-gray-200/60">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  Admin Management
                </h3>
                <p className="text-gray-600 mt-2 text-lg">
                  View, edit, and remove admin accounts ({adminList.length}{" "}
                  total)
                </p>
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by ID or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-3 w-64 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80"
                  />
                </div>

                {/* Filter */}
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="pl-12 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white/80 font-medium"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="expired">Expired Only</option>
                    <option value="null">No Expiry Set</option>
                    <option value="sub">Sub-admins Only</option>
                    <option value="roots">Top-level Only</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Sr. No
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Admin Details
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Contact Information
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-gray-200">
                {filteredAdmins.map((admin, index) => {
                  const creator =
                    admin.created_by_admin_id != null
                      ? idToAdmin.get(admin.created_by_admin_id)
                      : null;

                  return (
                    <tr
                      key={index}
                      className="hover:bg-blue-50/50 transition-all duration-200"
                    >
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900 bg-gray-100 rounded-lg px-3 py-1 inline-block">
                          #{index + 1}
                        </div>
                      </td>

                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-sm">
                              <User className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900">
                              {admin.AdminId || "-"}
                            </div>
                            <div className="text-sm text-gray-600 font-medium">
                              {admin.name || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Role: {admin.role || "admin"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900 flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            {admin.Email || "-"}
                          </div>
                          {admin.mobileNumber && (
                            <div className="text-xs text-gray-600">
                              📱 {admin.mobileNumber}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Created By */}
                      <td className="px-6 py-5 whitespace-nowrap">
                        {creator ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                            <Shield className="w-3.5 h-3.5" />
                            by {creator.AdminId}
                            <span className="text-gray-500 font-medium">
                              #{creator.id}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>

                      <td className="px-6 py-5 whitespace-nowrap">
                        {getStatusTag(admin.ExpiryDate)}
                      </td>

                      <td className="px-6 py-5 whitespace-nowrap">
                        {admin.ExpiryDate ? (
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {new Date(
                                  admin.ExpiryDate
                                ).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {Math.ceil(
                                  (new Date(admin.ExpiryDate) - new Date()) /
                                    (1000 * 60 * 60 * 24)
                                )}{" "}
                                days
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-gray-500 font-medium">
                              No expiry set
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/edit-admin/${admin.id}`}
                            className="inline-flex items-center px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-all duration-200"
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(admin)}
                            disabled={deletingAdminId === admin.AdminId}
                            className="inline-flex items-center px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingAdminId === admin.AdminId ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700 mr-2"></div>
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredAdmins.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="p-6 bg-gray-100 rounded-full mb-4">
                          <User className="w-12 h-12 text-gray-400" />
                        </div>
                        <p className="text-gray-600 text-xl font-bold mb-2">
                          No admins found
                        </p>
                        <p className="text-gray-500 text-sm max-w-md">
                          No admins match your current search or filter
                          criteria. Try adjusting them.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50/90 backdrop-blur-sm border-2 border-red-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg mr-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h4 className="text-red-800 font-bold text-lg">
                  Error Occurred
                </h4>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 via-red-700 to-pink-700 px-6 py-6">
              <div className="flex items-center">
                <div className="p-3 bg-white/20 rounded-xl mr-4">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Confirm Deletion
                  </h3>
                  <p className="text-red-100 mt-1">
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <div className="flex items-center mb-3">
                  <User className="w-5 h-5 text-red-600 mr-2" />
                  <span className="font-bold text-red-800">
                    Admin to Delete:
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>ID:</strong> {selectedAdmin.AdminId}
                  </p>
                  <p>
                    <strong>Name:</strong> {selectedAdmin.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedAdmin.Email}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <AlertTriangle className="w-4 h-4 inline mr-2 text-red-600" />
                  Reason for Removal (Required)
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 resize-none"
                  placeholder="Provide a detailed reason for removing this admin..."
                />
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedAdmin(null);
                  setDeleteReason("");
                }}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={!deleteReason.trim() || deletingAdminId}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {deletingAdminId ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Admin
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
