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
    logo: "",
  });

  const [deleteData, setDeleteData] = useState({
    AdminId: "",
    reason: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adminList, setAdminList] = useState([]); // List of admins to display
  const router = useRouter();

  useEffect(() => {
    if (mode === "remove") {
      fetchAdminList();
    }
  }, [mode]); // Re-fetch admin list when mode changes to remove

  // Function to fetch admin list for removal
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

  // Handle input field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (mode === "add") {
      setFormData({ ...formData, [name]: value });
    } else {
      setDeleteData({ ...deleteData, [name]: value });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "add") {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/newadmin/signup`,
          formData
        );

        // Send email to the new admin
        await sendEmailToAdmin(
          formData.Email,
          formData.AdminId,
          formData.PassKey,
          formData.StartDate,
          formData.ExpiryDate
        );

        toast.success("Admin added successfully! Email has been sent 📧", {
          duration: 5000,
        });

        window.location.reload();
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
        fetchAdminList(); // Refetch the admin list
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
                    required
                    className="appearance-none rounded-md block w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={field.label}
                  />
                </div>
              ))}
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
