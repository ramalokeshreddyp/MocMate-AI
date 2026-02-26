import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { Clock, ChevronRight, Send, Video, VideoOff, Mic, MicOff, PauseCircle, PlayCircle, AudioLines, AlertTriangle, X, Code2 } from "lucide-react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { InterviewAnswerInput } from "@/lib/types";
import { faceDetectionService } from "@/lib/faceDetection";

type RecognitionEventLike = Event & {
  results: {
    length: number;
    [index: number]: {
      length: number;
      isFinal: boolean;
      [index: number]: { transcript: string };
    };
  };
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const InterviewSession = () => {
  const { type } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const interviewId = searchParams.get("interviewId") || "";
  const isCoding = type === "coding";

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const [topic, setTopic] = useState("general");
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [questionTime, setQuestionTime] = useState(60);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [codeAnswer, setCodeAnswer] = useState("");
  const [complexityNote, setComplexityNote] = useState("");
  const [codingLanguage, setCodingLanguage] = useState<"javascript" | "python" | "java" | "cpp">("javascript");

  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceDetectionReady, setFaceDetectionReady] = useState(false);

  const [tabSwitches, setTabSwitches] = useState(0);
  const [longSilenceEvents, setLongSilenceEvents] = useState(0);
  const [backgroundNoiseEvents, setBackgroundNoiseEvents] = useState(0);
  const [multipleFaceEvents, setMultipleFaceEvents] = useState(0);

  const [questionStartAt, setQuestionStartAt] = useState<number>(Date.now());
  const [lastSpeechAt, setLastSpeechAt] = useState<number>(Date.now());
  const [showMultiPersonAlert, setShowMultiPersonAlert] = useState(false);
  const [multiPersonWarnings, setMultiPersonWarnings] = useState(0);
  const [terminated, setTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState("");
  const [unansweredCount, setUnansweredCount] = useState(0);
  const [lastFaceWarningAt, setLastFaceWarningAt] = useState(0);

  useEffect(() => {
    if (!token || !interviewId) {
      navigate(`/interview/${type}`);
      return;
    }

    const loadSession = async () => {
      setLoading(true);
      try {
        const session = await api.getInterviewSession(token, interviewId);
        if (session.questions.length < 10) {
          toast.error("Interview does not meet minimum 10-question rule.");
          navigate(`/interview/${type}`);
          return;
        }

        setQuestions(session.questions);
        setTopic(session.topic);
        setCurrentQ(Math.min(session.answerCount, Math.max(session.questions.length - 1, 0)));
        if (session.language && ["javascript", "python", "java", "cpp"].includes(session.language)) {
          setCodingLanguage(session.language as "javascript" | "python" | "java" | "cpp");
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load session");
        navigate(`/interview/${type}`);
      } finally {
        setLoading(false);
      }
    };

    void loadSession();
  }, [interviewId, navigate, token, type]);

  useEffect(() => {
    const setupMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: !isCoding });
        mediaStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        setCameraReady(Boolean(videoTrack?.enabled));
        setMicReady(isCoding ? true : Boolean(audioTrack?.enabled));

        // Initialize face detection (mandatory)
        await faceDetectionService.initialize();
        const supported = faceDetectionService.getIsSupported();
        setFaceDetectionReady(supported);
        if (!supported) {
          toast.error("Face validation could not start. Check browser support or network and reload.");
        }

        if (!isCoding && audioTrack) {
          const audioContext = new AudioContext();
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 512;
          source.connect(analyser);
          audioContextRef.current = audioContext;
          analyserRef.current = analyser;
        }
      } catch {
        toast.error(isCoding ? "Camera access is mandatory." : "Camera and microphone access is mandatory.");
      }
    };

    void setupMedia();

    return () => {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      recognitionRef.current?.stop();
      audioContextRef.current?.close().catch(() => undefined);
    };
  }, [isCoding]);

  useEffect(() => {
    if (!cameraReady || !videoRef.current || terminated) {
      return;
    }

    const detectionLoop = window.setInterval(async () => {
      if (!videoRef.current) return;

      try {
        const result = await faceDetectionService.detectFaces(videoRef.current);
        const isFaceVisible = result.faceCount >= 1;
        setFaceDetected(isFaceVisible);

        const now = Date.now();
        if (result.multipleFacesDetected && now - lastFaceWarningAt > 4000) {
          setLastFaceWarningAt(now);
          setMultipleFaceEvents((value) => value + 1);

          setMultiPersonWarnings((warnings) => {
            const nextWarnings = warnings + 1;
            if (nextWarnings === 1) {
              setShowMultiPersonAlert(true);
              toast.warning("Multiple persons detected. Please ensure you are alone during the interview.");
            }
            if (nextWarnings >= 2) {
              void terminateInterview("Interview terminated – Multiple persons detected.");
            }
            return nextWarnings;
          });
        }
      } catch {
        setFaceDetected(false);
      }
    }, 1500);

    return () => window.clearInterval(detectionLoop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraReady, lastFaceWarningAt, terminated]);

  const recognitionSupported = useMemo(() => {
    const withSpeech = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

    return Boolean(withSpeech.SpeechRecognition || withSpeech.webkitSpeechRecognition);
  }, []);

  // For coding interviews: require camera only
  // For speech interviews: require camera + mic
  // Face validation is mandatory in all rounds
  const mandatoryPaused = isCoding 
    ? !cameraReady || !faceDetectionReady || !faceDetected
    : !cameraReady || !micReady || !faceDetectionReady || !faceDetected;

  const terminateInterview = async (reason: string) => {
    if (!token || !interviewId) return;

    try {
      await api.terminateInterview(token, interviewId, {
        reason,
        proctoringSignals: {
          tabSwitches,
          longSilenceEvents,
          micOnRatio: micReady ? 1 : 0,
          faceDetectedRatio: faceDetected ? 1 : 0,
          backgroundNoiseEvents,
          multipleFaceEvents: multipleFaceEvents + 1,
          terminationReason: reason,
        },
      });
    } catch {
      void 0;
    } finally {
      setTerminationReason(reason);
      setTerminated(true);
      setIsRecording(false);
      recognitionRef.current?.stop();
      toast.error(reason);
    }
  };

  useEffect(() => {
    if (loading || terminated) return;

    const timer = window.setInterval(() => {
      setTimeElapsed((previous) => previous + 1);
      setQuestionTime((previous) => {
        if (previous <= 1) {
          if (!submitting) {
            const emptyAnswer = isCoding ? !codeAnswer.trim() : !transcript.trim();
            if (emptyAnswer) {
              toast.warning("Question timed out. Marked as unanswered.");
            }
            void submitCurrentAnswer();
          }
          return 60;
        }
        return previous - 1;
      });

      if (!isCoding) {
        const silenceDurationSec = (Date.now() - lastSpeechAt) / 1000;
        if (isRecording && silenceDurationSec > 12) {
          setLongSilenceEvents((previous) => previous + 1);
          setLastSpeechAt(Date.now());
        }

        if (isRecording && silenceDurationSec > 60 && !transcript.trim()) {
          toast.warning("No speech detected for 60 seconds. Recording stopped.");
          stopRecording();
        }

        if (isRecording && analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          if (avg > 155) {
            setBackgroundNoiseEvents((previous) => previous + 1);
          }
        }
      }
    }, 1000);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, terminated, currentQ, questions.length, transcript, codeAnswer, isCoding, isRecording, lastSpeechAt, submitting]);

  useEffect(() => {
    const visibilityHandler = () => {
      if (document.visibilityState === "hidden") {
        setTabSwitches((previous) => previous + 1);
      }
    };

    document.addEventListener("visibilitychange", visibilityHandler);
    return () => document.removeEventListener("visibilitychange", visibilityHandler);
  }, []);

  const startRecording = () => {
    if (isCoding) {
      return;
    }
    if (!recognitionSupported) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    if (mandatoryPaused) {
      toast.error("Enable camera and microphone to start recording.");
      return;
    }

    const withSpeech = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

    const SpeechRecognitionCtor = withSpeech.SpeechRecognition || withSpeech.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: RecognitionEventLike) => {
      let finalText = "";
      for (let index = 0; index < event.results.length; index += 1) {
        finalText += `${event.results[index][0].transcript} `;
      }
      setTranscript(finalText.trim());
      setLastSpeechAt(Date.now());
    };

    recognition.onerror = () => {
      setIsRecording(false);
      toast.error("Speech recognition error. Please retry.");
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
    setQuestionStartAt(Date.now());
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const computeSpeechMetrics = (): InterviewAnswerInput["speechMetrics"] => {
    const words = transcript.trim().split(/\s+/).filter(Boolean);
    const durationSec = Math.max(1, Math.round((Date.now() - questionStartAt) / 1000));
    const wordsPerMinute = Math.round((words.length / durationSec) * 60);
    const fillerWords = (transcript.toLowerCase().match(/\b(um|uh|like|you know|actually)\b/g) || []).length;
    const pauseDurationSec = Math.round(Math.max(0, (Date.now() - lastSpeechAt) / 1000));
    const clarityScore = Math.max(0, Math.min(100, Math.round(100 - fillerWords * 4 - Math.abs(wordsPerMinute - 120) * 0.25)));

    return {
      wordsPerMinute: Math.max(0, Math.min(220, wordsPerMinute || 60)),
      pauseDurationSec: Math.max(0, Math.min(300, pauseDurationSec)),
      fillerWords,
      clarityScore,
    };
  };

  const submitCurrentAnswer = async () => {
    if (!token || !interviewId || terminated) return;
    if (mandatoryPaused) {
      toast.error(isCoding ? "Camera and clear face visibility are required to submit your answer." : "Camera, microphone, and clear face visibility are required to submit your answer.");
      return;
    }

    if (isRecording) {
      stopRecording();
    }

    const isUnanswered = isCoding ? !codeAnswer.trim() : !transcript.trim();
    if (isUnanswered) {
      setUnansweredCount((value) => value + 1);
    }

    const payload: InterviewAnswerInput = isCoding
      ? {
          transcript: "",
          speechMetrics: { wordsPerMinute: 0, pauseDurationSec: 0, fillerWords: 0, clarityScore: 0 },
          codeAnswer: {
            code: codeAnswer.trim() || "// [UNANSWERED - TIMEOUT]",
            language: codingLanguage,
            complexityNote: complexityNote.trim(),
          },
        }
      : {
          transcript: transcript.trim() || "[UNANSWERED - TIMEOUT]",
          speechMetrics: transcript.trim()
            ? computeSpeechMetrics()
            : { wordsPerMinute: 0, pauseDurationSec: 60, fillerWords: 0, clarityScore: 0 },
        };

    setSubmitting(true);
    try {
      const response = await api.submitAnswer(token, interviewId, payload);
      const isLast = response.answerCount >= response.totalQuestions;

      if (!isLast) {
        setCurrentQ(response.answerCount);
        setTranscript("");
        setCodeAnswer("");
        setComplexityNote("");
        setQuestionTime(60);
        setQuestionStartAt(Date.now());
        setLastSpeechAt(Date.now());
        return;
      }

      const reportResponse = await api.completeInterview(token, interviewId, {
        durationSec: Math.max(1, timeElapsed),
        proctoringSignals: {
          tabSwitches,
          longSilenceEvents,
          micOnRatio: micReady ? 1 : 0,
          faceDetectedRatio: faceDetected ? 1 : 0,
          backgroundNoiseEvents,
          multipleFaceEvents,
        },
      });

      navigate(`/interview/${type}/results?reportId=${reportResponse.reportId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  const progress = useMemo(() => {
    if (!questions.length) return 0;
    return ((currentQ + 1) / questions.length) * 100;
  }, [currentQ, questions.length]);

  const toggleCamera = () => {
    const videoTrack = mediaStreamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setCameraReady(videoTrack.enabled);
    if (!videoTrack.enabled) {
      setFaceDetected(false);
    }
  };

  const toggleMic = () => {
    if (isCoding) return;
    const audioTrack = mediaStreamRef.current?.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setMicReady(audioTrack.enabled);
  };

  const highlightCode = (code: string) => {
    if (codingLanguage === "python") return Prism.highlight(code, Prism.languages.python, "python");
    if (codingLanguage === "java") return Prism.highlight(code, Prism.languages.java, "java");
    if (codingLanguage === "cpp") return Prism.highlight(code, Prism.languages.c, "c");
    return Prism.highlight(code, Prism.languages.javascript, "javascript");
  };

  const renderLineNumbers = (code: string) => {
    const lineCount = Math.max(10, code.split("\n").length);
    return Array.from({ length: lineCount }, (_, index) => index + 1).join("\n");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-[60vh] flex items-center justify-center text-muted-foreground">Loading interview session...</div>
      </DashboardLayout>
    );
  }

  if (terminated) {
    return (
      <DashboardLayout>
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
          <AlertTriangle className="h-16 w-16 text-destructive" />
          <h2 className="text-2xl font-bold text-destructive">Interview Terminated</h2>
          <p className="text-muted-foreground text-center max-w-md">{terminationReason}</p>
          <button onClick={() => navigate("/dashboard")} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground">
            Return to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AnimatePresence>
        {showMultiPersonAlert && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }} className="bg-card border-2 border-warning rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-9 w-9 text-warning shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground mb-2">Proctoring Warning</h3>
                  <p className="text-sm text-muted-foreground mb-4">Multiple persons detected. Please ensure you are alone during the interview.</p>
                  <button onClick={() => setShowMultiPersonAlert(false)} className="w-full px-4 py-2 rounded-lg bg-warning/20 text-warning hover:bg-warning/30 font-medium transition-colors">
                    I Understand
                  </button>
                </div>
                <button onClick={() => setShowMultiPersonAlert(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{isCoding ? "Coding Interview in Progress" : "Interview in Progress"}</h2>
            <p className="text-sm text-muted-foreground capitalize">{type} • {topic} • 10 Questions Mandatory • Powered by MocMate AI</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`text-sm font-semibold flex items-center gap-2 px-3 py-1.5 rounded-lg ${questionTime > 30 ? "bg-success/10 text-success" : questionTime > 10 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>
              <Clock className="h-4 w-4" />
              <span className="text-lg font-mono">{questionTime}s</span>
            </div>
            <div className="text-sm text-muted-foreground">Q{currentQ + 1}/{questions.length}</div>
          </div>
        </div>

        {mandatoryPaused && (
          <div className="p-3 rounded-xl border border-warning/30 bg-warning/10 text-warning text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              {!cameraReady
                ? "📷 Enable camera access"
                : !micReady && !isCoding
                  ? "🎤 Enable microphone access"
                  : !faceDetectionReady
                    ? "🔍 Initializing mandatory face validation..."
                    : "🙂 Keep your face clearly visible to continue"}
            </span>
          </div>
        )}

        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <motion.div animate={{ width: `${progress}%` }} className="h-full rounded-full bg-gradient-primary" transition={{ duration: 0.5 }} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-6 rounded-2xl bg-card border border-border">
              <span className="text-xs text-primary font-medium mb-2 block">Question {currentQ + 1}</span>
              <p className="text-lg font-medium text-foreground">{questions[currentQ]}</p>
            </motion.div>

            {!isCoding ? (
              <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={startRecording} disabled={isRecording || mandatoryPaused} className="px-4 py-2 rounded-lg bg-success/20 text-success text-sm font-medium disabled:opacity-40 flex items-center gap-2">
                    <PlayCircle className="h-4 w-4" /> Start Recording
                  </button>
                  <button onClick={stopRecording} disabled={!isRecording} className="px-4 py-2 rounded-lg bg-destructive/20 text-destructive text-sm font-medium disabled:opacity-40 flex items-center gap-2">
                    <PauseCircle className="h-4 w-4" /> Stop Recording
                  </button>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <AudioLines className="h-4 w-4" /> {isRecording ? "Listening..." : "Recorder idle"}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-secondary/30 border border-border min-h-[140px]">
                  <p className="text-xs text-muted-foreground mb-2">Automatic Transcript</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{transcript || "Start recording and speak your answer."}</p>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Code2 className="h-4 w-4 text-primary" /> Code Editor
                  </div>
                  <select value={codingLanguage} onChange={(event) => setCodingLanguage(event.target.value as "javascript" | "python" | "java" | "cpp")} className="px-3 py-2 rounded-lg border border-border bg-secondary/40 text-sm text-foreground">
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>

                <div className="rounded-xl border border-border bg-secondary/20 overflow-hidden flex min-h-[260px]">
                  <pre className="text-xs leading-6 p-3 text-muted-foreground bg-secondary/40 select-none w-12 text-right">{renderLineNumbers(codeAnswer)}</pre>
                  <Editor
                    value={codeAnswer}
                    onValueChange={setCodeAnswer}
                    highlight={highlightCode}
                    padding={12}
                    className="flex-1 text-sm font-mono outline-none min-h-[260px]"
                    textareaClassName="outline-none"
                    style={{ minHeight: 260 }}
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-2">Time complexity explanation (optional)</label>
                  <textarea value={complexityNote} onChange={(event) => setComplexityNote(event.target.value)} rows={3} className="w-full p-3 rounded-xl bg-secondary/30 border border-border text-sm text-foreground placeholder:text-muted-foreground" placeholder="Explain time and space complexity..." />
                </div>
              </div>
            )}

            <div className="flex justify-center md:justify-end">
              <button
                onClick={() => void submitCurrentAnswer()}
                disabled={(isCoding ? !codeAnswer.trim() : !transcript.trim()) || submitting || mandatoryPaused}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed min-w-[220px] justify-center"
              >
                {currentQ < questions.length - 1 ? (
                  <>Confirm & Next <ChevronRight className="h-4 w-4" /></>
                ) : (
                  <>Submit Interview <Send className="h-4 w-4" /></>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-card border border-border">
              <h4 className="text-sm font-semibold mb-3">Proctoring Feed</h4>
              <div className="aspect-video rounded-xl bg-secondary mb-3 overflow-hidden flex items-center justify-center">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-2">
                <button onClick={toggleCamera} className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 ${cameraReady ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                  {cameraReady ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />} {cameraReady ? "Camera On" : "Camera Off"}
                </button>
                {!isCoding && (
                  <button onClick={toggleMic} className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 ${micReady ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                    {micReady ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />} {micReady ? "Mic On" : "Mic Off"}
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border">
              <h4 className="text-sm font-semibold mb-3">Live Monitoring</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${faceDetected ? "bg-success" : "bg-warning"}`} /> Face detected: {faceDetected ? "Yes" : "No"}</div>
                <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${tabSwitches === 0 ? "bg-success" : "bg-warning"}`} /> Tab switches: {tabSwitches}</div>
                <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${longSilenceEvents === 0 ? "bg-success" : "bg-warning"}`} /> Long silence events: {longSilenceEvents}</div>
                <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${backgroundNoiseEvents === 0 ? "bg-success" : "bg-warning"}`} /> Background noise events: {backgroundNoiseEvents}</div>
                <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${multipleFaceEvents === 0 ? "bg-success" : "bg-warning"}`} /> Multi-face detections: {multipleFaceEvents}</div>
                <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${multiPersonWarnings === 0 ? "bg-success" : "bg-warning"}`} /> Multi-person warnings: {multiPersonWarnings}</div>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="p-4 rounded-2xl bg-card border border-destructive/25 text-xs text-destructive">
                Unanswered questions: {unansweredCount}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default InterviewSession;