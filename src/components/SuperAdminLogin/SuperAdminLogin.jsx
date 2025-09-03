"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import axios from "axios";

const SuperAdminLogin = () => {
  const [credentials, setCredentials] = useState({
    superId: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/superadmin/login`, {
        username: credentials.superId,
        passkey: credentials.password,
      });

      // Store token in localStorage
      localStorage.setItem('superadmin_token', response.data.token);
      toast.success("Login Successful 🎉");
      setTimeout(() => {
        router.push("/add-admin");
      }, 1000);
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle different error scenarios
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        toast.error(error.response.data.message || "Invalid credentials");
      } else if (error.request) {
        // The request was made but no response was received
        toast.error("No response from server. Please check your connection.");
      } else {
        // Something happened in setting up the request that triggered an Error
        toast.error("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0077B6] to-[#ADE8F4] flex items-center justify-center">
      <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/neet720_logo.jpg"
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
        
        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-left">
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>
          
          {/* Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`mt-6 w-full py-3 text-white font-semibold rounded-md transition-all ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-[#45A4CE] hover:bg-[#359bc0]'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : (
              "Verify"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SuperAdminLogin;