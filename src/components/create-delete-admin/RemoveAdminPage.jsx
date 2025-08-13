"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Image from "next/image";
import toast from "react-hot-toast";
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
  const [loading, setLoading] = useState(false);
  const [deleteData, setDeleteData] = useState({ AdminId: "", reason: "" });
  const [adminList, setAdminList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [error, setError] = useState(null);

  const fetchAdminList = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/superadmin/getadminlist`
      );
      // Expect each admin to include: id, AdminId, Email, ExpiryDate, created_by_admin_id, role, name, mobileNumber
      setAdminList(res.data.admins || []);
    } catch (err) {
      toast.error("Failed to load admin list");
    }
  };

  useEffect(() => {
    fetchAdminList();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDeleteData((s) => ({ ...s, [name]: value }));
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!deleteData.AdminId) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete admin with ID: ${deleteData.AdminId}?`
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/superadmin/deleteadmin`,
        { AdminId: deleteData.AdminId, reason: deleteData.reason }
      );

      toast.success("Admin Removed Successfully ✅", { duration: 5000 });
      setDeleteData({ AdminId: "", reason: "" });
      fetchAdminList();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.", {
        duration: 5000,
      });
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
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
      else if (filterStatus === "sub") statusPass = admin.created_by_admin_id != null;
      else if (filterStatus === "roots") statusPass = admin.created_by_admin_id == null;

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
                <h1 className="text-xl font-bold text-gray-900">Remove Admin</h1>
                <p className="text-sm text-gray-500">Permanently remove an admin account</p>
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
        {/* Remove Form */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 via-red-700 to-pink-700 px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white flex items-center">
                  <UserMinus className="w-8 h-8 mr-3" />
                  Remove Admin Account
                </h2>
                <p className="text-red-100 mt-2 text-lg">
                  Enter Admin ID and reason to permanently remove an admin
                </p>
              </div>
              <div className="hidden sm:block p-4 bg-white/10 rounded-2xl">
                <Trash2 className="w-12 h-12 text-white/80" />
              </div>
            </div>
          </div>

          <form onSubmit={handleDelete} className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <Shield className="w-4 h-4 inline mr-2 text-red-600" />
                    Admin ID to Remove
                  </label>
                  <input
                    type="text"
                    name="AdminId"
                    value={deleteData.AdminId}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-gray-50/50 hover:bg-white"
                    placeholder="Enter admin ID to remove"
                  />
                  <p className="text-xs text-gray-500 mt-2">This action cannot be undone</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <AlertTriangle className="w-4 h-4 inline mr-2 text-red-600" />
                    Reason for Removal
                  </label>
                  <textarea
                    name="reason"
                    value={deleteData.reason}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 resize-none bg-gray-50/50 hover:bg-white"
                    placeholder="Provide a detailed reason for removing this admin"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 via-red-700 to-pink-700 hover:from-red-700 hover:via-red-800 hover:to-pink-800 text-white font-bold py-5 px-8 rounded-2xl focus:ring-4 focus:ring-red-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 text-lg shadow-xl hover:shadow-2xl"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Removing Admin...</span>
                  </>
                ) : (
                  <>
                    <UserMinus className="w-6 h-6" />
                    <span>Remove Admin Account</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Admin List */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-8 py-8 border-b border-gray-200/60">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  Admin Status Overview
                </h3>
                <p className="text-gray-600 mt-2 text-lg">
                  Monitor and manage all admin accounts ({adminList.length} total)
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
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-gray-200">
                {filteredAdmins.map((admin, index) => {
                  const creator =
                    admin.created_by_admin_id != null
                      ? idToAdmin.get(admin.created_by_admin_id)
                      : null;

                  return (
                    <tr key={index} className="hover:bg-blue-50/50 transition-all duration-200">
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
                            <span className="text-gray-500 font-medium">#{creator.id}</span>
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
                                {new Date(admin.ExpiryDate).toLocaleDateString()}
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
                            <span className="text-gray-500 font-medium">No expiry set</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredAdmins.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="p-6 bg-gray-100 rounded-full mb-4">
                          <User className="w-12 h-12 text-gray-400" />
                        </div>
                        <p className="text-gray-600 text-xl font-bold mb-2">No admins found</p>
                        <p className="text-gray-500 text-sm max-w-md">
                          No admins match your current search or filter criteria. Try adjusting them.
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
                <h4 className="text-red-800 font-bold text-lg">Error Occurred</h4>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
