"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Briefcase,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MoreHorizontal,
  TrendingUp,
  CalendarDays,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Job {
  _id: string;
  title: string;
  department: string;
  experienceLevel: string;
  status: "active" | "closed";
  deadline: string;
  createdAt: string;
  applicationCount?: number;
}

interface Stats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  shortlisted: number;
}

export default function HRDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { role, loading: roleLoading } = useRole();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    shortlisted: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const token = await user!.getIdToken();
      const res = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setStats(data.stats || {});
      } else {
        // Fallback: fetch just jobs for now
        const jobsRes = await fetch(`/api/jobs?status=all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setJobs(Array.isArray(jobsData) ? jobsData : []);
          setStats({
            totalJobs: jobsData.length,
            activeJobs: jobsData.filter((j: Job) => j.status === "active").length,
            totalApplications: 0,
            shortlisted: 0,
          });
        }
      }
    } catch {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const toggleJobStatus = async (jobId: string, currentStatus: string) => {
    try {
      const token = await user!.getIdToken();
      const newStatus = currentStatus === "active" ? "closed" : "active";
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      setJobs((prev) =>
        prev.map((j) => (j._id === jobId ? { ...j, status: newStatus as "active" | "closed" } : j))
      );
      toast.success(`Job ${newStatus === "active" ? "reopened" : "closed"}`);
    } catch {
      toast.error("Failed to update job");
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-[#060d18] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (role !== "hr") {
    return (
      <div className="min-h-screen bg-[#060d18] pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 font-medium">Access denied — HR only</p>
          <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push("/")}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060d18] pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">HR Dashboard</h1>
            <p className="text-slate-400 mt-1">Manage jobs and review applications</p>
          </div>
          <Link href="/admin/jobs/create">
            <Button className="relative bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white gap-2 px-5 shadow-lg shadow-blue-900/40 hover:shadow-blue-700/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 ring-1 ring-blue-500/30 hover:ring-blue-400/60">
              <Plus className="h-4 w-4" />
              Post New Job
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading
            ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 bg-white/5 rounded-xl" />)
            : [
                {
                  label: "Total Jobs",
                  value: stats.totalJobs,
                  icon: <Briefcase className="h-5 w-5 text-blue-400" />,
                  color: "blue",
                },
                {
                  label: "Active Jobs",
                  value: stats.activeJobs,
                  icon: <CheckCircle className="h-5 w-5 text-green-400" />,
                  color: "green",
                },
                {
                  label: "Applications",
                  value: stats.totalApplications,
                  icon: <Users className="h-5 w-5 text-purple-400" />,
                  color: "purple",
                },
                {
                  label: "Shortlisted",
                  value: stats.shortlisted,
                  icon: <TrendingUp className="h-5 w-5 text-orange-400" />,
                  color: "orange",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-[#0d1b2e] border border-white/10 rounded-xl p-5"
                >
                  <div className="flex items-center gap-2 mb-2">{stat.icon}</div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-slate-400 mt-0.5">{stat.label}</p>
                </div>
              ))}
        </div>

        {/* Jobs Table */}
        <div className="bg-[#0d1b2e] border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <h2 className="text-base font-semibold text-white">My Job Listings</h2>
            <span className="text-sm text-slate-500">{jobs.length} total</span>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full bg-white/5 rounded-lg" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="h-12 w-12 mx-auto text-slate-600 mb-3" />
              <p className="text-slate-400">No jobs posted yet</p>
              <Link href="/admin/jobs/create">
                <Button className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white gap-2 shadow-lg shadow-blue-900/40 hover:shadow-blue-700/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 ring-1 ring-blue-500/30 hover:ring-blue-400/60">
                  <Plus className="h-4 w-4" />
                  Post Your First Job
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {jobs.map((job) => {
                const daysLeft = Math.ceil(
                  (new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={job._id}
                    className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-white truncate">{job.title}</p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${
                            job.status === "active"
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{job.department}</span>
                        <span>•</span>
                        <span className="capitalize">{job.experienceLevel}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <CalendarDays className="h-3 w-3" />
                          {daysLeft > 0 ? `${daysLeft}d left` : "Expired"}
                        </span>
                        {job.applicationCount !== undefined && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Users className="h-3 w-3" />
                              {job.applicationCount} applicants
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => router.push(`/admin/jobs/${job._id}/applications`)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title="View Applications"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleJobStatus(job._id, job.status)}
                        className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
                          job.status === "active"
                            ? "text-green-400 hover:text-red-400"
                            : "text-slate-500 hover:text-green-400"
                        }`}
                        title={job.status === "active" ? "Close Job" : "Reopen Job"}
                      >
                        {job.status === "active" ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
