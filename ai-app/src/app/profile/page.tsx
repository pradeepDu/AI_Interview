"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Briefcase,
  Code,
  FileText,
  Plus,
  X,
  Upload,
  CheckCircle,
  Camera,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";

interface Experience {
  company: string;
  position: string;
  duration: string;
  description: string;
  current?: boolean;
}

interface Project {
  title: string;
  description: string;
  techStack: string[];
  link?: string;
}

interface ProfileData {
  name: string;
  phone: string;
  skills: string[];
  experience: Experience[];
  projects: Project[];
  extracurriculars: string;
  resumeUrl?: string;
  profilePictureUrl?: string;
}

const emptyExperience: Experience = {
  company: "",
  position: "",
  duration: "",
  description: "",
  current: false,
};

const emptyProject: Project = {
  title: "",
  description: "",
  techStack: [],
  link: "",
};

function ProfileCompletion({ profile }: { profile: ProfileData }) {
  const checks = [
    { label: "Name", done: !!profile.name },
    { label: "Phone", done: !!profile.phone },
    { label: "Resume", done: !!profile.resumeUrl },
    { label: "Skills", done: profile.skills.length > 0 },
    { label: "Experience", done: profile.experience.length > 0 },
    { label: "Projects", done: profile.projects.length > 0 },
  ];
  const completed = checks.filter((c) => c.done).length;
  const pct = Math.round((completed / checks.length) * 100);

  return (
    <Card className="p-5 bg-[#0d1b2e] border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-white">Profile Completion</span>
        <span className="text-sm font-bold text-blue-400">{pct}%</span>
      </div>
      <Progress value={pct} className="h-2 bg-white/10" />
      <div className="flex flex-wrap gap-2 mt-3">
        {checks.map((c) => (
          <span
            key={c.label}
            className={`text-xs px-2 py-0.5 rounded-full ${
              c.done
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-white/5 text-slate-400 border border-white/10"
            }`}
          >
            {c.done ? "✓" : "○"} {c.label}
          </span>
        ))}
      </div>
    </Card>
  );
}

function SkillsInput({
  skills,
  onChange,
}: {
  skills: string[];
  onChange: (skills: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !skills.includes(trimmed)) {
      onChange([...skills, trimmed]);
      setInput("");
    }
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Type a skill and press Enter"
          className="bg-white/5 border-white/10 text-white placeholder:text-slate-400"
        />
        <Button type="button" variant="outline" className="border-white/10 text-white bg-white/5 hover:bg-white/10" onClick={add}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <Badge
            key={skill}
            className="bg-blue-500/20 text-blue-300 border border-blue-500/30 pl-2 pr-1 gap-1"
          >
            {skill}
            <button
              type="button"
              onClick={() => onChange(skills.filter((s) => s !== skill))}
              className="ml-1 hover:text-red-400"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);

  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    phone: "",
    skills: [],
    experience: [],
    projects: [],
    extracurriculars: "",
    resumeUrl: "",
    profilePictureUrl: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const token = await user!.getIdToken();
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // No MongoDB document yet — send them through onboarding
      if (res.status === 404) {
        router.replace("/signup");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        // profileComplete is false when user hasn't filled in their profile yet
        if (!data.profileComplete) setIsCreateMode(true);
        if (data.profile) {
          setProfile({
            name: data.profile.name || "",
            phone: data.profile.phone || "",
            skills: data.profile.skills || [],
            experience: data.profile.experience || [],
            projects: data.profile.projects || [],
            extracurriculars: data.profile.extracurriculars || "",
            resumeUrl: data.profile.resumeUrl || "",
            profilePictureUrl: data.profile.profilePictureUrl || "",
          });
        }
      }
    } catch {
      // network error – leave page as-is
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      setSaving(true);
      const token = await user!.getIdToken();
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profile }),
      });
      if (res.status === 404) {
        toast.error("Account not found. Please complete sign-up first.");
        router.replace("/signup");
        return;
      }
      if (!res.ok) throw new Error("Failed to save");
      if (isCreateMode) {
        toast.success("Profile created! Let's find you a job 🎉");
        setIsCreateMode(false);
        router.push("/jobs");
      } else {
        toast.success("Profile saved successfully!");
      }
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Resume must be under 5MB");
      return;
    }
    try {
      setUploading(true);
      const token = await user!.getIdToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "resumes");
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setProfile((p) => ({ ...p, resumeUrl: url }));
      toast.success("Resume uploaded!");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const addExperience = () =>
    setProfile((p) => ({ ...p, experience: [...p.experience, { ...emptyExperience }] }));

  const updateExperience = (i: number, field: keyof Experience, value: string | boolean) =>
    setProfile((p) => {
      const updated = [...p.experience];
      updated[i] = { ...updated[i], [field]: value };
      return { ...p, experience: updated };
    });

  const removeExperience = (i: number) =>
    setProfile((p) => ({ ...p, experience: p.experience.filter((_, idx) => idx !== i) }));

  const addProject = () =>
    setProfile((p) => ({ ...p, projects: [...p.projects, { ...emptyProject }] }));

  const updateProject = (i: number, field: keyof Project, value: string | string[]) =>
    setProfile((p) => {
      const updated = [...p.projects];
      updated[i] = { ...updated[i], [field]: value };
      return { ...p, projects: updated };
    });

  const removeProject = (i: number) =>
    setProfile((p) => ({ ...p, projects: p.projects.filter((_, idx) => idx !== i) }));

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#060d18] pt-24 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-10 w-64 bg-white/5" />
          <Skeleton className="h-32 w-full bg-white/5" />
          <Skeleton className="h-64 w-full bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060d18] pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Create-mode banner */}
        {isCreateMode && (
          <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/30 p-5 flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-base">Welcome! Let's build your profile</p>
              <p className="text-indigo-200/70 text-sm mt-0.5">
                Fill in your details below. At minimum, add your <strong className="text-indigo-300">name</strong>,{" "}
                <strong className="text-indigo-300">skills</strong>, and{" "}
                <strong className="text-indigo-300">experience</strong> to unlock job applications.
                Upload your resume for best results.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {isCreateMode ? "Create Your Profile" : "My Profile"}
            </h1>
            <p className="text-slate-400 mt-1">
              {isCreateMode
                ? "Complete your profile to start applying for jobs"
                : "Update your information and resume"}
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : isCreateMode ? "Save & Continue →" : "Save Profile"}
          </Button>
        </div>

        {/* Completion Card */}
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
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                placeholder="John Doe"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-slate-400">Phone Number</label>
              <Input
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+1 234 567 8900"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-slate-400">Email</label>
              <Input
                value={user?.email || ""}
                disabled
                className="bg-white/5 border-white/10 text-slate-500"
              />
            </div>
          </div>
        </section>

        {/* Resume Upload */}
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
                onClick={() => fileInputRef.current?.click()}
              >
                Replace
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc"
            className="hidden"
            onChange={handleResumeUpload}
          />
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
          <SkillsInput
            skills={profile.skills}
            onChange={(s) => setProfile((p) => ({ ...p, skills: s }))}
          />
        </section>

        {/* Experience */}
        <section className="bg-[#0d1b2e] border border-white/10 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-orange-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Experience</h2>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/10 text-white bg-white/5 hover:bg-white/10 gap-1"
              onClick={addExperience}
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          <Separator className="bg-white/5" />
          {profile.experience.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No experience added yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {profile.experience.map((exp, i) => (
                <div key={i} className="relative bg-white/5 rounded-lg p-4 border border-white/5 space-y-3">
                  <button
                    type="button"
                    onClick={() => removeExperience(i)}
                    className="absolute top-3 right-3 text-slate-500 hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">Company *</label>
                      <Input
                        value={exp.company}
                        onChange={(e) => updateExperience(i, "company", e.target.value)}
                        placeholder="Acme Corp"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">Position *</label>
                      <Input
                        value={exp.position}
                        onChange={(e) => updateExperience(i, "position", e.target.value)}
                        placeholder="Software Engineer"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">Duration *</label>
                      <Input
                        value={exp.duration}
                        onChange={(e) => updateExperience(i, "duration", e.target.value)}
                        placeholder="Jan 2022 – Present"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-9 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Description *</label>
                    <Textarea
                      value={exp.description}
                      onChange={(e) => updateExperience(i, "description", e.target.value)}
                      placeholder="Describe your role and achievements..."
                      className="text-sm h-20"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Projects */}
        <section className="bg-[#0d1b2e] border border-white/10 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Code className="h-4 w-4 text-cyan-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Projects</h2>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/10 text-white bg-white/5 hover:bg-white/10 gap-1"
              onClick={addProject}
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          <Separator className="bg-white/5" />
          {profile.projects.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Code className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No projects added yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {profile.projects.map((proj, i) => (
                <div key={i} className="relative bg-white/5 rounded-lg p-4 border border-white/5 space-y-3">
                  <button
                    type="button"
                    onClick={() => removeProject(i)}
                    className="absolute top-3 right-3 text-slate-500 hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">Title *</label>
                      <Input
                        value={proj.title}
                        onChange={(e) => updateProject(i, "title", e.target.value)}
                        placeholder="My Awesome Project"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">GitHub / Live Link</label>
                      <Input
                        value={proj.link || ""}
                        onChange={(e) => updateProject(i, "link", e.target.value)}
                        placeholder="https://github.com/..."
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-9 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Description *</label>
                    <Textarea
                      value={proj.description}
                      onChange={(e) => updateProject(i, "description", e.target.value)}
                      placeholder="What this project does..."
                      className="text-sm h-20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Tech Stack (comma separated)</label>
                    <Input
                      value={proj.techStack.join(", ")}
                      onChange={(e) =>
                        updateProject(
                          i,
                          "techStack",
                          e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                        )
                      }
                      placeholder="React, TypeScript, Node.js"
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-9 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

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
            onChange={(e) => setProfile((p) => ({ ...p, extracurriculars: e.target.value }))}
            placeholder="Hackathons, open source contributions, volunteer work, awards..."
            className="h-28"
          />
        </section>

        {/* Save Button (bottom) */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-8"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : isCreateMode ? "Save & Continue →" : "Save Profile"}
          </Button>
        </div>
      </div>
    </div>
  );
}
