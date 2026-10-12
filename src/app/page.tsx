import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  HeartHandshake,
  LineChart,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  const steps = [
    { num: "01", title: "Donate Surplus Food", desc: "Restaurants, hotels & grocers register prepared or raw edible surplus with expiry timestamps." },
    { num: "02", title: "Quality & Safety Verification", desc: "Administrators verify hygiene, safe holding temperatures, and dietary safety standards." },
    { num: "03", title: "Rule-Based NGO Matching", desc: "Our proximity and capacity algorithm recommends the best suited local food banks." },
    { num: "04", title: "Verified Pickup & Dispatch", desc: "Assigned distributors verify physical condition and generate secure verification records." },
    { num: "05", title: "Live GPS Traceability", desc: "Real-time location stream enables transparency from kitchen dispatch to NGO delivery." },
    { num: "06", title: "Confirmed Impact", desc: "NGO confirms receipt, providing accountability, CO2 reduction metrics, and meals served." },
  ];

  const features = [
    { icon: "📦", title: "Food Donation Management", desc: "Fast donation workflows with automated expiry tracking and status transitions." },
    { icon: "🛡️", title: "Quality & Safety Verification", desc: "Rigorous standards with temperature checkpoints and multi-role confirmation." },
    { icon: "🎯", title: "NGO Matching Engine", desc: "Multi-factor algorithm evaluating distance, urgency, storage fit, and NGO capacity." },
    { icon: "📍", title: "Live Geolocation Tracking", desc: "Real-time browser GPS tracking with interactive maps and arrival estimates." },
    { icon: "📊", title: "Traceability Timeline", desc: "Immutable audit milestones tracking every handoff across the supply chain." },
    { icon: "🌱", title: "Measurable Impact Analytics", desc: "Automated calculation of meals served, CO2e prevented, and water conserved." },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-emerald-700/20">
              🌱
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight block">
                Smart Food Chain
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 block">
                Waste Reduction System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-28 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200/80 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Sustainable Supply Chain & Zero Hunger Initiative</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Turn Surplus Food Into <span className="text-emerald-600">Social Impact</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
          A smart, traceable platform connecting food providers, NGOs and distributors to reduce food waste and deliver surplus food safely to communities in need.
        </p>

        {/* Action CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/register?role=FOOD_PROVIDER">
            <Button variant="primary" size="lg" className="shadow-lg shadow-emerald-700/20">
              Donate Food &rarr;
            </Button>
          </Link>
          <Link href="/register?role=NGO">
            <Button variant="secondary" size="lg">
              Find Food (For NGOs)
            </Button>
          </Link>
          <Link href="/register?role=DISTRIBUTOR">
            <Button variant="outline" size="lg">
              Join as Distributor
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="lg">
              Existing User Login
            </Button>
          </Link>
        </div>

        {/* Live Network Metric Strip */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-2xl font-black text-emerald-600 block">100%</span>
            <span className="text-xs font-semibold text-slate-600 mt-1 block">Traceable Lifecyle</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-2xl font-black text-blue-600 block">&lt; 30 min</span>
            <span className="text-xs font-semibold text-slate-600 mt-1 block">Average Match Response</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-2xl font-black text-amber-600 block">2.5 kg CO₂e</span>
            <span className="text-xs font-semibold text-slate-600 mt-1 block">Prevented Per Rescued Kg</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-2xl font-black text-purple-600 block">Verified</span>
            <span className="text-xs font-semibold text-slate-600 mt-1 block">Double-Handoff Protocol</span>
          </div>
        </div>
      </section>

      {/* How It Works Workflow */}
      <section className="py-16 bg-white border-y border-slate-200 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">How It Works</h2>
            <p className="mt-2 text-sm text-slate-600">
              A systematic end-to-end redistribution workflow ensuring accountability from kitchen to community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div key={step.num} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all hover:shadow-md">
                <span className="text-2xl font-black text-emerald-600 block mb-3 font-mono">{step.num}</span>
                <h3 className="text-base font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Core Platform Features</h2>
          <p className="mt-2 text-sm text-slate-600">
            Engineered for high reliability, food safety compliance, and transparent environmental impact.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-3xl block mb-3">{f.icon}</span>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">{f.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <span className="text-sm font-bold text-white block">Smart Food Supply Chain System</span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              University Software Engineering Capstone & Production Platform
            </span>
          </div>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-white transition-colors">Register</Link>
            <Link href="/register?role=ADMIN" className="hover:text-white transition-colors">Admin Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}