"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Mail,
  Phone,
  Calendar,
  MapPin,
  User,
  Shield,
  Eye,
  EyeOff,
  Building,
  Key,
  ArrowLeft,
  RefreshCw,
  Copy,
} from "lucide-react";
import Link from "next/link";

export default function AddAdminPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    AdminId: "",
    PassKey: "",
    name: "",
    Course: "",
    Email: "",
    mobileNumber: "",
    whatsappNumber: "",
    StartDate: "",
    ExpiryDate: "",
    address: "",
    HodName: "",
    role: "admin",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("adminAuthToken") ||
        sessionStorage.getItem("adminAuthToken");

      if (!token) {
        // Redirect to login if token is missing
        router.replace("/"); // change this to your login route
      }
    }
  }, [router]);

  // Generate random Admin ID
  const generateAdminId = () => {
    const prefix = "ADM";
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  };

  // Generate random password
  const generateRandomPassword = () => {
    const length = 12;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";

    // Ensure at least one of each type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // uppercase
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // lowercase
    password += "0123456789"[Math.floor(Math.random() * 10)]; // number
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // special char

    // Fill remaining length
    for (let i = password.length; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    // Shuffle the password
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  };

  // Auto-generate Admin ID on component mount
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      AdminId: generateAdminId(),
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // guard to keep only digits for phone fields (UI-level)
    if (name === "mobileNumber" || name === "whatsappNumber") {
      const digits = value.replace(/\D/g, "").slice(0, 10); // keep max 10
      setFormData((s) => ({ ...s, [name]: digits }));
    } else {
      setFormData((s) => ({ ...s, [name]: value }));
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setFormData((prev) => ({
      ...prev,
      PassKey: newPassword,
    }));
    toast.success("New password generated!", { duration: 2000 });
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(formData.PassKey);
      toast.success("Password copied to clipboard!", { duration: 2000 });
    } catch (err) {
      toast.error("Failed to copy password");
    }
  };

  const handleRegenerateAdminId = () => {
    setFormData((prev) => ({
      ...prev,
      AdminId: generateAdminId(),
    }));
    toast.success("New Admin ID generated!", { duration: 2000 });
  };

  const sendEmailToAdmin = async (
    email,
    adminId,
    password,
    startDate,
    expiryDate
  ) => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/email`,
        {
          to: email,
          subject: "🎉 Welcome Aboard as Admin at Exam Portal!",
          text: `Hey there 👋,\n\n🎊 Congratulations on becoming an Admin at Exam Portal! 🎯\n\nHere are your login credentials:\n\n🆔 Admin ID: ${adminId}\n🔐 Password: ${password}\n📅 Start Date: ${startDate}\n📆 Expiry Date: ${expiryDate}\n\nPlease keep this information safe and secure. 🔒\n\nYou're now ready to manage the portal like a pro! 💪\n\nBest wishes,\nThe Exam Portal Team 🚀`,
        }
      );
      if (res.status === 200) console.log("Admin email sent successfully ✅");
    } catch (err) {
      console.error("Error sending admin email:", err);
      toast.error("Admin was created, but email sending failed.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        AdminId: formData.AdminId,
        PassKey: formData.PassKey,
        name: formData.name,
        Course: formData.Course,
        Email: formData.Email,
        mobileNumber: formData.mobileNumber,
        whatsappNumber: formData.whatsappNumber,
        StartDate: formData.StartDate,
        ExpiryDate: formData.ExpiryDate,
        address: formData.address,
        HodName: formData.HodName,
        role: formData.role || "admin",
      };

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/superadmin/createadmin`,
        payload
      );

      await sendEmailToAdmin(
        formData.Email,
        formData.AdminId,
        formData.PassKey,
        formData.StartDate,
        formData.ExpiryDate
      );

      // Reset form with new auto-generated Admin ID
      setFormData({
        AdminId: generateAdminId(),
        PassKey: "",
        name: "",
        Course: "",
        Email: "",
        mobileNumber: "",
        whatsappNumber: "",
        StartDate: "",
        ExpiryDate: "",
        address: "",
        HodName: "",
        role: "admin",
      });

      toast.success("Admin added successfully! Email sent 📧", {
        duration: 5000,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.", {
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/60 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Add Admin</h1>
                <p className="text-sm text-gray-500">
                  Create a new admin account
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/remove-admin"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                Remove Admin
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white flex items-center">
                  <UserPlus className="w-8 h-8 mr-3" />
                  Create New Admin
                </h2>
                <p className="text-blue-100 mt-2 text-lg">
                  Fill in the details to create a new admin account
                </p>
              </div>
              <div className="hidden sm:block p-4 bg-white/10 rounded-2xl">
                <Shield className="w-12 h-12 text-white/80" />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
              {/* Left Column - Basic Information */}
              <div className="space-y-8">
                <div className="pb-4 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    Basic Information
                  </h3>
                  <p className="text-gray-600 mt-2">
                    Essential details for the admin account
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Auto-generated Admin ID */}
                  {/* <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <Shield className="w-4 h-4 inline mr-2 text-blue-600" />
                      Admin ID (Auto-Generated)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="AdminId"
                        value={formData.AdminId}
                        readOnly
                        className="flex-1 px-4 py-4 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-700 font-mono"
                        placeholder="Auto-generated"
                      />
                      <button
                        type="button"
                        onClick={handleRegenerateAdminId}
                        className="px-4 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors duration-200 flex items-center gap-2"
                        title="Generate new Admin ID"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Admin ID is automatically generated. Click refresh to generate a new one.</p>
                  </div> */}

                  {/* Password with Generator */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <Key className="w-4 h-4 inline mr-2 text-blue-600" />
                      Password
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="PassKey"
                          value={formData.PassKey}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-4 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 hover:bg-white"
                          placeholder="Enter password or generate one"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="px-4 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors duration-200 flex items-center gap-2"
                        title="Generate random password"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                      {formData.PassKey && (
                        <button
                          type="button"
                          onClick={handleCopyPassword}
                          className="px-4 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors duration-200"
                          title="Copy password"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Use the generate button to create a secure random password
                    </p>
                  </div>

                  {/* Full Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <User className="w-4 h-4 inline mr-2 text-blue-600" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 hover:bg-white"
                      placeholder="Enter full name"
                    />
                  </div>

                  {/* Email */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <Mail className="w-4 h-4 inline mr-2 text-blue-600" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="Email"
                      value={formData.Email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 hover:bg-white"
                      placeholder="Enter email address"
                    />
                  </div>

                  {/* Course */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <Building className="w-4 h-4 inline mr-2 text-blue-600" />
                      Course/Department
                    </label>
                    <input
                      type="text"
                      name="Course"
                      value={formData.Course}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 hover:bg-white"
                      placeholder="Enter course or department"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <Shield className="w-4 h-4 inline mr-2 text-blue-600" />
                      Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 hover:bg-white"
                    >
                      <option value="superadmin">Super Admin</option>
                      <option value="admin">Admin</option>
                      {/* <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option> */}
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column - Contact & Additional Info */}
              <div className="space-y-8">
                <div className="pb-4 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    Contact & Additional Information
                  </h3>
                  <p className="text-gray-600 mt-2">
                    Contact details and additional information
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Mobile Number */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <Phone className="w-4 h-4 inline mr-2 text-green-600" />
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      required
                      pattern="\d{10}"
                      maxLength={10}
                      inputMode="numeric"
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 hover:bg-white"
                      placeholder="9876543210"
                    />
                    <p className="text-xs text-gray-500 mt-1">10 digits only</p>
                  </div>

                  {/* WhatsApp Number */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      name="whatsappNumber"
                      value={formData.whatsappNumber}
                      onChange={handleChange}
                      pattern="\d{10}"
                      maxLength={10}
                      inputMode="numeric"
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 hover:bg-white"
                      placeholder="9876543210"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional, 10 digits
                    </p>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <Calendar className="w-4 h-4 inline mr-2 text-green-600" />
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="StartDate"
                      value={formData.StartDate}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 hover:bg-white"
                    />
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <Calendar className="w-4 h-4 inline mr-2 text-green-600" />
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      name="ExpiryDate"
                      value={formData.ExpiryDate}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 hover:bg-white"
                    />
                  </div>

                  {/* Address */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <MapPin className="w-4 h-4 inline mr-2 text-green-600" />
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none bg-gray-50/50 hover:bg-white"
                      placeholder="Enter complete address"
                    />
                  </div>

                  {/* HOD Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <User className="w-4 h-4 inline mr-2 text-green-600" />
                      HOD Name
                    </label>
                    <input
                      type="text"
                      name="HodName"
                      value={formData.HodName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 hover:bg-white"
                      placeholder="Enter HOD name"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white font-bold py-5 px-8 rounded-2xl focus:ring-4 focus:ring-blue-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 text-lg shadow-xl hover:shadow-2xl"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Creating Admin...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-6 h-6" />
                    <span>Create Admin Account</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
