"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { UserPlus, UserMinus, Mail, Phone, Calendar, MapPin, User, Shield, Upload, Palette, Eye, EyeOff, Trash2, CheckCircle, XCircle, Clock, Building, Key, MessageSquare, Search, Filter, Download, Settings, AlertTriangle } from 'lucide-react';

const AdminManagement = () => {
  const [mode, setMode] = useState("add");
  const [showPassword, setShowPassword] = useState(false);
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
    logo: null,
    navbarColor: "#3B82F6",
    sidebarColor: "#1E40AF",
    textColor: "#1F2937",
  });

  const [deleteData, setDeleteData] = useState({
    AdminId: "",
    reason: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adminList, setAdminList] = useState([]);
  const [logoPreview, setLogoPreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const router = useRouter();

  useEffect(() => {
    if (mode === "remove") {
      fetchAdminList();
    }
  }, [mode]);

  const fetchAdminList = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/superadmin/getadminlist`
      );
      setAdminList(res.data.admins || []);
    } catch (error) {
      toast.error("Failed to load admin list");
    }
  };

  const getStatusTag = (expiryDate) => {
    if (!expiryDate)
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Clock className="w-3 h-3 mr-1" />
          Null
        </span>
      );

    const today = new Date();
    const exp = new Date(expiryDate);
    return exp > today ? (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Expired
      </span>
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (mode === "add") {
      setFormData({ ...formData, [name]: value });
    } else {
      setDeleteData({ ...deleteData, [name]: value });
    }
  };

  const handleColorChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      
      setFormData({ ...formData, logo: file });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "add") {
        const formDataToSend = new FormData();
        
        Object.keys(formData).forEach(key => {
          if (key === 'logo' && formData[key]) {
            formDataToSend.append('logo', formData[key]);
          } else if (formData[key] !== null && formData[key] !== undefined) {
            formDataToSend.append(key, formData[key]);
          }
        });

        await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/newadmin/signup`,
          formDataToSend,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        await sendEmailToAdmin(
          formData.Email,
          formData.AdminId,
          formData.PassKey,
          formData.StartDate,
          formData.ExpiryDate
        );

        // Reset form
        setFormData({
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
          logo: null,
          navbarColor: "#3B82F6",
          sidebarColor: "#1E40AF",
          textColor: "#1F2937",
        });
        setLogoPreview(null);

        toast.success("Admin added successfully! Email has been sent 📧", {
          duration: 5000,
        });
      } else {
        const confirmed = window.confirm(
          `Are you sure you want to delete admin with ID: ${deleteData.AdminId}?`
        );
        if (!confirmed) {
          toast("Admin deletion cancelled ❌");
          setLoading(false);
          return;
        }

        await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/superadmin/deleteadmin`,
          { AdminId: deleteData.AdminId }
        );

        toast.success("Admin Removed Successfully ✅", {
          duration: 5000,
        });
        setDeleteData({ AdminId: "", reason: "" });
        fetchAdminList();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.", {
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const sendEmailToAdmin = async (email, adminId, password, startDate, expiryDate) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/email`,
        {
          to: email,
          subject: "🎉 Welcome Aboard as Admin at Exam Portal!",
          text: `Hey there 👋,\n\n🎊 Congratulations on becoming an Admin at Exam Portal! 🎯\n\nHere are your login credentials:\n\n🆔 Admin ID: ${adminId}\n🔐 Password: ${password}\n📅 Start Date: ${startDate}\n📆 Expiry Date: ${expiryDate}\n\nPlease keep this information safe and secure. 🔒\n\nYou're now ready to manage the portal like a pro! 💪\n\nBest wishes,\nThe Exam Portal Team 🚀`,
        }
      );
      if (response.status === 200) {
        console.log("Admin email sent successfully ✅");
      }
    } catch (error) {
      console.error("Error sending admin email:", error);
      toast.error("Admin was created, but email sending failed.");
    }
  };

  const filteredAdmins = adminList.filter(admin => {
    const matchesSearch = admin.AdminId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.Email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === "all") return matchesSearch;
    
    const isActive = admin.ExpiryDate ? new Date(admin.ExpiryDate) > new Date() : false;
    if (filterStatus === "active") return matchesSearch && isActive;
    if (filterStatus === "expired") return matchesSearch && !isActive;
    if (filterStatus === "null") return matchesSearch && !admin.ExpiryDate;
    
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Management</h1>
                <p className="text-sm text-gray-500">Manage admin accounts and permissions</p>
              </div>
            </div>
            <div className="hidden md:block">
              <Image
                src="/nexcore-logo-pc.png"
                alt="Nexcore Logo"
                width={120}
                height={40}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl p-1 shadow-lg border">
            <div className="flex space-x-1">
              <button
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  mode === "add"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                }`}
                onClick={() => setMode("add")}
              >
                <UserPlus className="w-5 h-5" />
                <span>Add Admin</span>
              </button>
              <button
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  mode === "remove"
                    ? "bg-red-600 text-white shadow-md"
                    : "text-gray-600 hover:text-red-600 hover:bg-red-50"
                }`}
                onClick={() => setMode("remove")}
              >
                <UserMinus className="w-5 h-5" />
                <span>Remove Admin</span>
              </button>
            </div>
          </div>
        </div>

        {mode === "add" ? (
          /* Add Admin Form */
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <UserPlus className="w-7 h-7 mr-3" />
                  Create New Admin Account
                </h2>
                <p className="text-blue-100 mt-2">Fill in the details to create a new admin account</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Basic Information */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-600" />
                      Basic Information
                    </h3>

                    {/* Admin ID */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Shield className="w-4 h-4 inline mr-1" />
                        Admin ID
                      </label>
                      <input
                        type="text"
                        name="AdminId"
                        value={formData.AdminId}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter unique admin ID"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Key className="w-4 h-4 inline mr-1" />
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="PassKey"
                          value={formData.PassKey}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Enter secure password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter full name"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="Email"
                        value={formData.Email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter email address"
                      />
                    </div>

                    {/* Course */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Building className="w-4 h-4 inline mr-1" />
                        Course/Department
                      </label>
                      <input
                        type="text"
                        name="Course"
                        value={formData.Course}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter course or department"
                      />
                    </div>
                  </div>

                  {/* Contact & Additional Info */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Phone className="w-5 h-5 mr-2 text-blue-600" />
                      Contact & Additional Information
                    </h3>

                    {/* Mobile Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-1" />
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        name="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter mobile number"
                      />
                    </div>

                    {/* WhatsApp Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MessageSquare className="w-4 h-4 inline mr-1" />
                        WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        name="whatsappNumber"
                        value={formData.whatsappNumber}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter WhatsApp number"
                      />
                    </div>

                    {/* Start Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="StartDate"
                        value={formData.StartDate}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Expiry Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        name="ExpiryDate"
                        value={formData.ExpiryDate}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Address
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        placeholder="Enter complete address"
                      />
                    </div>

                    {/* HOD Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        HOD Name
                      </label>
                      <input
                        type="text"
                        name="HodName"
                        value={formData.HodName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter HOD name"
                      />
                    </div>
                  </div>
                </div>

                {/* Logo Upload & Customization */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
                    <Settings className="w-5 h-5 mr-2 text-blue-600" />
                    Customization Settings
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Logo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Upload className="w-4 h-4 inline mr-1" />
                        Organization Logo
                      </label>
                      <div className="flex items-center space-x-4">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 5MB)</p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="hidden"
                          />
                        </label>
                        {logoPreview && (
                          <div className="w-24 h-24 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                            <img src={logoPreview || "/placeholder.svg"} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Color Customization */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <Palette className="w-4 h-4 mr-1" />
                        Theme Colors
                      </h4>
                      
                      {/* Navbar Color */}
                      <div className="flex items-center space-x-4">
                        <label className="text-sm font-medium text-gray-700 w-24">Navbar:</label>
                        <input
                          type="color"
                          name="navbarColor"
                          value={formData.navbarColor}
                          onChange={(e) => handleColorChange('navbarColor', e.target.value)}
                          className="w-12 h-12 rounded-lg cursor-pointer border border-gray-300"
                        />
                        <span className="text-sm text-gray-600 font-mono">{formData.navbarColor}</span>
                      </div>

                      {/* Sidebar Color */}
                      <div className="flex items-center space-x-4">
                        <label className="text-sm font-medium text-gray-700 w-24">Sidebar:</label>
                        <input
                          type="color"
                          name="sidebarColor"
                          value={formData.sidebarColor}
                          onChange={(e) => handleColorChange('sidebarColor', e.target.value)}
                          className="w-12 h-12 rounded-lg cursor-pointer border border-gray-300"
                        />
                        <span className="text-sm text-gray-600 font-mono">{formData.sidebarColor}</span>
                      </div>

                      {/* Text Color */}
                      <div className="flex items-center space-x-4">
                        <label className="text-sm font-medium text-gray-700 w-24">Text:</label>
                        <input
                          type="color"
                          name="textColor"
                          value={formData.textColor}
                          onChange={(e) => handleColorChange('textColor', e.target.value)}
                          className="w-12 h-12 rounded-lg cursor-pointer border border-gray-300"
                        />
                        <span className="text-sm text-gray-600 font-mono">{formData.textColor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Creating Admin...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        <span>Create Admin Account</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Remove Admin Section */
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Remove Form */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-pink-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <UserMinus className="w-7 h-7 mr-3" />
                  Remove Admin Account
                </h2>
                <p className="text-red-100 mt-2">Permanently remove an admin account from the system</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Shield className="w-4 h-4 inline mr-1" />
                      Admin ID to Remove
                    </label>
                    <input
                      type="text"
                      name="AdminId"
                      value={deleteData.AdminId}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      placeholder="Enter admin ID to remove"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      Reason for Removal
                    </label>
                    <textarea
                      name="reason"
                      value={deleteData.reason}
                      onChange={handleChange}
                      required
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                      placeholder="Provide reason for removing this admin"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-red-700 hover:to-pink-700 focus:ring-4 focus:ring-red-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Removing Admin...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5" />
                        <span>Remove Admin Account</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Admin List */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                      <User className="w-6 h-6 mr-2 text-blue-600" />
                      Admin Status Overview
                    </h3>
                    <p className="text-gray-600 mt-1">Monitor and manage all admin accounts</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search admins..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    {/* Filter */}
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                        <option value="null">No Expiry</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sr. No
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admin Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expiry Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAdmins.map((admin, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {admin.AdminId || "-"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {admin.name || "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center">
                            <Mail className="w-4 h-4 mr-1 text-gray-400" />
                            {admin.Email || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusTag(admin.ExpiryDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {admin.ExpiryDate ? (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                              {new Date(admin.ExpiryDate).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-gray-400">No expiry set</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredAdmins.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <User className="w-12 h-12 text-gray-300 mb-4" />
                            <p className="text-gray-500 text-lg font-medium">No admins found</p>
                            <p className="text-gray-400 text-sm">Try adjusting your search or filter criteria</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filteredAdmins.length > 0 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{filteredAdmins.length}</span> of{" "}
                      <span className="font-medium">{adminList.length}</span> admins
                    </p>
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                      <Download className="w-4 h-4 mr-2" />
                      Export List
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-4xl mx-auto mt-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManagement;