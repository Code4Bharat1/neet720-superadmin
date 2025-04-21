import Image from "next/image";
import Login from "@/components/Login/Login";
import { Toaster } from "react-hot-toast";
import SuperAdminLogin from "@/components/SuperAdminLogin/SuperAdminLogin";


export default function Page() {
  return (
    <div>
      <SuperAdminLogin/>
    </div>
  );
}
