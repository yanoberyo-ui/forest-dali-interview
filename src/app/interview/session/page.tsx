"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { MAX_QUESTIONS } from "@/lib/constants";

interface Message {
  role: "assistant" | "user";
  content: string;
}

/** AI面接官アバター */
function InterviewerAvatar({ speaking = false }: { speaking?: boolean }) {
  return (
    <div className="relative w-9 h-9 flex-shrink-0">
      <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-sm">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </div>
      {speaking && (
        <div className="absolute -bottom-0.5 -right-0.5">
          <div className="relative">
            <div className="w-3.5 h-3.5 bg-success rounded-full border-2 border-white" />
            <div className="absolute inset-0 w-3.5 h-3.5 bg-success rounded-full animate-pulse-ring" />
          </div>
        </div>
      )}
    </div>
  );
}

const TUTORIAL_STEPS = [
  {
    icon: (
      <div className="w-16 h-16 bg-primary/8 rounded-3xl flex items-center justify-center">
        <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      </div>
    ),
    title: "カメラ・マイクを使用します",
    description: "面接中はカメラとマイクで録画されます。採用担当者が後ほど確認しますので、明るい場所で正面を向いてお話しください。",
  },
  {
    icon: (
      <div className="w-16 h-16 bg-primary/8 rounded-3xl flex items-center justify-center">
        <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      </div>
    ),
    title: "AI面接官が質問します",
    description: "AI面接官があなたの人柄やパーソナリティについて質問します。全部で7問あります。リラックスしてお答えください。",
  },
  {
    icon: (
      <div className="w-16 h-16 bg-primary/8 rounded-3xl flex items-center justify-center">
        <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
        </svg>
      </div>
    ),
    title: "音声で回答",
    description: "マイクボタンを押して音声で回答してください。話し終わったら送信ボタンを押すと、次の質問に進みます。",
  },
  {
    icon: (
      <div className="w-16 h-16 bg-primary/8 rounded-3xl flex items-center justify-center">
        <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </div>
    ),
    title: "準備はよろしいですか？",
    description: "「面接を開始する」ボタンを押すと、カメラの許可を求められます。許可した後、面接が始まります。",
  },
];

function InterviewSessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const interviewId = searchParams.get("id");

  const [tutorialStep, setTutorialStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [questionNum, setQuestionNum] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const loadedRef = useRef(false);

  const { videoRef, isRecording, startCamera, startRecording, stopRecording, stopCamera } = useMediaRecorder();
  const { transcript, interimTranscript, isListening, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const { isSpeaking, speak, stop: stopSpeaking } = useTextToSpeech();

  useEffect(() => {
    if (!interviewId || loadedRef.current) return;
    loadedRef.current = true;
    const loadInterview = async () => {
      try {
        const res = await fetch(`/api/interview/${interviewId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages?.length) {
            setMessages(data.messages.map((m: { role: string; content: string }) => ({ role: m.role as "assistant" | "user", content: m.content })));
            const assistantMsgs = data.messages.filter((m: { role: string }) => m.role === "assistant");
            setQuestionNum(assistantMsgs.length);
          }
        }
      } catch (err) { console.error("Failed to load interview:", err); }
    };
    loadInterview();
  }, [interviewId]);

  const speakFirstMessage = useCallback(() => {
    if (messages.length > 0 && messages[0].role === "assistant") speak(messages[0].content);
  }, [messages, speak]);

  const handleStartInterview = async () => {
    setShowTutorial(false);
    try {
      const stream = await startCamera();
      startRecording(stream);
      setCameraReady(true);
      setTimeout(speakFirstMessage, 150);
    } catch { setPermissionError(true); }
  };

  useEffect(() => {
    if (cameraReady && !isComplete) {
      timerRef.current = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [cameraReady, isComplete]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isSending]);

  useEffect(() => {
    if (!isUploading) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isUploading]);

  useEffect(() => {
    return () => { stopCamera(); if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !interviewId || isSending) return;
    const userMsg = content.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsSending(true);
    resetTranscript();
    stopSpeaking();
    try {
      const res = await fetch("/api/interview/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId, userMessage: userMsg }),
      });
      const data = await res.json();
      if (!res.ok) { console.error("Chat error:", data.error); return; }
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      setQuestionNum(data.questionNum);
      if (data.isComplete) setIsComplete(true);
      speak(data.message);
    } catch (err) { console.error("Send error:", err); }
    finally { setIsSending(false); }
  }, [interviewId, isSending, resetTranscript, speak, stopSpeaking]);

  const handleSendVoice = useCallback(() => {
    if (transcript.trim()) { stopListening(); sendMessage(transcript); }
  }, [transcript, stopListening, sendMessage]);

  const uploadingRef = useRef(false);
  const [uploadError, setUploadError] = useState(false);
  const handleEndInterview = useCallback(async () => {
    if (uploadingRef.current) return;
    uploadingRef.current = true;
    setIsUploading(true);
    setIsComplete(true);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      stopListening(); stopSpeaking();

      // Stop recording with timeout protection
      let blob: Blob;
      try {
        blob = await Promise.race([
          stopRecording(),
          new Promise<Blob>((_, reject) => setTimeout(() => reject(new Error("stopRecording timeout")), 5000))
        ]);
      } catch (e) {
        console.warn("stopRecording failed, creating empty blob:", e);
        blob = new Blob([], { type: "video/webm" });
      }
      stopCamera();

      // Skip upload if blob is empty (recording failed)
      if (blob.size > 0) {
        const formData = new FormData();
        formData.append("video", blob, "interview.webm");
        formData.append("interviewId", interviewId!);

        // Upload with timeout (120s for large videos)
        const controller = new AbortController();
        const uploadTimeout = setTimeout(() => controller.abort(), 120000);
        try {
          await fetch("/api/video/upload", { method: "POST", body: formData, signal: controller.signal });
        } catch (uploadErr) {
          console.error("Video upload failed:", uploadErr);
          setUploadError(true);
        } finally {
          clearTimeout(uploadTimeout);
        }
      }

      // Always mark interview as complete
      try {
        await fetch("/api/interview/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ interviewId }) });
      } catch (e) { console.error("Complete API failed:", e); }

      router.push("/interview/complete");
    } catch (err) {
      console.error("End interview error:", err);
      router.push("/interview/complete");
    }
  }, [interviewId, stopListening, stopSpeaking, stopRecording, stopCamera, router]);

  const hasAutoEnded = useRef(false);
  useEffect(() => {
    if (isComplete && !hasAutoEnded.current && !isUploading) {
      hasAutoEnded.current = true;
      const waitAndEnd = () => { if (isSpeaking) { setTimeout(waitAndEnd, 500); } else { handleEndInterview(); } };
      setTimeout(waitAndEnd, 1000);
    }
  }, [isComplete, isUploading, isSpeaking, handleEndInterview]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Tutorial screen
  if (showTutorial) {
    const step = TUTORIAL_STEPS[tutorialStep];
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <nav className="glass fixed top-0 left-0 right-0 z-50 border-b border-black/5">
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-semibold tracking-tight">FD</span>
              </div>
              <span className="text-sm font-semibold text-foreground tracking-tight">Forest Dali</span>
            </div>
            <span className="text-xs text-foreground/30">面接準備</span>
          </div>
        </nav>

        <main className="flex-1 pt-14 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full animate-fade-in">
            <div className="flex justify-center gap-2 mb-10">
              {TUTORIAL_STEPS.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === tutorialStep ? "bg-primary w-8" : i < tutorialStep ? "bg-primary/30 w-4" : "bg-black/8 w-4"}`} />
              ))}
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-6">{step.icon}</div>
              <h2 className="text-2xl font-bold text-foreground mb-3">{step.title}</h2>
              <p className="text-foreground/45 leading-relaxed mb-10 text-sm">{step.description}</p>
              <div className="flex justify-center gap-3">
                {tutorialStep > 0 && (
                  <button onClick={() => setTutorialStep((prev) => prev - 1)} className="px-6 py-3 rounded-full text-foreground/50 hover:text-foreground hover:bg-surface text-sm font-medium transition-all">
                    戻る
                  </button>
                )}
                {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
                  <button onClick={() => setTutorialStep((prev) => prev + 1)} className="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                    次へ
                  </button>
                ) : (
                  <button onClick={handleStartInterview} className="group bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2">
                    面接を開始する
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <p className="text-center text-xs text-foreground/25 mt-8">カメラとマイクの使用許可が求められます</p>
          </div>
        </main>
      </div>
    );
  }

  if (permissionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-sm animate-fade-in">
          <div className="w-16 h-16 bg-error/8 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-3 text-foreground">カメラ・マイクの許可が必要です</h2>
          <p className="text-foreground/45 mb-8 text-sm leading-relaxed">面接ではカメラとマイクを使用します。ブラウザの設定から許可してください。</p>
          <button onClick={() => window.location.reload()} className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-full font-semibold transition-all duration-300">
            再試行する
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {isUploading && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-sm w-full text-center animate-scale-in">
            {uploadError ? (
              <>
                <div className="mx-auto mb-6 w-14 h-14 bg-error/10 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">送信に時間がかかっています</h3>
                <p className="text-foreground/45 text-sm leading-relaxed mb-6">動画の送信に問題がありました。<br />面接の回答は保存されています。</p>
                <button onClick={() => router.push("/interview/complete")} className="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-8 rounded-full transition-all">
                  完了画面へ進む
                </button>
              </>
            ) : (
              <>
                <div className="mx-auto mb-6 w-14 h-14 border-[3px] border-surface border-t-primary rounded-full animate-spin" />
                <h3 className="text-lg font-bold text-foreground mb-2">アップロード中</h3>
                <p className="text-foreground/45 text-sm leading-relaxed">録画データを送信しています。<br />ブラウザを閉じずにお待ちください。</p>
              </>
            )}
          </div>
        </div>
      )}

      <header className="glass-dark text-white py-2.5 px-4 lg:px-6 flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center">
            <span className="text-[10px] font-semibold">FD</span>
          </div>
          <span className="font-medium text-sm hidden sm:block text-white/90">面接</span>
        </div>
        <div className="flex items-center gap-5 text-xs">
          {isSpeaking && (
            <div className="flex items-center gap-1.5 text-white/70">
              <div className="flex items-center gap-0.5">
                <div className="w-0.5 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
                <div className="w-0.5 h-3 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
                <div className="w-0.5 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
              </div>
              <span>読み上げ中</span>
            </div>
          )}
          {isRecording && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse-dot" />
              <span className="text-white/70">REC</span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
            <span className="text-white/60">{Math.min(questionNum, MAX_QUESTIONS)}/{MAX_QUESTIONS}</span>
            <div className="w-px h-3 bg-white/20" />
            <span className="font-mono text-white/60">{formatTime(elapsedTime)}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="h-[28vh] lg:h-auto lg:w-[35%] bg-black relative flex-shrink-0">
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-white">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full mx-auto mb-3" />
                <p className="text-xs text-white/50">カメラを起動中</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-surface">
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
            {messages.filter((msg) => msg.role === "assistant").map((msg, i, assistantMsgs) => (
              <div key={i} className="flex gap-3 animate-fade-in">
                <InterviewerAvatar speaking={isSpeaking && i === assistantMsgs.length - 1} />
                <div className="flex-1 max-w-[85%]">
                  <p className="text-[11px] font-medium text-foreground/30 mb-1.5">AI面接官</p>
                  <div className="bg-white rounded-2xl rounded-tl-lg px-4 py-3 shadow-sm">
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex gap-3">
                <InterviewerAvatar />
                <div>
                  <p className="text-[11px] font-medium text-foreground/30 mb-1.5">AI面接官</p>
                  <div className="bg-white rounded-2xl rounded-tl-lg px-4 py-3.5 shadow-sm">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-foreground/20 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 bg-foreground/20 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 bg-foreground/20 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {(transcript || interimTranscript) && isListening && (
            <div className="px-4 lg:px-6 pb-2">
              <div className="bg-white/80 backdrop-blur rounded-xl px-4 py-2.5 border border-black/5">
                <p className="text-sm text-foreground/60">{transcript}<span className="text-foreground/25">{interimTranscript}</span></p>
              </div>
            </div>
          )}

          <div className="border-t border-black/5 bg-white p-4 lg:p-5 flex-shrink-0">
            {isComplete ? (
              <div className="text-center py-2">
                <button onClick={handleEndInterview} disabled={isUploading} className="bg-primary hover:bg-primary-dark disabled:opacity-40 text-white font-semibold py-3.5 px-10 rounded-full transition-all duration-300 hover:shadow-lg">
                  {isUploading ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />アップロード中...</span> : "面接を終了して送信する"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3">
                  {!isListening ? (
                    <button onClick={startListening} disabled={isSending || isSpeaking} className="group flex items-center justify-center gap-2.5 bg-primary hover:bg-primary-dark disabled:opacity-30 text-white font-semibold py-3.5 px-8 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                      </svg>
                      {isSpeaking ? "読み上げ中..." : "マイクで回答する"}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-red-50 text-red-500 px-4 py-2.5 rounded-full text-sm font-medium">
                        <div className="relative">
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          <div className="absolute inset-0 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                        </div>
                        録音中
                      </div>
                      <button onClick={handleSendVoice} disabled={!transcript.trim()} className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-30 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                        送信
                      </button>
                      <button onClick={() => { stopListening(); resetTranscript(); }} className="w-10 h-10 rounded-full flex items-center justify-center text-foreground/30 hover:text-foreground/60 hover:bg-surface transition-all" title="キャンセル">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <button onClick={handleEndInterview} className="text-xs text-foreground/25 hover:text-error transition-colors font-medium">面接を途中で終了する</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InterviewSession() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-white"><div className="animate-spin w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full" /></div>}>
      <InterviewSessionContent />
    </Suspense>
  );
}
