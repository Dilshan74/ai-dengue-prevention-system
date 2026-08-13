import { Link } from "react-router-dom";
import { ShieldCheck, ArrowRight, Zap, Target, Lock, ChevronRight } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import Button from "../../components/common/Button";

const NAV_LINKS = [
  { href: "#features", label: "Platform Features" },
  { href: "#how-it-works", label: "How It Works" },
];

const FEATURES = [
  {
    icon: Target,
    title: "AI-Powered Detection",
    description: "Upload photos of standing water. Our YOLOv8 model instantly detects and categorizes breeding risks with high precision.",
    color: "from-cyan-400 to-blue-500",
  },
  {
    icon: Zap,
    title: "Real-time Processing",
    description: "Reports are processed instantly and routed directly to the relevant Public Health Inspector in your area.",
    color: "from-amber-400 to-orange-500",
  },
  {
    icon: ShieldCheck,
    title: "Verified Action",
    description: "Track the status of your reports as inspectors verify sites, schedule cleanups, and resolve potential threats.",
    color: "from-emerald-400 to-teal-500",
  },
  {
    icon: Lock,
    title: "Secure & Confidential",
    description: "Your data and location are securely handled, ensuring privacy while contributing to community health.",
    color: "from-violet-400 to-purple-500",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Spot a Risk",
    desc: "Find standing water or potential mosquito breeding sites in your neighborhood.",
  },
  {
    num: "02",
    title: "Snap & Upload",
    desc: "Take a photo and upload it through our secure citizen portal.",
  },
  {
    num: "03",
    title: "AI Analysis",
    desc: "Our model instantly evaluates the image and assigns a risk priority level.",
  },
  {
    num: "04",
    title: "Action Taken",
    desc: "Local inspectors review and resolve the issue, keeping your community safe.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <Navbar links={NAV_LINKS} />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-400/20 blur-[100px] rounded-full mix-blend-multiply opacity-70 animate-pulse-glow" />
          <div className="absolute top-40 -right-20 w-[400px] h-[400px] bg-teal-400/20 blur-[100px] rounded-full mix-blend-multiply opacity-50" />
          <div className="absolute -bottom-20 -left-20 w-[600px] h-[600px] bg-blue-500/10 blur-[100px] rounded-full mix-blend-multiply opacity-60" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6 slide-up">
            <ShieldCheck className="h-4 w-4" />
            <span>Ministry of Health Initiative</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 slide-up delay-100">
            Stop Dengue Before <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-500">
              It Starts.
            </span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-base text-muted-foreground mb-8 leading-relaxed slide-up delay-200">
            Empower your community with AI-driven early detection. Report potential mosquito breeding sites instantly and let intelligent routing handle the rest.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 slide-up delay-300">
            <Button as={Link} to="/register" size="lg" className="w-full sm:w-auto h-12 px-8 text-sm font-medium shadow-xl shadow-primary/20">
              Join the Effort <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button as={Link} to="/login" variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-sm font-medium">
              Sign in to Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 lg:py-20 bg-secondary/30 border-y border-border/50 relative">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-semibold tracking-tight">Intelligent Prevention Platform</h2>
            <p className="mt-4 text-sm text-muted-foreground max-w-2xl mx-auto">Everything you need to monitor, report, and eliminate breeding grounds effectively.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {FEATURES.map((feature, i) => (
              <div key={feature.title} className="group relative p-8 rounded-3xl glass border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-3xl`} />
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} text-white mb-5 shadow-lg`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Workflow */}
      <section id="how-it-works" className="py-16 lg:py-20 relative">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <h2 className="text-2xl font-semibold tracking-tight mb-6">Simple Steps, <br />Massive Impact.</h2>
              <p className="text-base text-muted-foreground mb-8">
                Our streamlined workflow ensures that citizen reports are analyzed by AI and acted upon by health officials without delay.
              </p>
              <div className="space-y-6">
                {STEPS.map((step, index) => (
                  <div key={step.num} className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs border border-primary/20">
                        {step.num}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">{step.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="lg:w-1/2 relative w-full">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary to-cyan-400 rounded-3xl blur-3xl opacity-20 animate-pulse-glow" />
              <div className="relative rounded-3xl glass border border-white/20 p-8 shadow-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                {/* Mockup UI representation */}
                <div className="space-y-4">
                  <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                  <div className="h-48 w-full bg-slate-200 dark:bg-slate-800 rounded-xl flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10" />
                    <Target className="h-12 w-12 text-slate-400 opacity-50" />
                  </div>
                  <div className="flex gap-4">
                    <div className="h-10 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                    <div className="h-10 w-1/2 bg-primary/20 rounded-lg animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">Ready to Protect Your Neighborhood?</h2>
          <p className="text-base text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of citizens actively contributing to a dengue-free environment. It takes less than a minute to make a difference.
          </p>
          <Button as={Link} to="/register" size="lg" className="bg-white text-primary hover:bg-slate-50 h-12 px-10 text-sm font-medium shadow-2xl hover:-translate-y-1 hover:shadow-white/20">
            Create Free Account
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
