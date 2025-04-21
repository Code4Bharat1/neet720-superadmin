"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";

const SuperAdminLogin = () => {
  const [credentials, setCredentials] = useState({
    superId: "",
    password: "",
  });

  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleLogin = () => {
    const { superId, password } = credentials;

    if (superId === "rishi" && password === "rishi") {
      toast.success("Login Successful 🎉");
      setTimeout(() => {
        router.push("/login");
      }, 1000); // delay slightly to show toast
    } else {
      toast.error("Invalid Super ID or Password ❌");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0077B6] to-[#ADE8F4] flex items-center justify-center">
      <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/nexcore-logo-pc.png"
            alt="Nexcore Logo"
            width={200}
            height={100}
            className="object-contain"
          />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-[#0077B6] mb-6">
          Super Admin Login
        </h2>

        {/* Inputs */}
        <div className="space-y-4 text-left">
          <div>
            <label className="block text-sm font-semibold text-[#53ADD3] mb-2">
              Super ID
            </label>
            <input
              type="text"
              name="superId"
              value={credentials.superId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
              placeholder="Enter Super ID"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#53ADD3] mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
              placeholder="Enter Password"
              required
            />
          </div>
        </div>

        {/* Button */}
        <button
          onClick={handleLogin}
          className="mt-6 w-full py-3 bg-[#45A4CE] text-white font-semibold rounded-md hover:bg-[#359bc0] transition-all"
        >
          Verify
        </button>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
