"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Video,
  Loader2,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

interface Job {
  _id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  department: string;
  experienceLevel: string;
  salaryRange: { min: number; max: number };
  deadline: string;
  status: string;
  createdAt: string;
  createdBy?: { profile?: { name?: string }; email?: string };
}

const experienceLevelColors: Record<string, string> = {
  entry: "bg-green-500/20 text-green-400 border-green-500/30",
  mid: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  senior: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    if (id) fetchJob();
  }, [id]);

  useEffect(() => {
    if (user) checkProfile();
  }, [user]);

  const fetchJob = async () => {
    try {
      const res = await fetch(`/api/jobs/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setJob(data);
    } catch {
      toast.error("Job not found");
      router.push("/jobs");
    } finally {
      setLoading(false);
    }
  };

  const checkProfile = async () => {
    try {
      const token = await user!.getIdToken();
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfileComplete(data.profileComplete === true);
      }
    } catch {}
  };

  const handleApply = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!profileComplete) {
      toast.error("Complete your profile before applying", {
        action: {
          label: "Go to Profile",
          onClick: () => router.push("/profile"),
        },
      });
      return;
    }
    try {
      setApplying(true);
      const token = await user.getIdToken();
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId: id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Application failed");
      }
      setApplied(true);
      toast.success("Application submitted! Your AI interview is ready.");
      const data = await res.json();
      if (data.interviewId) {
        router.push(`/interview/${data.interviewId}`);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  const daysLeft = job
    ? Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060d18] pt-24 px-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48 bg-white/5" />
          <Skeleton className="h-12 w-96 bg-white/5" />
          <Skeleton className="h-64 w-full bg-white/5" />
        </div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="min-h-screen bg-[#060d18] pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </button>

        <div className="bg-[#0d1b2e] border border-white/10 rounded-xl p-7 space-y-6">
          {/* Title & Meta */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full border font-medium ${experienceLevelColors[job.experienceLevel] || ""}`}
              >
                {job.experienceLevel.charAt(0).toUpperCase() + job.experienceLevel.slice(1)}
              </span>
              <span className="text-xs text-slate-500">{job.department}</span>
              {job.status !== "active" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                  Closed
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white">{job.title}</h1>
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              Posted by {job.createdBy?.profile?.name || job.createdBy?.email || "CareerFlow"}
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                icon: <DollarSign className="h-4 w-4 text-green-400" />,
                label: "Salary",
                value: `$${job.salaryRange.min.toLocaleString()} – $${job.salaryRange.max.toLocaleString()}`,
              },
              {
                icon: <Calendar className="h-4 w-4 text-blue-400" />,
                label: "Posted",
                value: new Date(job.createdAt).toLocaleDateString(),
              },
              {
                icon: <Clock className="h-4 w-4 text-orange-400" />,
                label: "Deadline",
                value: daysLeft > 0 ? `${daysLeft} days left` : "Expired",
              },
              {
                icon: <Briefcase className="h-4 w-4 text-purple-400" />,
                label: "Level",
                value: job.experienceLevel,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/5 rounded-lg p-3 flex flex-col gap-1"
              >
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  {stat.icon}
                  {stat.label}
                </div>
                <p className="text-sm font-medium text-white capitalize">{stat.value}</p>
              </div>
            ))}
          </div>

          <Separator className="bg-white/5" />

          {/* Description */}
          <div>
            <h2 className="text-base font-semibold text-white mb-3">Job Description</h2>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>

          <Separator className="bg-white/5" />

          {/* Required Skills */}
          <div>
            <h2 className="text-base font-semibold text-white mb-3">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {job.requiredSkills.map((skill) => (
                <Badge
                  key={skill}
                  className="bg-blue-500/20 text-blue-300 border border-blue-500/30"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="bg-white/5" />

          {/* AI Interview Notice */}
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 flex gap-3">
            <Video className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-purple-300">AI Interview Required</p>
              <p className="text-xs text-slate-400 mt-1">
                After applying, you'll complete an AI-powered video interview. Make sure your
                camera and microphone work before applying. The interview takes approximately
                20–30 minutes.
              </p>
            </div>
          </div>

          {/* Profile check */}
          {user && !profileComplete && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-300">Profile incomplete</p>
                <p className="text-xs text-slate-400 mt-1">
                  You need a complete profile with resume to apply.{" "}
                  <button
                    onClick={() => router.push("/profile")}
                    className="text-blue-400 hover:underline"
                  >
                    Complete your profile →
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Apply Button */}
          {job.status === "active" && daysLeft > 0 ? (
            applied ? (
              <div className="flex items-center gap-2 justify-center py-4 text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Application submitted!</span>
              </div>
            ) : (
              <Button
                onClick={handleApply}
                disabled={applying}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base gap-2 h-12"
              >
                {applying ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Video className="h-5 w-5" />
                    Apply & Start AI Interview
                  </>
                )}
              </Button>
            )
          ) : (
            <div className="text-center py-4 text-slate-500 text-sm">
              This position is no longer accepting applications.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
