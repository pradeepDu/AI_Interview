'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Video,
  Mic,
  MicOff,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Loader2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | 'loading'
  | 'intro'
  | 'camera-check'
  | 'prep'
  | 'recording'
  | 'saving'
  | 'evaluating'
  | 'complete'
  | 'error';

interface Question {
  id: string;
  text: string;
  type: 'technical' | 'behavioral' | 'scenario';
  prepTime: number;
  answerTime: number;
  transcript?: string;
  recordingUrl?: string;
  evaluation?: {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  };
}

interface InterviewSession {
  _id: string;
  status: string;
  questions: Question[];
  jobId: {
    title: string;
    department: string;
    experienceLevel: string;
    requiredSkills: string[];
  };
}

interface AISummary {
  overallScore: number;
  strengths: string[];
  concerns: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeColor(type: string) {
  if (type === 'technical') return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  if (type === 'behavioral') return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
  return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
}

function useCountdown(seconds: number, onDone: () => void) {
  const [remaining, setRemaining] = useState(seconds);
  const doneRef = useRef(false);
  // Keep the callback ref up-to-date without re-running the effect
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    doneRef.current = false;
    setRemaining(seconds);
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!doneRef.current) {
            doneRef.current = true;
            // Defer so we never call setState from inside a setState updater
            setTimeout(() => onDoneRef.current(), 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  return remaining;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InterviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [phase, setPhase] = useState<Phase>('loading');
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [tabViolations, setTabViolations] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(false);
  const lastViolationTs = useRef(0);

  // Media refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleAnswerDoneRef = useRef<(() => Promise<void>) | null>(null);

  // ── Re-attach stream to video element on phase changes ──────────────────
  // When phase changes, React replaces the <video> DOM element. The new element
  // won't have srcObject set, so the camera goes blank. This effect re-attaches.
  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.muted = true;
    }
  }, [phase]);

  // ── Fullscreen helpers ────────────────────────────────────────────────────
  const enterFullscreen = useCallback(() => {
    const el = containerRef.current ?? document.documentElement;
    if (!document.fullscreenElement) el.requestFullscreen().catch(() => {});
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, []);

  // ── Auto-submit effect — triggered when second violation is registered ─────
  useEffect(() => {
    if (!autoSubmit) return;
    setAutoSubmit(false);
    handleAnswerDoneRef.current?.();
  }, [autoSubmit]);

  // ── Tab-switch detection (warn once, auto-submit on second) ───────────────
  useEffect(() => {
    const activePhases: Phase[] = ['prep', 'recording', 'saving'];
    if (!activePhases.includes(phase)) return;

    const registerViolation = () => {
      // Debounce: visibilitychange + blur both fire on a single tab-switch
      const now = Date.now();
      if (now - lastViolationTs.current < 800) return;
      lastViolationTs.current = now;

      setTabViolations((prev) => {
        const next = prev + 1;
        if (next === 1) {
          setShowWarning(true);
        } else {
          setShowWarning(false);
          // Schedule submit outside the updater via a separate state flag
          setAutoSubmit(true);
        }
        return next;
      });
    };

    const onHidden = () => {
      if (document.visibilityState === 'hidden') registerViolation();
    };

    const onBlur = () => {
      // Fires on alt-tab when visibilitychange doesn't (e.g. native window switch)
      if (document.visibilityState === 'visible') registerViolation();
    };

    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('blur', onBlur);
    };
  }, [phase]);

  // ── Auth header helper ────────────────────────────────────────────────────
  const authHeader = useCallback(async () => {
    if (!user) return '';
    try {
      const token = await user.getIdToken();
      return `Bearer ${token}`;
    } catch {
      return '';
    }
  }, [user]);

  // ── Camera setup ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // avoid echo
      }
      return true;
    } catch {
      toast.error('Camera/microphone permission denied.');
      return false;
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // ── Speech recognition ───────────────────────────────────────────────────
  const startSpeech = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const rec = new SpeechRecognitionCtor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    let finalSoFar = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalSoFar += t + ' ';
        else interim = t;
      }
      setTranscript(finalSoFar + interim);
    };
    rec.start();
    recognitionRef.current = rec;
  }, []);

  const stopSpeech = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  // ── Recording ────────────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    // Use VP9 where supported; cap bitrates to keep file sizes manageable
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType,
      videoBitsPerSecond: 400_000,  // 400 kbps (vs default ~2.5 Mbps)
      audioBitsPerSecond: 48_000,   // 48 kbps
    });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.start(1000);
    recorderRef.current = recorder;
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        resolve(blob);
      };
      recorder.stop();
    });
  }, []);

  // ── Load interview session ────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const headers = { Authorization: await authHeader() };
        const res = await fetch(`/api/interview/${id}`, { headers });
        if (!res.ok) throw new Error('Failed to load interview');
        const { interview } = await res.json();

        if (interview.status === 'completed') {
          setSession(interview);
          setPhase('complete');
          // Try to fetch summary from linked application
          const appRes = await fetch(`/api/applications?interviewId=${id}`, {
            headers,
          });
          if (appRes.ok) {
            const data = await appRes.json();
            const app = data.applications?.[0];
            if (app?.aiSummary) setSummary(app.aiSummary);
          }
          return;
        }

        setSession(interview);
        setPhase('intro');
      } catch (err) {
        console.error(err);
        setErrorMsg('Could not load interview session.');
        setPhase('error');
      }
    })();
  }, [user, id, authHeader]);

  // ── Start interview (generate questions) ─────────────────────────────────
  const handleStart = async () => {
    setPhase('camera-check');
    await startCamera();
  };

  const handleCameraReady = async () => {
    enterFullscreen();
    try {
      const res = await fetch(`/api/interview/${id}/start`, {
        method: 'POST',
        headers: { Authorization: await authHeader() },
      });
      if (!res.ok) throw new Error('Failed to generate questions');
      const { interview } = await res.json();
      setSession(interview);
      setQIndex(0);
      setTranscript('');
      setTabViolations(0);
      setPhase('prep');
    } catch {
      exitFullscreen();
      toast.error('Failed to generate interview questions. Please try again.');
    }
  };

  // ── Move prep → recording ────────────────────────────────────────────────
  const handlePrepDone = useCallback(() => {
    setTranscript('');
    startRecording();
    startSpeech();
    setPhase('recording');
  }, [startRecording, startSpeech]);

  // ── Save answer, advance ─────────────────────────────────────────────────
  const handleAnswerDone = useCallback(async () => {
    if (!session) return;
    stopSpeech();
    setPhase('saving');

    const recordingBlob = await stopRecording();
    let recordingUrl: string | undefined;

    // Upload recording via server route (uses service-role key, bypasses RLS)
    if (recordingBlob && recordingBlob.size > 0) {
      try {
        const fileName = `${id}-q${qIndex + 1}-${Date.now()}.webm`;
        const fd = new FormData();
        fd.append('file', recordingBlob, fileName);
        fd.append('fileName', fileName);
        const uploadRes = await fetch('/api/interview-upload', {
          method: 'POST',
          headers: { Authorization: await authHeader() },
          body: fd,
        });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          recordingUrl = url;
        }
      } catch {
        // Recording upload is best-effort — interview continues without it
      }
    }

    // Save transcript & recording URL
    const q = session.questions[qIndex];
    await fetch(`/api/interview/${id}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: await authHeader(),
      },
      body: JSON.stringify({
        questionId: q.id,
        transcript,
        recordingUrl,
      }),
    });

    const nextIndex = qIndex + 1;

    if (nextIndex >= session.questions.length) {
      // All questions answered — evaluate
      setPhase('evaluating');
      try {
        const res = await fetch(`/api/interview/${id}/evaluate`, {
          method: 'POST',
          headers: { Authorization: await authHeader() },
        });
        if (!res.ok) throw new Error('Evaluation failed');
        const { summary: s, interview: updatedInterview } = await res.json();
        setSummary(s);
        setSession(updatedInterview);
        stopCamera();
        exitFullscreen();
        setPhase('complete');
      } catch {
        toast.error('Evaluation failed. Please contact support.');
        exitFullscreen();
        setPhase('error');
        setErrorMsg('Evaluation service is unavailable.');
      }
    } else {
      setQIndex(nextIndex);
      setTranscript('');
      setTabViolations(0);
      setShowWarning(false);
      setPhase('prep');
    }
  }, [session, qIndex, transcript, id, authHeader, stopRecording, stopSpeech, stopCamera, exitFullscreen]);

  // Keep ref in sync so the visibility listener always calls the latest version
  useEffect(() => {
    handleAnswerDoneRef.current = handleAnswerDone;
  }, [handleAnswerDone]);

  // ─── Tab-switch warning overlay ─────────────────────────────────────────
  const warningOverlay = showWarning ? (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-6">
      <div className="bg-neutral-900 border border-red-500/50 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-white text-xl font-bold">Tab Switch Detected!</h2>
        <p className="text-neutral-300 text-sm">
          You left the interview window.{' '}
          <span className="text-red-400 font-semibold">One more violation</span>{' '}
          will automatically submit your current answer.
        </p>
        <p className="text-neutral-500 text-xs">This incident has been recorded.</p>
        <Button
          onClick={() => {
            setShowWarning(false);
            enterFullscreen();
          }}
          className="w-full bg-red-600 hover:bg-red-700 text-white"
        >
          I Understand — Return to Interview
        </Button>
      </div>
    </div>
  ) : null;

  // ─── Phase: loading ───────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  // ─── Phase: error ─────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-4 text-center px-6">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-white text-xl font-semibold">Something went wrong</p>
        <p className="text-neutral-400">{errorMsg}</p>
        <Button onClick={() => router.push('/jobs')} variant="outline">
          Back to Jobs
        </Button>
      </div>
    );
  }

  // ─── Phase: intro ─────────────────────────────────────────────────────────
  if (phase === 'intro' && session) {
    const job = session.jobId;
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6">
        <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-8 space-y-6">
          <div className="space-y-1">
            <Badge className={`text-xs ${typeColor('technical')}`}>AI Interview</Badge>
            <h1 className="text-2xl font-bold text-white mt-2">{job?.title}</h1>
            <p className="text-neutral-400 text-sm capitalize">
              {job?.department} · {job?.experienceLevel} level
            </p>
          </div>

          <div className="bg-neutral-800/50 rounded-xl p-5 space-y-3">
            <p className="text-white font-medium">Before you begin:</p>
            <ul className="space-y-2 text-neutral-300 text-sm">
              {[
                'You will be asked 5 questions — technical, behavioral, and scenario-based.',
                'Each question has a brief 10-second preparation period followed by a recording window (30–60 s).',
                'The interview runs in fullscreen. Switching tabs or windows will be detected.',
                'First violation = warning. Second violation = your answer is auto-submitted immediately.',
                'Ensure you are in a quiet, well-lit environment with a working camera and microphone.'
              ].map((tip, i) => (
                <li key={i} className="flex gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-violet-400" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <Button
            onClick={handleStart}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            size="lg"
          >
            <Video className="w-4 h-4 mr-2" /> Start Interview
          </Button>
        </div>
      </div>
    );
  }

  // ─── Phase: camera-check ──────────────────────────────────────────────────
  if (phase === 'camera-check') {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6">
        <div className="w-full max-w-xl space-y-6">
          <div className="text-center">
            <p className="text-white text-xl font-semibold">Camera Check</p>
            <p className="text-neutral-400 text-sm mt-1">
              Make sure you can see yourself clearly before starting.
            </p>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-neutral-900 aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 rounded-full px-3 py-1 text-xs text-white">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Preview
            </div>
          </div>

          <Button
            onClick={handleCameraReady}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            size="lg"
          >
            <ChevronRight className="w-4 h-4 mr-2" /> Everything looks good — Begin
          </Button>
        </div>
      </div>
    );
  }

  // ─── Shared layout helper for question phases ─────────────────────────────
  const renderQuestionPhase = (
    q: Question,
    timerSeconds: number,
    timerLabel: string,
    children: React.ReactNode
  ) => {
    const progress = ((qIndex) / (session?.questions.length ?? 5)) * 100;

    return (
      <div ref={containerRef} className="min-h-screen bg-neutral-950 flex flex-col">
        {/* Top bar */}
        <div className="border-b border-neutral-800 px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-neutral-400">
            Question {qIndex + 1} of {session?.questions.length}
          </span>
          <Progress value={progress} className="w-40 h-1.5 bg-neutral-800" />
          <Badge className={`text-xs capitalize border ${typeColor(q.type)}`}>
            {q.type}
          </Badge>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-0">
          {/* Left: question + timer */}
          <div className="lg:w-1/2 flex flex-col justify-center p-4 lg:p-6 space-y-4">
            <div className="space-y-1">
              <p className="text-neutral-400 text-xs uppercase tracking-wide">
                {timerLabel}
              </p>
              <TimerRing seconds={timerSeconds} label={timerLabel} />
            </div>
            <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4">
              <p className="text-white text-base leading-relaxed">{q.text}</p>
            </div>
          </div>

          {/* Right: camera + controls */}
          <div className="lg:w-1/2 flex flex-col items-center justify-center p-4 lg:p-6 space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-neutral-900 w-full max-w-xs" style={{ aspectRatio: '4/3' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {phase === 'recording' && (
                <div className="absolute top-3 left-3 flex items-center gap-1 bg-red-600/80 rounded-full px-3 py-1 text-xs text-white">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  REC
                </div>
              )}
            </div>

            {children}
          </div>
        </div>
      </div>
    );
  };

  // ─── Phase: prep ─────────────────────────────────────────────────────────
  if (phase === 'prep' && session) {
    const q = session.questions[qIndex];
    return (<>{warningOverlay}{renderQuestionPhase(q, q.prepTime, 'Prepare your answer', (
      <PrepTimer prepTime={q.prepTime} onDone={handlePrepDone} />
    ))}</>);
  }

  // ─── Phase: recording ────────────────────────────────────────────────────
  if (phase === 'recording' && session) {
    const q = session.questions[qIndex];
    return (<>{warningOverlay}{renderQuestionPhase(q, q.answerTime, 'Recording', (
      <RecordingTimer
        answerTime={q.answerTime}
        transcript={transcript}
        isMuted={isMuted}
        onToggleMute={() => {
          const enabled = !isMuted;
          setIsMuted(enabled);
          streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !enabled));
        }}
        onDone={handleAnswerDone}
      />
    ))}</>);
  }

  // ─── Phase: saving ───────────────────────────────────────────────────────
  if (phase === 'saving') {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        <p className="text-neutral-300">Saving your answer…</p>
      </div>
    );
  }

  // ─── Phase: evaluating ───────────────────────────────────────────────────
  if (phase === 'evaluating') {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-6 px-6 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-violet-400" />
        <div>
          <p className="text-white text-xl font-semibold">Evaluating your answers</p>
          <p className="text-neutral-400 text-sm mt-1">
            Groq AI is reviewing your responses — this may take 20–30 seconds…
          </p>
        </div>
      </div>
    );
  }

  // ─── Phase: complete ─────────────────────────────────────────────────────
  if (phase === 'complete' && session) {
    const questions = session.questions;
    return (
      <div className="min-h-screen bg-neutral-950 px-6 py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
            <h1 className="text-3xl font-bold text-white">Interview Complete</h1>
            <p className="text-neutral-400">
              Your responses have been evaluated by Groq AI.
            </p>
          </div>

          {/* AI Summary */}
          {summary && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-white font-semibold text-lg">Overall Score</p>
                <span className="text-3xl font-bold text-violet-400">
                  {summary.overallScore}
                  <span className="text-neutral-500 text-base font-normal">/10</span>
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 space-y-2">
                  <p className="text-green-400 text-sm font-medium">Strengths</p>
                  <ul className="space-y-1">
                    {summary.strengths.map((s, i) => (
                      <li key={i} className="text-neutral-300 text-sm flex gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 text-green-400 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-2">
                  <p className="text-amber-400 text-sm font-medium">Areas to Improve</p>
                  <ul className="space-y-1">
                    {summary.concerns.map((c, i) => (
                      <li key={i} className="text-neutral-300 text-sm flex gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 text-amber-400 shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Per-question feedback */}
          <div className="space-y-4">
            <p className="text-white font-semibold">Question Breakdown</p>
            {questions.map((q, i) => (
              <div
                key={q.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <Badge className={`text-xs capitalize border ${typeColor(q.type)}`}>
                      {q.type}
                    </Badge>
                    <p className="text-white text-sm leading-relaxed mt-1">{q.text}</p>
                  </div>
                  {q.evaluation && (
                    <span className="text-lg font-bold text-violet-400 shrink-0">
                      {q.evaluation.score}/10
                    </span>
                  )}
                </div>

                {q.evaluation && (
                  <div className="border-t border-neutral-800 pt-3 space-y-2">
                    <p className="text-neutral-300 text-sm">{q.evaluation.feedback}</p>
                    {q.evaluation.strengths.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {q.evaluation.strengths.map((s, j) => (
                          <span
                            key={j}
                            className="text-xs bg-green-500/20 text-green-300 border border-green-500/30 rounded-full px-2.5 py-0.5"
                          >
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {q.transcript && (
                  <details className="text-xs text-neutral-500 cursor-pointer">
                    <summary className="select-none hover:text-neutral-400">
                      View transcript
                    </summary>
                    <p className="mt-2 text-neutral-400 leading-relaxed">{q.transcript}</p>
                  </details>
                )}

                {!q.evaluation && (
                  <p className="text-neutral-500 text-xs italic">Not answered</p>
                )}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => router.push('/jobs')}
              variant="outline"
              className="border-neutral-700 text-neutral-300"
            >
              Browse More Jobs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TimerRing({ seconds, label }: { seconds: number; label: string }) {
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  return (
    <div className="flex items-center gap-3">
      <Clock className="w-5 h-5 text-neutral-400" />
      <span className="text-white font-mono text-2xl tabular-nums">
        {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
      </span>
      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={radius} strokeWidth="6" stroke="#27272a" fill="none" />
        <circle
          cx="45"
          cy="45"
          r={radius}
          strokeWidth="6"
          stroke="#7c3aed"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={0}
        />
      </svg>
    </div>
  );
}

function PrepTimer({
  prepTime,
  onDone,
}: {
  prepTime: number;
  onDone: () => void;
}) {
  const remaining = useCountdown(prepTime, onDone);
  return (
    <div className="w-full space-y-3">
      <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 text-center">
        <p className="text-violet-300 text-2xl font-mono font-bold tabular-nums">
          {remaining}s
        </p>
        <p className="text-neutral-400 text-xs mt-1">Recording starts automatically</p>
      </div>
      <Button
        onClick={onDone}
        variant="outline"
        size="sm"
        className="w-full border-neutral-700 text-neutral-300"
      >
        Skip prep — record now
      </Button>
    </div>
  );
}

function RecordingTimer({
  answerTime,
  transcript,
  isMuted,
  onToggleMute,
  onDone,
}: {
  answerTime: number;
  transcript: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onDone: () => void;
}) {
  const remaining = useCountdown(answerTime, onDone);
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-neutral-500 text-xs">Time left</span>
        <span className="bg-red-500/15 border border-red-500/25 rounded-full px-2.5 py-0.5 text-red-300 text-sm font-mono font-bold tabular-nums">
          {remaining}s
        </span>
      </div>

      {transcript && (
        <div className="bg-neutral-800 rounded-lg p-2 max-h-16 overflow-y-auto">
          <p className="text-neutral-400 text-xs leading-relaxed">{transcript}</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={onToggleMute}
          variant="outline"
          size="sm"
          className="border-neutral-700 text-neutral-300 px-3"
        >
          {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </Button>
        <Button
          onClick={onDone}
          size="sm"
          className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
        >
          Done answering
        </Button>
      </div>
    </div>
  );
}
