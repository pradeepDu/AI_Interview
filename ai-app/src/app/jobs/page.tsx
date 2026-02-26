"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import {
  Search,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";

interface Job {
  _id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  department: string;
  experienceLevel: "entry" | "mid" | "senior";
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

function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  const daysLeft = Math.ceil(
    (new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-[#0d1b2e] border border-white/10 hover:border-blue-500/40 rounded-xl p-5 transition-all hover:bg-[#0f2035] group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs px-2 py-0.5 rounded-full border font-medium ${experienceLevelColors[job.experienceLevel]}`}
            >
              {job.experienceLevel.charAt(0).toUpperCase() + job.experienceLevel.slice(1)}
            </span>
            <span className="text-xs text-slate-500">{job.department}</span>
          </div>
          <h3 className="text-base font-semibold text-white group-hover:text-blue-300 transition-colors">
            {job.title}
          </h3>
          <p className="text-sm text-slate-400 mt-1 line-clamp-2">{job.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {job.requiredSkills.slice(0, 5).map((skill) => (
              <Badge
                key={skill}
                className="bg-white/5 text-slate-300 border border-white/10 text-xs py-0"
              >
                {skill}
              </Badge>
            ))}
            {job.requiredSkills.length > 5 && (
              <Badge className="bg-white/5 text-slate-500 border border-white/10 text-xs py-0">
                +{job.requiredSkills.length - 5} more
              </Badge>
            )}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-blue-400 transition-colors shrink-0 mt-1" />
      </div>
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          ${job.salaryRange.min.toLocaleString()} – ${job.salaryRange.max.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {daysLeft > 0 ? `${daysLeft}d left` : "Expired"}
        </span>
        <span className="flex items-center gap-1">
          <Briefcase className="h-3 w-3" />
          {job.createdBy?.profile?.name || job.createdBy?.email || "CareerFlow"}
        </span>
      </div>
    </button>
  );
}

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: "active" });
      if (search) params.set("search", search);
      if (department) params.set("department", department);
      if (level) params.set("experienceLevel", level);
      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [search, department, level]);

  useEffect(() => {
    const timer = setTimeout(fetchJobs, 300);
    return () => clearTimeout(timer);
  }, [fetchJobs]);

  const departments = [...new Set(jobs.map((j) => j.department))].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#060d18] pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Browse Jobs</h1>
          <p className="text-slate-400 mt-1">Discover opportunities and apply with an AI interview</p>
        </div>

        {/* Search & Filters */}
        <div className="bg-[#0d1b2e] border border-white/10 rounded-xl p-4 mb-6 space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jobs by title or skill..."
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
            <Button
              variant="outline"
              className="border-white/10 text-slate-400 bg-white/5 hover:bg-white/10 gap-2"
              onClick={() => {
                setSearch("");
                setDepartment("");
                setLevel("");
              }}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Reset
            </Button>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="flex gap-2">
              {["", "entry", "mid", "senior"].map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    level === l
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-white/10 text-slate-400 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {l === "" ? "All Levels" : l.charAt(0).toUpperCase() + l.slice(1)}
                </button>
              ))}
            </div>
            {departments.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {["", ...departments].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDepartment(d)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      department === d
                        ? "bg-purple-600 border-purple-600 text-white"
                        : "border-white/10 text-slate-400 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    {d || "All Departments"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full bg-white/5 rounded-xl" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="h-14 w-14 mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400 text-lg">No jobs found</p>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">{jobs.length} job{jobs.length !== 1 ? "s" : ""} found</p>
            {jobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                onClick={() => router.push(`/jobs/${job._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
