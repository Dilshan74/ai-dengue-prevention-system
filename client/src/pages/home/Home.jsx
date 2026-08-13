import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
];

const ROLE_CARDS = [
  {
    title: "Citizens",
    body: "Upload a photo of a suspected mosquito breeding site. Our system analyses the risk and routes it to your local inspector.",
    cta: "Report a site",
    to: "/register",
  },
  {
    title: "Public Health Inspectors",
    body: "Review submitted reports, accept or reject them, schedule site visits, and upload inspection evidence.",
    cta: "Go to dashboard",
    to: "/login",
  },
  {
    title: "Administrators",
    body: "Manage users, PHI assignments, and areas. View monthly reports and monitor system activity.",
    cta: "Admin panel",
    to: "/login",
  },
];

const STEPS = [
  { num: 1, text: "Citizen uploads a photo of a suspected breeding site." },
  { num: 2, text: "The AI model analyses the image and assigns a risk level." },
  { num: 3, text: "The report is sent to the assigned PHI for review." },
  { num: 4, text: "PHI inspects the site and updates the status." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar links={NAV_LINKS} />

      {/* Hero */}
      <section className="border-b border-border bg-white py-12">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            Ministry of Health — Dengue Prevention Initiative
          </p>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            Dengue Breeding Site Reporting System
          </h1>
          <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto">
            Citizens can report suspected breeding sites by uploading a photo. Our AI
            model detects the risk level, and Public Health Inspectors take action.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              Create account
            </Link>
            <Link
              to="/login"
              className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-50"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-xl font-bold text-foreground mb-6">Who is this for?</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {ROLE_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded border border-border bg-white p-4 shadow-sm"
              >
                <h3 className="font-semibold text-foreground mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{card.body}</p>
                <Link
                  to={card.to}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {card.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border bg-white py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-xl font-bold text-foreground mb-6">How it works</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="rounded border border-border bg-background p-4"
              >
                <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {step.num}
                </div>
                <p className="text-sm text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
