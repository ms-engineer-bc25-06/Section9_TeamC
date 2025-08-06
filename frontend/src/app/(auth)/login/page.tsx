import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Chrome } from 'lucide-react'; // GoogleログインのアイコンとしてChromeを使用

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm sm:p-8 md:p-10 text-center space-y-8">
        <div className=