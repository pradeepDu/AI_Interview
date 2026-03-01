"use client";
import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Users,
  FileText,
  Mail,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

interface Application {
  _id: string;
  status: "submitted" | "under_review" | "shortlisted" | "rejected";
  submittedAt: string;
  candidateId: {
    email: string;
    profile?: { name?: string; resumeUrl?: string };
  };
  aiSummary?: {
    overallScore: number;
    strengths: string[];
    concerns: string[];
  };
}

const statusConfig = {
  submitted: { label: "Submitted", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  under_review: { label: "Under Review", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  shortlisted: { label: "Shortlisted", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  rejected: { label: "Rejected", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

export default function ApplicationsPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchApplications();
  }, [user]);

  const fetchApplications = async () => {
    try {
      const token = await user!.getIdToken();
      const res = await fetch(`/api/admin/jobs/${id}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (appId: string, status: Application["status"]) => {
    try {
      setUpdating(appId);
      const token = await user!.getIdToken();
      const res = await fetch(`/api/admin/applications/${appId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      setApplications((prev) =>
        prev.map((a) => (a._id === appId ? { ...a, status } : a))
      );
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#060d18] pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Applications</h1>
            <p className="text-slate-400 text-sm mt-1">{applications.length} total applicants</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full bg-white/5 rounded-xl" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-20">
            <Users className="h-14 w-14 mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400">No applications yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const config = statusConfig[app.status];
              return (
                <div
                  key={app._id}
                  className="bg-[#0d1b2e] border border-white/10 rounded-xl p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                      <Users className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-white">
                          {app.candidateId?.profile?.name || app.candidateId?.email}
                        </p>
                        <Badge className={`text-xs border ${config.color}`}>
                          {config.label}
                        </Badge>
                        {app.aiSummary && (
                          <span className="text-xs text-purple-400 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            AI Score: {app.aiSummary.overallScore}/100
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {app.candidateId?.email}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Applied {new Date(app.submittedAt).toLocaleDateString()}
                      </p>
                      {app.aiSummary && (
                        <div className="mt-2 space-y-1">
                          {app.aiSummary.strengths.length > 0 && (
                            <p className="text-xs text-slate-400">
                              <span className="text-green-400">Strengths:</span>{" "}
                              {app.aiSummary.strengths.join(", ")}
                            </p>
                          )}
                          {app.aiSummary.concerns.length > 0 && (
                            <p className="text-xs text-slate-400">
                              <span className="text-red-400">Concerns:</span>{" "}
                              {app.aiSummary.concerns.join(", ")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {app.candidateId?.profile?.resumeUrl && (
                        <a
                          href={app.candidateId.profile.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                          title="View Resume"
                        >
                          <FileText className="h-4 w-4" />
                        </a>
                      )}
                      {updating === app._id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      ) : (
                        <>
                          {app.status !== "shortlisted" && (
                            <button
                              onClick={() => updateStatus(app._id, "shortlisted")}
                              className="p-1.5 rounded-lg hover:bg-green-500/20 text-slate-400 hover:text-green-400 transition-colors"
                              title="Shortlist"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          {app.status !== "rejected" && (
                            <button
                              onClick={() => updateStatus(app._id, "rejected")}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
