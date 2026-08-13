import { Link, Outlet } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { APP_NAME } from "../utils/constants";

/** Premium split-screen layout for login, register and password recovery. */
export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Decorative Left Side */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-primary to-cyan-700 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        
        <div className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-cyan-400/20 blur-3xl animate-float" />
        <div className="absolute -right-20 -bottom-20 h-[400px] w-[400px] rounded-full bg-blue-500/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 slide-up delay-100">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-cyan-600 shadow-lg">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <span className="text-2xl font-bold tracking-tight">{APP_NAME}</span>
          </Link>
        </div>

        <div className="relative z-10 slide-up delay-300">
          <h1 className="text-5xl font-black tracking-tight leading-tight mb-6">
            Empowering communities to fight dengue, together.
          </h1>
          <p className="text-lg text-cyan-50 max-w-md leading-relaxed">
            Join the movement to prevent outbreaks through AI-powered early detection and real-time risk mapping.
          </p>
        </div>
        
        <div className="relative z-10 text-sm text-cyan-100 font-medium slide-up delay-400">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </div>
      </div>

      {/* Form Right Side */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 lg:p-12 relative">
        {/* Mobile Header */}
        <div className="absolute top-6 left-6 lg:hidden slide-in-right delay-100">
          <Link to="/" className="inline-flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">{APP_NAME}</span>
          </Link>
        </div>

        <div className="w-full max-w-md slide-up delay-200">
          <div className="rounded-3xl glass shadow-2xl p-8 lg:p-10 border border-border/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 dark:from-white/5 dark:to-transparent pointer-events-none" />
            <div className="relative z-10">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
