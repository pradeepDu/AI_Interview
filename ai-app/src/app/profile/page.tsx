"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Save, User } from "lucide-react";
import { toast } from "sonner";

import type { ProfileData } from "./_components/types";
import { HRProfileForm } from "./_components/HRProfileForm";
import { CandidateProfileForm } from "./_components/CandidateProfileForm";

const defaultProfile: ProfileData = {
  name: "",
  phone: "",
  skills: [],
  experience: [],
  projects: [],
  extracurriculars: "",
  resumeUrl: "",
  profilePictureUrl: "",
  company: "",
  designation: "",
  department: "",
};

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [role, setRole] = useState<"job_seeker" | "hr" | null>(null);
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProfile = async () => {
    try {
      const token = await user!.getIdToken();
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 404) {
        router.replace("/signup");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setRole(data.role ?? null);
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
            company: data.profile.company || "",
            designation: data.profile.designation || "",
            department: data.profile.department || "",
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
        setIsCreateMode(false);
        if (role === "hr") {
          toast.success("Profile created! Welcome to CareerFlow ");
          router.push("/admin/dashboard");
        } else {
          toast.success("Profile created! Let's find you a job ");
          router.push("/jobs");
        }
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
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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

  const isHR = role === "hr";
  const saveLabel = saving
    ? "Saving..."
    : isCreateMode
    ? isHR ? "Save & Go to Dashboard " : "Save & Continue "
    : "Save Profile";

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
              <p className="text-white font-semibold text-base">
                {isHR ? "Welcome! Set up your HR profile" : "Welcome! Let's build your profile"}
              </p>
              <p className="text-indigo-200/70 text-sm mt-0.5">
                {isHR
                  ? "Add your name, designation, and company details to get started."
                  : "Fill in your details. Add your name, skills, and experience to unlock job applications."}
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {isCreateMode
                ? isHR ? "Create HR Profile" : "Create Your Profile"
                : isHR ? "HR Profile" : "My Profile"}
            </h1>
            <p className="text-slate-400 mt-1">
              {isHR ? "Manage your recruiter details" : "Update your information and resume"}
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saveLabel}
          </Button>
        </div>

        {/* Role-specific form */}
        {isHR ? (
          <HRProfileForm
            profile={profile}
            userEmail={user?.email || ""}
            onChange={setProfile}
          />
        ) : (
          <CandidateProfileForm
            profile={profile}
            userEmail={user?.email || ""}
            uploading={uploading}
            onChange={setProfile}
            onResumeClick={() => fileInputRef.current?.click()}
          />
        )}

        {/* Hidden file input — onChange wired here so it has access to state */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc"
          className="hidden"
          onChange={handleResumeUpload}
        />

        {/* Bottom save */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-8">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
