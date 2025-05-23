"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";

const Login = () => {
  const [mode, setMode] = useState("add"); // add or remove mode
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
    logo: null, // Changed to null for file upload
    navbarColor: "#ffffff", // Added with default white
    sidebarColor: "#ffffff", // Added with default white
    textColor: "#000000", // Changed from otherColor to textColor for clarity
  });

  const data = {
    AdminId : formData.AdminId,
    PassKey : formData.PassKey,
    name : formData.name,
    Course : formData.Course,
    Email : formData.Email,
    mobileNumber : formData.mobileNumber,
    whatsappNumber : formData.whatsappNumber,
    StartDate : formData.StartDate,
    ExpiryDate: formData.ExpiryDate,
    address : formData.address,
    HodName : formData.HodName,
    logo : formData.HodName,
    navbarColor : formData.navbarColor,
    sidebarColor : formData.sidebarColor,
    otherColor : formData.textColor,
  }

  const [deleteData, setDeleteData] = useState({
    AdminId: "",
    reason: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adminList, setAdminList] = useState([]);
  const [logoPreview, setLogoPreview] = useState(null); // For logo preview
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
        <span className="bg-blue-500 text-white px-2 py-1 text-[16px] rounded">
          Null
        </span>
      );
    const today = new Date();
    const exp = new Date(expiryDate);
    return exp > today ? (
      <span className="bg-green-500 text-white px-2 py-1 rounded text-[16px]">
        Active
      </span>
    ) : (
      <span className="bg-red-500 text-white px-2 py-1 rounded-[5px] text-[16px]">
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
      setFormData({ ...formData, logo: file });
      
      // Create preview
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
        
        // Append all fields to FormData
        Object.keys(formData).forEach(key => {
          if (key === 'logo' && formData[key]) {
            formDataToSend.append('logo', formData[key]);
          } else if (formData[key] !== null && formData[key] !== undefined) {
            formDataToSend.append(key, formData[key]);
          }
        });

        await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/newadmin/signup`,
          formData,
          
        );

        // Send email to the new admin
        await sendEmailToAdmin(
          formData.Email,
          formData.AdminId,
          formData.PassKey,
          formData.StartDate,
          formData.ExpiryDate
        );
        
        window.location.reload();
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

  // Send email with login credentials to the admin
  const sendEmailToAdmin = async (
    email,
    adminId,
    password,
    startDate,
    expiryDate
  ) => {
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
      } else {
        console.warn("Email request sent but not confirmed.");
      }
    } catch (error) {
      console.error("Error sending admin email:", error);
      toast.error("Admin was created, but email sending failed.");
    }
  };

  return (
    <div className="flex flex-wrap bg-gradient-to-b from-[#0077B6] to-[#ADE8F4] min-h-screen">
      {/* Left Section */}
      <div className="hidden md:flex md:w-[40%] items-center justify-center">
        <Image
          src="/nexcore-logo-pc.png"
          alt="Nexcore Logo"
          width={300}
          height={200}
          className="object-contain"
        />
      </div>

      {/* Right Section */}
      <div className="flex flex-col items-center justify-start w-full md:w-[60%] bg-white p-6 md:rounded-l-3xl py-10">
        {/* Toggle Buttons */}
        <div className="mb-6 flex space-x-4">
          <button
            className={`px-6 py-2 rounded-md font-semibold ${
              mode === "add" ? "bg-[#45A4CE] text-white" : "bg-gray-200 text-black"
            }`}
            onClick={() => setMode("add")}
          >
            Add Admin
          </button>
          <button
            className={`px-6 py-2 rounded-md font-semibold ${
              mode === "remove" ? "bg-red-500 text-white" : "bg-gray-200 text-black"
            }`}
            onClick={() => setMode("remove")}
          >
            Remove Admin
          </button>
        </div>

        <h2 className="text-center text-2xl md:text-3xl font-bold text-[#45A4CE] mb-6">
          {mode === "add" ? "Create Admin Account" : "Remove Admin Account"}
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
          {mode === "add" ? (
            <>
              {[ // Admin creation form fields
                { label: "Admin ID", name: "AdminId", type: "text" },
                { label: "Password", name: "PassKey", type: "password" },
                { label: "Name", name: "name", type: "text" },
                { label: "Email", name: "Email", type: "email" },
                { label: "Mobile Number", name: "mobileNumber", type: "text" },
                { label: "WhatsApp Number", name: "whatsappNumber", type: "text" },
                { label: "Start Date", name: "StartDate", type: "date" },
                { label: "Expiry Date", name: "ExpiryDate", type: "date" },
                { label: "Address", name: "address", type: "text" },
                { label: "HOD Name", name: "HodName", type: "text" },
              ].map((field) => (
                <div key={field.name}>
                  <label htmlFor={field.name} className="block text-sm font-semibold text-[#53ADD3] mb-2">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    id={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    required={field.type !== 'color'}
                    className="appearance-none rounded-md block w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={field.label}
                  />
                </div>
              ))}

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-semibold text-[#53ADD3] mb-2">
                  Logo
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex flex-col items-center justify-center w-full p-2 border-2 border-dashed rounded-lg cursor-pointer border-gray-300 hover:border-blue-500">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
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
                    <div className="w-16 h-16 border rounded-md overflow-hidden">
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              {/* Navbar Color Picker */}
              <div>
                <label htmlFor="navbarColor" className="block text-sm font-semibold text-[#53ADD3] mb-2">
                  Navbar Color
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="color"
                    name="navbarColor"
                    id="navbarColor"
                    value={formData.navbarColor}
                    onChange={(e) => handleColorChange('navbarColor', e.target.value)}
                    className="w-12 h-12 rounded-md cursor-pointer"
                  />
                  <span>{formData.navbarColor}</span>
                </div>
              </div>

              {/* Sidebar Color Picker */}
              <div>
                <label htmlFor="sidebarColor" className="block text-sm font-semibold text-[#53ADD3] mb-2">
                  Sidebar Color
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="color"
                    name="sidebarColor"
                    id="sidebarColor"
                    value={formData.sidebarColor}
                    onChange={(e) => handleColorChange('sidebarColor', e.target.value)}
                    className="w-12 h-12 rounded-md cursor-pointer"
                  />
                  <span>{formData.sidebarColor}</span>
                </div>
              </div>

              {/* Text Color Picker */}
              <div>
                <label htmlFor="textColor" className="block text-sm font-semibold text-[#53ADD3] mb-2">
                  Text Color
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="color"
                    name="textColor"
                    id="textColor"
                    value={formData.textColor}
                    onChange={(e) => handleColorChange('textColor', e.target.value)}
                    className="w-12 h-12 rounded-md cursor-pointer"
                  />
                  <span>{formData.textColor}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="AdminId" className="block text-sm font-semibold text-[#53ADD3] mb-2">
                  Admin ID
                </label>
                <input
                  type="text"
                  name="AdminId"
                  id="AdminId"
                  value={deleteData.AdminId}
                  onChange={handleChange}
                  required
                  placeholder="Admin ID to remove"
                  className="appearance-none rounded-md block w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-semibold text-[#53ADD3] mb-2">
                  Reason for Removal
                </label>
                <textarea
                  name="reason"
                  id="reason"
                  value={deleteData.reason}
                  onChange={handleChange}
                  required
                  placeholder="Reason for deleting the admin"
                  className="appearance-none rounded-md block w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 ${mode === "add" ? "bg-[#45A4CE]" : "bg-red-500"} text-white font-semibold rounded-md transition-all ${loading ? "opacity-75" : ""}`}
          >
            {loading ? (mode === "add" ? "Creating..." : "Removing...") : (mode === "add" ? "Create Admin" : "Remove Admin")}
          </button>
        </form>

        {error && (
          <p className="text-red-500 text-sm text-center mt-4">{error}</p>
        )}

        {/* Admin Table */}
        {mode === "remove" && (
          <div className="mt-10 w-full overflow-x-auto">
            <h3 className="text-center text-xl font-semibold mb-4 text-[#45A4CE]">
              Admin Status Table
            </h3>
            <table className="min-w-full border text-sm text-left text-gray-700">
              <thead className="bg-[#45A4CE] text-white uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-4 py-2 border">Sr. No</th>
                  <th className="px-4 py-2 border">Admin ID</th>
                  <th className="px-4 py-2 border">Email ID</th>
                  <th className="px-4 py-2 border">Expiry</th>
                </tr>
              </thead>
              <tbody>
                {adminList.map((admin, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 border">{index + 1}</td>
                    <td className="px-4 py-2 border">{admin.AdminId || "-"}</td>
                    <td className="px-4 py-2 border">{admin.Email || "-"}</td>
                    <td className="px-4 py-2 border text-center">
                      {getStatusTag(admin.ExpiryDate)}
                    </td>
                  </tr>
                ))}
                {adminList.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-4 text-center text-gray-400">
                      No admins found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;