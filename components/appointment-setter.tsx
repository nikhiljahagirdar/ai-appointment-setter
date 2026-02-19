"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { plans, type PlanTier } from "@/lib/plans";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { User } from "@supabase/supabase-js";

import { Button } from "@/components/radix/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/radix/Card";
import { Input } from "@/components/radix/Input";
import { Badge } from "@/components/radix/Badge";
import { Separator } from "@/components/radix/Separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/radix/Alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/radix/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/radix/DropdownMenu";
import { ScrollArea } from "@/components/radix/ScrollArea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/radix/Tabs";
import { VoiceBookingAssistant } from "@/components/radix/VoiceBookingAssistant";
import { CalendarIcon, Mic, CheckCircle2, AlertCircle, LogOut, User as UserIcon, Sparkles, CreditCard, Layout, Lock, ArrowRight } from "lucide-react";
import { toast } from "@/components/radix/use-toast";

type AppointmentSlot = {
  id: string;
  date: string;
  time: string;
  is_booked: boolean;
};

function TemplateRenderer({ html, fallback }: { html?: string; fallback: React.ReactNode }) {
  if (!html) return <>{fallback}</>;
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export function AppointmentSetter() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [plan, setPlan] = useState<PlanTier>("voice-pro");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [tenantData, setTenantData] = useState<any>(null);

  const planDetails = useMemo(() => plans[plan], [plan]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        supabase.from("profiles").select("*").eq("id", data.user.id).single().then(({ data: prof }) => {
          setProfile(prof);
        });
      }
    });

    supabase.from("tenants").select("*").eq("slug", "demo-clinic").single().then(({ data }) => {
      setTenantData(data);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function searchAvailability() {
    if (!user) {
       toast({ title: "Login Required", description: "You must be signed in to view availability.", variant: "destructive" });
       return;
    }
    setLoading(true);
    setError(null);
    setSelectedSlot(null);

    try {
      const response = await fetch(`/api/voice-booking?date=${encodeURIComponent(date)}&plan=${plan}`);
      const data = (await response.json()) as { slots?: AppointmentSlot[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to search appointments.");
      }

      setSlots(data.slots ?? []);
      if ((data.slots ?? []).length === 0) {
        setError("No appointment slots found for that date.");
      }
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Unknown error.");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleUIBook(slot: AppointmentSlot) {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("appointments").insert({
        tenant_id: tenantData?.id,
        slot_id: slot.id,
        customer_id: user.id,
        customer_name: profile?.full_name || user.email,
        booking_type: 'ui',
        status: 'confirmed'
      });

      if (error) throw error;

      await supabase.from("appointment_slots").update({ is_booked: true }).eq("id", slot.id);
      
      setSelectedSlot(slot);
      setSlots(prev => prev.filter(s => s.id !== slot.id));
      toast({ title: "Success", description: "Appointment booked successfully!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-10 px-6 py-12">
      {/* Dynamic Header Section */}
      <TemplateRenderer 
        html={tenantData?.logo_url ? `<img src="${tenantData.logo_url}" class="h-12 mb-4" />` : undefined}
        fallback={
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-widest text-[10px]">
              <Sparkles className="h-4 w-4" />
              <span>{tenantData?.name || "Next-Gen SaaS Platform"} Dashboard</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
              Appointment <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">Concierge</span>
            </h1>
            <p className="text-slate-400 max-w-2xl">
              Access AI-driven scheduling and classic booking interfaces in one place.
            </p>
          </div>
        }
      />

      {/* Plan Selection */}
      <section className="grid gap-6 md:grid-cols-3">
        {(Object.entries(plans) as [PlanTier, typeof plans["starter"]][]).map(([key, item]) => (
          <Card key={key} className={`border-white/10 bg-slate-900/40 backdrop-blur-sm transition-all ${plan === key ? "ring-2 ring-cyan-500/50 border-cyan-500/50" : "opacity-70 hover:opacity-100"}`}>
            <CardHeader>
              <CardTitle className="text-white text-xl">{item.name}</CardTitle>
              <CardDescription className="text-cyan-400 font-bold">{item.price}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => setPlan(key)} variant={plan === key ? "default" : "outline"} className="w-full font-bold">
                {plan === key ? "Selected Plan" : "Switch to " + item.name}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </section>

      <section className="grid gap-8 lg:grid-cols-5">
        {/* Availability & AI Control */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-cyan-500 to-transparent" />
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-cyan-400" />
                Availability Check
              </CardTitle>
              <CardDescription>Verify openings across the tenant schedule.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!user ? (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-4 bg-black/20 rounded-xl border border-dashed border-white/10">
                  <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center">
                    <Lock className="h-6 w-6 text-slate-500" />
                  </div>
                  <div className="space-y-1 px-4">
                    <p className="text-sm font-bold text-white">Login Required</p>
                    <p className="text-xs text-slate-500">Sign in to search availability and book appointments.</p>
                  </div>
                  <Button size="sm" className="bg-white text-slate-950 font-bold" asChild>
                    <Link href="/login">Login / Register <ArrowRight className="ml-2 h-3 w-3" /></Link>
                  </Button>
                </div>
              ) : (
                <>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-slate-950 border-white/10 h-12" />
                  <Button onClick={searchAvailability} disabled={loading || !date} className="w-full bg-cyan-500 text-slate-950 font-black h-12 transition-all active:scale-95">
                    {loading ? <Loader2 className="animate-spin" /> : "Search Availability"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Voice Assistant - Only if logged in and plan allows */}
          {user && planDetails.voiceEnabled ? (
            <VoiceBookingAssistant 
              tenantId={tenantData?.id} 
              userEmail={user.email} 
              userName={profile?.full_name} 
              voiceId={tenantData?.settings?.voice_id}
            />
          ) : user && !planDetails.voiceEnabled ? (
            <Alert className="bg-indigo-500/5 border-indigo-500/20 text-indigo-400">
               <Mic className="h-4 w-4" />
               <AlertTitle className="text-xs font-bold uppercase tracking-widest">Upgrade Required</AlertTitle>
               <AlertDescription className="text-xs">Upgrade to a Voice Pro plan to enable AI Voice Concierge.</AlertDescription>
            </Alert>
          ) : null}
        </div>

        {/* Booking Interface */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="classic">
            <TabsList className="bg-slate-950/50 border border-white/10 w-full justify-start h-auto p-1 gap-2">
              <TabsTrigger value="classic" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-950 font-bold py-2.5 px-6 rounded-md">
                Classic Booking
              </TabsTrigger>
              <TabsTrigger value="custom" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-950 font-bold py-2.5 px-6 rounded-md">
                Custom Interface
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="classic" className="mt-6 outline-none">
              {!user ? (
                <Card className="border-dashed border-white/10 bg-transparent py-20">
                  <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                     <Layout className="h-12 w-12 text-slate-700 mb-2" />
                     <p className="text-slate-400 font-medium italic">Login to view and book with our classic interface</p>
                     <Button variant="outline" className="border-white/10 text-white" asChild>
                       <Link href="/login">Get Access Now</Link>
                     </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-white/10 bg-slate-900/40 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white text-xl">Standard Appointments</CardTitle>
                    <CardDescription>Select a slot to confirm your booking instantly.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="grid gap-3">
                        {slots.map((slot) => (
                          <div key={slot.id} className="group flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-cyan-500/20 transition-all">
                            <div className="flex items-center gap-4">
                               <div className="h-12 w-12 rounded-full bg-cyan-500/5 flex items-center justify-center text-cyan-400">
                                  <Clock className="h-5 w-5" />
                               </div>
                               <div>
                                  <p className="font-black text-white text-lg">{slot.time}</p>
                                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{slot.date}</p>
                               </div>
                            </div>
                            <Button 
                              onClick={() => handleUIBook(slot)} 
                              className="bg-cyan-500 text-slate-950 font-bold px-6 rounded-xl hover:bg-cyan-400"
                            >
                              Book Now
                            </Button>
                          </div>
                        ))}
                        {slots.length === 0 && !loading && (
                          <div className="py-20 text-center opacity-30">
                            <CalendarIcon className="h-10 w-10 mx-auto mb-4" />
                            <p className="italic">Choose a date to browse available slots</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="custom" className="mt-6">
              <Card className="border-white/10 bg-slate-900/40">
                <CardHeader>
                  <CardTitle className="text-white text-xl flex items-center gap-2">
                    <Layout className="h-5 w-5 text-indigo-400" />
                    Custom Tenant UI
                  </CardTitle>
                  <CardDescription>Rendering tenant-specific HTML templates.</CardDescription>
                </CardHeader>
                <CardContent className="min-h-[300px] flex items-center justify-center">
                  <TemplateRenderer 
                    html={tenantData?.booking_template} 
                    fallback={
                      <div className="text-center opacity-40">
                        <p className="text-sm italic">This tenant hasn't added a custom HTML template yet.</p>
                      </div>
                    } 
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Persistence confirmation overlay */}
      <AnimatePresence>
        {selectedSlot && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-6"
          >
             <div className="bg-emerald-500 text-slate-950 p-6 rounded-3xl shadow-2xl flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                   <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                   <p className="font-black uppercase tracking-tighter text-sm">Appointment Confirmed!</p>
                   <p className="text-xs opacity-90 font-medium">Successfully booked for {selectedSlot.date} at {selectedSlot.time}</p>
                </div>
                <Button size="sm" variant="ghost" className="ml-auto hover:bg-white/10" onClick={() => setSelectedSlot(null)}>Close</Button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}
