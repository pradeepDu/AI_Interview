"use client";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { User, Briefcase, Code, FileText, Camera, CheckCircle, Upload, Loader2 } from "lucide-react";
import { ProfileCompletion } from "./ProfileCompletion";
import { SkillsInput } from "./SkillsInput";
import { ExperienceSection } from "./ExperienceSection";
import { ProjectsSection } from "./ProjectsSection";
import type { ProfileData } from "./types";

interface Props {
  profile: ProfileData;
  userEmail: string;
  uploading: boolean;
  onChange: (profile: ProfileData) => void;
  onResumeClick: () => void;
}

export function CandidateProfileForm({ profile, userEmail, uploading, onChange, onResumeClick }: Props) {
  const set = (partial: Partial<ProfileData>) => onChange({ ...profile, ...partial });

  return (
    <>
      <ProfileCompletion profile={profile} />

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
              placeholder="John Doe"
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

      {/* Resume */}
      <section className="bg-[#0d1b2e] border border-white/10 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center">
            <FileText className="h-4 w-4 text-green-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Resume</h2>
        </div>
        <Separator className="bg-white/5" />
        {profile.resumeUrl ? (
          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-green-300 font-medium">Resume uploaded</p>
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-400 hover:text-blue-400 truncate block"
              >
                {profile.resumeUrl}
              </a>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 text-white bg-white/5 hover:bg-white/10"
              onClick={onResumeClick}
            >
              Replace
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onResumeClick}
            disabled={uploading}
            className="w-full border-2 border-dashed border-white/10 hover:border-blue-500/50 rounded-xl p-8 flex flex-col items-center gap-3 transition-colors group"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
            ) : (
              <Upload className="h-8 w-8 text-slate-500 group-hover:text-blue-400 transition-colors" />
            )}
            <div className="text-center">
              <p className="text-sm font-medium text-white">
                {uploading ? "Uploading..." : "Click to upload resume"}
              </p>
              <p className="text-xs text-slate-500 mt-1">PDF or DOCX, max 5MB</p>
            </div>
          </button>
        )}
      </section>

      {/* Skills */}
      <section className="bg-[#0d1b2e] border border-white/10 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Code className="h-4 w-4 text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Skills</h2>
        </div>
        <Separator className="bg-white/5" />
        <SkillsInput skills={profile.skills} onChange={(skills) => set({ skills })} />
      </section>

      <ExperienceSection
        experience={profile.experience}
        onChange={(experience) => set({ experience })}
      />

      <ProjectsSection
        projects={profile.projects}
        onChange={(projects) => set({ projects })}
      />

      {/* Extracurriculars */}
      <section className="bg-[#0d1b2e] border border-white/10 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
            <Camera className="h-4 w-4 text-pink-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Extracurriculars & Achievements</h2>
        </div>
        <Separator className="bg-white/5" />
        <Textarea
          value={profile.extracurriculars}
          onChange={(e) => set({ extracurriculars: e.target.value })}
          placeholder="Hackathons, open source contributions, volunteer work, awards..."
          className="h-28"
        />
      </section>
    </>
  );
}
