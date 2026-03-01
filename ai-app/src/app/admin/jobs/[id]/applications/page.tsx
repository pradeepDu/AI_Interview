"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Users,
  FileText,
  Mail,
  CheckCircle,
  XCircle,
  TrendingUp,
  Loader2,
  BarChart2,
  X,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

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

interface QuestionResult {
  id: string;
  text: string;
  type: string;
  transcript: string | null;
  evaluation: {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  } | null;
}

interface AnalysisData {
  candidateName: string;
  aiSummary: {
    overallScore: number;
    strengths: string[];
    concerns: string[];
  } | null;
  questions: QuestionResult[] | null;
}

const statusConfig = {
  submitted: { label: "Submitted", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  under_review: { label: "Under Review", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  shortlisted: { label: "Shortlisted", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  rejected: { label: "Rejected", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

function typeColor(type: string) {
  if (type === "technical") return "bg-blue-500/20 text-blue-300 border-blue-500/30";
  if (type === "behavioral") return "bg-purple-500/20 text-purple-300 border-purple-500/30";
  return "bg-amber-500/20 text-amber-300 border-amber-500/30";
}

function AnalysisModal({
  appId,
  onClose,
  getToken,
}: {
  appId: string;
  onClose: () => void;
  getToken: () => Promise<string>;
}) {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/admin/applications/${appId}/analysis`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load analysis");
        }
        setData(await res.json());
      } catch (err: any) {
        setError(err.message || "Could not load analysis");
      } finally {
        setLoading(false);
      }
    })();
  }, [appId]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#0d1b2e] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-purple-400" />
            <p className="text-white font-semibold">AI Analysis</p>
            {data && <span className="text-slate-400 text-sm">— {data.candidateName}</span>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full bg-white/5 rounded-xl" />
              <Skeleton className="h-32 w-full bg-white/5 rounded-xl" />
              <Skeleton className="h-24 w-full bg-white/5 rounded-xl" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {data && !loading && (
            <>
              {/* Overall score */}
              {data.aiSummary ? (
                <div className="bg-[#111f35] border border-white/10 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-medium">Overall Score</p>
                    <span className="text-3xl font-bold text-purple-400">
                      {data.aiSummary.overallScore}
                      <span className="text-slate-500 text-base font-normal">/10</span>
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 space-y-2">
                      <p className="text-green-400 text-xs font-semibold uppercase tracking-wide">Strengths</p>
                      <ul className="space-y-1">
                        {data.aiSummary.strengths.map((s, i) => (
                          <li key={i} className="text-slate-300 text-sm flex gap-2">
                            <CheckCircle className="h-3.5 w-3.5 mt-0.5 text-green-400 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-2">
                      <p className="text-amber-400 text-xs font-semibold uppercase tracking-wide">Concerns</p>
                      <ul className="space-y-1">
                        {data.aiSummary.concerns.map((c, i) => (
                          <li key={i} className="text-slate-300 text-sm flex gap-2">
                            <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-amber-400 shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-sm italic">No AI summary available yet.</p>
              )}

              {/* Per-question breakdown */}
              {data.questions && data.questions.length > 0 && (
                <div className="space-y-3">
                  <p className="text-white font-medium text-sm">Question Breakdown</p>
                  {data.questions.map((q, i) => (
                    <div key={q.id} className="bg-[#111f35] border border-white/10 rounded-xl p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1 min-w-0">
                          <Badge className={`text-xs capitalize border ${typeColor(q.type)}`}>
                            {q.type}
                          </Badge>
                          <p className="text-slate-200 text-sm leading-relaxed mt-1">{q.text}</p>
                        </div>
                        {q.evaluation && (
                          <span className="text-base font-bold text-purple-400 shrink-0">
                            {q.evaluation.score}/10
                          </span>
                        )}
                      </div>

                      {q.evaluation && (
                        <div className="border-t border-white/5 pt-2 space-y-1.5">
                          <p className="text-slate-400 text-xs leading-relaxed">{q.evaluation.feedback}</p>
                          {q.evaluation.strengths.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {q.evaluation.strengths.map((s, j) => (
                                <span key={j} className="text-xs bg-green-500/15 text-green-300 border border-green-500/25 rounded-full px-2 py-0.5">
                                  ✓ {s}
                                </span>
                              ))}
                            </div>
                          )}
                          {q.evaluation.improvements.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {q.evaluation.improvements.map((imp, j) => (
                                <span key={j} className="text-xs bg-amber-500/15 text-amber-300 border border-amber-500/25 rounded-full px-2 py-0.5">
                                  ↑ {imp}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {q.transcript && (
                        <details className="text-xs text-slate-500 cursor-pointer">
                          <summary className="select-none hover:text-slate-400">View transcript</summary>
                          <p className="mt-1.5 text-slate-400 leading-relaxed">{q.transcript}</p>
                        </details>
                      )}

                      {!q.evaluation && (
                        <p className="text-slate-600 text-xs italic">Not answered</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [loadingResume, setLoadingResume] = useState<string | null>(null);
  const [analysisAppId, setAnalysisAppId] = useState<string | null>(null);

  const getToken = async () => {
    const token = await user!.getIdToken();
    return `Bearer ${token}`;
  };

  const viewResume = async (appId: string, resumeUrl: string) => {
    try {
      setLoadingResume(appId);
      const token = await user!.getIdToken();
      const proxyUrl = `/api/admin/resume?url=${encodeURIComponent(resumeUrl)}`;
      const res = await fetch(proxyUrl, {
        headers: { Authorization: `Bearer ${token}` },
        redirect: "follow",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load resume");
      }
      window.open(res.url, "_blank", "noreferrer");
    } catch (err: any) {
      toast.error(err.message || "Could not open resume");
    } finally {
      setLoadingResume(null);
    }
  };

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
      {analysisAppId && (
        <AnalysisModal
          appId={analysisAppId}
          onClose={() => setAnalysisAppId(null)}
          getToken={async () => {
            const token = await user!.getIdToken();
            return `Bearer ${token}`;
          }}
        />
      )}

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
              <Skeleton key={i} className="h-24 w-full bg-white/5 rounded-xl" />
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
                  <div className="flex items-center gap-4">
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
                            {app.aiSummary.overallScore}/10
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
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Resume */}
                      {app.candidateId?.profile?.resumeUrl && (
                        <button
                          onClick={() => viewResume(app._id, app.candidateId.profile!.resumeUrl!)}
                          disabled={loadingResume === app._id}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
                          title="View Resume"
                        >
                          {loadingResume === app._id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <FileText className="h-4 w-4" />}
                        </button>
                      )}

                      {/* AI Analysis */}
                      {app.aiSummary && (
                        <button
                          onClick={() => setAnalysisAppId(app._id)}
                          className="p-1.5 rounded-lg hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 transition-colors"
                          title="View AI Analysis"
                        >
                          <BarChart2 className="h-4 w-4" />
                        </button>
                      )}

                      {/* Status actions */}
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
