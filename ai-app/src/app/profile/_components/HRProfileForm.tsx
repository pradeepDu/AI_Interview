"use client";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { User, Briefcase } from "lucide-react";
import type { ProfileData } from "./types";

interface Props {
  profile: ProfileData;
  userEmail: string;
  onChange: (profile: ProfileData) => void;
}

export function HRProfileForm({ profile, userEmail, onChange }: Props) {
  const set = (partial: Partial<ProfileData>) => onChange({ ...profile, ...partial });

  return (
    <>
      {/* Personal Info */}
      <section className="bg-[#0d1b2e] border border-white/10 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <User className="h-4 w-4 text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Personal Information</h2>
        </div>
        <Separator className="bg-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm text-slate-400">Full Name *</label>
            <Input
              value={profile.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="Jane Smith"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-slate-400">Phone Number</label>
            <Input
              value={profile.phone}
              onChange={(e) => set({ phone: e.target.value })}
              placeholder="+1 234 567 8900"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-slate-400">Email</label>
            <Input value={userEmail} disabled className="bg-white/5 border-white/10 text-slate-500" />
          </div>
        </div>
      </section>

      {/* Company & Role */}
      <section className="bg-[#0d1b2e] border border-white/10 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Briefcase className="h-4 w-4 text-orange-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Company & Role</h2>
        </div>
        <Separator className="bg-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm text-slate-400">Company Name *</label>
            <Input
              value={profile.company || ""}
              onChange={(e) => set({ company: e.target.value })}
              placeholder="Acme Corporation"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-slate-400">Job Title / Designation *</label>
            <Input
              value={profile.designation || ""}
              onChange={(e) => set({ designation: e.target.value })}
              placeholder="Talent Acquisition Manager"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-slate-400">Department</label>
            <Input
              value={profile.department || ""}
              onChange={(e) => set({ department: e.target.value })}
              placeholder="Human Resources"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>
        </div>
      </section>
    </>
  );
}
