"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/radix/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/radix/Card";
import { Badge } from "@/components/radix/Badge";
import { 
  Sparkles, 
  Mic, 
  Calendar, 
  ShieldCheck, 
  Zap, 
  PlayCircle,
  Clock,
  Globe,
  MessageSquare,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type Plan = {
  id: string;
  code: string;
  name: string;
  monthly_price_cents: number;
  features: string[];
  voice_enabled: boolean;
};

export default function LandingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      const { data, error } = await supabase
        .from("platform_plans")
        .select("*")
        .order("monthly_price_cents", { ascending: true });
      
      if (!error && data) {
        setPlans(data);
      }
      setLoading(false);
    }
    fetchPlans();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
        
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="max-w-4xl text-5xl font-black tracking-tight text-white sm:text-7xl lg:text-8xl"
            >
              Automate Bookings with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">AI Voice Agents</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 max-w-2xl text-lg text-slate-400 sm:text-xl"
            >
              The first multi-tenant SaaS platform that lets your customers book appointments through ultra-realistic voice conversations. No more hold music, just instant scheduling.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-wrap justify-center gap-4"
            >
              <Button size="lg" className="h-14 bg-cyan-500 px-8 text-lg font-bold text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20" asChild>
                <Link href="/dashboard">Start Booking Now</Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 border-white/10 px-8 text-lg font-bold text-white hover:bg-white/5">
                <PlayCircle className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-950/50 border-y border-white/5">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-black text-white sm:text-5xl">Engineered for Modern Teams</h2>
            <p className="mt-4 text-slate-400">Two powerful ways to manage your schedule, one unified platform.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-white/5 bg-white/[0.02] transition-colors hover:border-cyan-500/20">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Mic className="h-6 w-6" />
                </div>
                <CardTitle className="text-white">AI Voice Assistant</CardTitle>
                <CardDescription className="text-slate-400">
                  Customers can book appointments by talking to a sophisticated AI agent that understands context and availability.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-white/5 bg-white/[0.02] transition-colors hover:border-indigo-500/20">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Calendar className="h-6 w-6" />
                </div>
                <CardTitle className="text-white">Classic UI Booker</CardTitle>
                <CardDescription className="text-slate-400">
                  A polished, high-speed visual booking interface for customers who prefer a traditional point-and-click experience.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-white/5 bg-white/[0.02] transition-colors hover:border-emerald-500/20">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Globe className="h-6 w-6" />
                </div>
                <CardTitle className="text-white">Multi-Tenant Logic</CardTitle>
                <CardDescription className="text-slate-400">
                  Enterprise-grade isolation for different organizations, clinics, or businesses using the same platform.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-white/5 bg-white/[0.02] transition-colors hover:border-fuchsia-500/20">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-400">
                  <Zap className="h-6 w-6" />
                </div>
                <CardTitle className="text-white">Instant Sync</CardTitle>
                <CardDescription className="text-slate-400">
                  Real-time synchronization between voice bookings and the dashboard prevents double-booking.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-white/5 bg-white/[0.02] transition-colors hover:border-rose-500/20">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <CardTitle className="text-white">Custom Templates</CardTitle>
                <CardDescription className="text-slate-400">
                  Tenants can add their own HTML templates to customize the registration and booking experience.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-white/5 bg-white/[0.02] transition-colors hover:border-amber-500/20">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <CardTitle className="text-white">Role-Based Access</CardTitle>
                <CardDescription className="text-slate-400">
                  Granular control for Super Admins, Tenants, and Customers within a secure Supabase architecture.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-black text-white sm:text-5xl">Simple, Scalable Pricing</h2>
            <p className="mt-4 text-slate-400">Choose the plan that fits your business needs.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {loading ? (
              <div className="col-span-3 flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
              </div>
            ) : (
              plans.map((plan) => (
                <Card key={plan.id} className={cn(
                  "border-white/10 bg-slate-900/40 backdrop-blur-sm transition-all hover:scale-[1.02]",
                  plan.code === 'voice-pro' ? "ring-2 ring-cyan-500/50 border-cyan-500/50" : ""
                )}>
                  <CardHeader>
                    <CardTitle className="text-white">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-black text-white">${(plan.monthly_price_cents / 100).toFixed(0)}</span>
                      <span className="text-slate-500">/mo</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {plan.features?.map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                          <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className={cn(
                      "w-full font-bold h-12",
                      plan.code === 'voice-pro' ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400" : "bg-white/5 text-white hover:bg-white/10"
                    )} asChild>
                      <Link href="/register/tenant">Get Started</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 text-center text-slate-500 text-sm">
          <p>© 2026 VOICEBOOK AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function CheckCircle2({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" viewBox="0 0 24 24" 
      fill="none" stroke="currentColor" strokeWidth="2" 
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
