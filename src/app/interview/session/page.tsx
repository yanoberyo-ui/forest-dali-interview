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

/** 面接官アバター（SVGイラスト） */
function InterviewerAvatar({ speaking = false }: { speaking?: boolean }) {
  return (
    <div className={`relative w-10 h-10 flex-shrink-0 ${speaking ? "animate-pulse" : ""}`}>
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Background circle */}
        <circle cx="40" cy="40" r="40" fill="#2D6A4F" />
        {/* Face */}
        <circle cx="40" cy="35" r="18" fill="#FDDCB5" />
        {/* Hair */}
        <path d="M22 30C22 20 30 14 40 14C50 14 58 20 58 30C58 30 56 24 40 24C24 24 22 30 22 30Z" fill="#3D2C1E" />
        <path d="M22 30C22 28 22 26 23 25C24 28 28 30 28 30L22 30Z" fill="#3D2C1E" />
        <path d="M58 30C58 28 58 26 57 25C56 28 52 30 52 30L58 30Z" fill="#3D2C1E" />
        {/* Eyes */}
        <ellipse cx="33" cy="34" rx="2.5" ry="3" fill="#2C1810" />
        <ellipse cx="47" cy="34" rx="2.5" ry="3" fill="#2C1810" />
        <circle cx="34" cy="33" r="0.8" fill="white" />
        <circle cx="48" cy="33" r="0.8" fill="white" />
        {/* Eyebrows */}
        <path d="M29 29C30 27.5 33 27 36 28" stroke="#3D2C1E" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M51 29C50 27.5 47 27 44 28" stroke="#3D2C1E" strokeWidth="1.5" strokeLinecap="round" />
        {/* Smile */}
        <path d="M34 42C36 44.5 44 44.5 46 42" stroke="#C4836A" strokeWidth="1.8" strokeLinecap="round" />
        {/* Body / Suit */}
        <path d="M20 66C20 56 28 50 40 50C52 50 60 56 60 66L60 80L20 80Z" fill="#1B4332" />
        {/* Collar / Tie */}
        <path d="M36 50L40 58L44 50" fill="#2D6A4F" />
        <rect x="38.5" y="54" width="3" height="10" rx="1" fill="#B7E4C7" />
        {/* Shirt */}
        <path d="M36 50C37 52 38 53 38.5 54L40 50Z" fill="white" />
        <path d="M44 50C43 52 42 53 41.5 54L40 50Z" fill="white" />
      </svg>
      {/* Speaking indicator */}
      {speaking && (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
        </div>
      )}
    </div>
  );
}

const TUTORIAL_STEPS = [
  {
    icon: "📹",
    title: "カメラ・マイクを使用します",
    description:
      "面接中はカメラとマイクで録画されます。採用担当者が後ほど確認しますので、明るい場所で正面を向いてお話しください。",
  },
  {
    icon: "🗣️",
    title: "AI面接官が質問します",
    description:
      "AI面接官があなたの人柄やパーソナリティについて質問します。全部で7問の質問があります。リラックスしてお答えください。",
  },
  {
    icon: "🎤",
    title: "回答方法",
    description:
      "マイクボタンを押して音声で回答してください。話し終わったら送信ボタンを押すと、次の質問に進みます。",
  },
  {
    icon: "✅",
    title: "準備はよろしいですか？",
    description:
      "「面接を開始する」ボタンを押すと、カメラの許可を求められます。許可した後、面接が始まります。",
  },
];

function InterviewSessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const interviewId = searchParams.get("id");

  // Tutorial state
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);

  // Interview state
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

  const { videoRef, isRecording, startCamera, startRecording, stopRecording, stopCamera } =
    useMediaRecorder();
  const {
    transcript,
    interimTranscript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();
  const { isSpeaking, speak, stop: stopSpeaking } = useTextToSpeech();

  // Load interview data (only once)
  useEffect(() => {
    if (!interviewId || loadedRef.current) return;
    loadedRef.current = true;

    const loadInterview = async () => {
      try {
        const res = await fetch(`/api/interview/${interviewId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages?.length) {
            setMessages(
              data.messages.map((m: { role: string; content: string }) => ({
                role: m.role as "assistant" | "user",
                content: m.content,
              }))
            );
            const assistantMsgs = data.messages.filter(
              (m: { role: string }) => m.role === "assistant"
            );
            setQuestionNum(assistantMsgs.length);
          }
        }
      } catch (err) {
        console.error("Failed to load interview:", err);
      }
    };

    loadInterview();
  }, [interviewId]);

  // Read the first message aloud when interview starts
  const speakFirstMessage = useCallback(() => {
    if (messages.length > 0 && messages[0].role === "assistant") {
      speak(messages[0].content);
    }
  }, [messages, speak]);

  // Start camera + recording after tutorial
  const handleStartInterview = async () => {
    setShowTutorial(false);
    try {
      const stream = await startCamera();
      startRecording(stream);
      setCameraReady(true);
      setTimeout(speakFirstMessage, 500);
    } catch {
      setPermissionError(true);
    }
  };

  // Timer
  useEffect(() => {
    if (cameraReady && !isComplete) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cameraReady, isComplete]);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // Prevent browser close during upload
  useEffect(() => {
    if (!isUploading) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isUploading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !interviewId || isSending) return;

      const userMsg = content.trim();

      setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
      setIsSending(true);
      resetTranscript();
      stopSpeaking();

      try {
        const res = await fetch("/api/interview/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interviewId, userMessage: userMsg }),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("Chat error:", data.error);
          return;
        }

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);
        setQuestionNum(data.questionNum);

        if (data.isComplete) {
          setIsComplete(true);
        }

        speak(data.message);
      } catch (err) {
        console.error("Send error:", err);
      } finally {
        setIsSending(false);
      }
    },
    [interviewId, isSending, resetTranscript, speak, stopSpeaking]
  );

  const handleSendVoice = useCallback(() => {
    if (transcript.trim()) {
      stopListening();
      sendMessage(transcript);
    }
  }, [transcript, stopListening, sendMessage]);

  const handleEndInterview = async () => {
    if (isUploading) return;
    setIsUploading(true);
    setIsComplete(true);

    if (timerRef.current) clearInterval(timerRef.current);

    try {
      stopListening();
      stopSpeaking();
      const blob = await stopRecording();
      stopCamera();

      const formData = new FormData();
      formData.append("video", blob, "interview.webm");
      formData.append("interviewId", interviewId!);
      await fetch("/api/video/upload", { method: "POST", body: formData });

      await fetch("/api/interview/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId }),
      });

      router.push("/interview/complete");
    } catch (err) {
      console.error("End interview error:", err);
      router.push("/interview/complete");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Tutorial screen
  if (showTutorial) {
    const step = TUTORIAL_STEPS[tutorialStep];
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-primary text-white py-4 px-6 shadow-md">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-xl font-bold">
              FD
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide">株式会社Forest Dali</h1>
              <p className="text-xs text-white/70">AI Interview System</p>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center bg-surface px-4 py-12">
          <div className="max-w-lg w-full animate-fade-in">
            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-8">
              {TUTORIAL_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i === tutorialStep
                      ? "bg-primary"
                      : i < tutorialStep
                      ? "bg-primary/40"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="text-5xl mb-4">{step.icon}</div>
              <h2 className="text-xl font-bold mb-3">{step.title}</h2>
              <p className="text-foreground/60 mb-8 leading-relaxed">{step.description}</p>

              <div className="flex justify-center gap-3">
                {tutorialStep > 0 && (
                  <button
                    onClick={() => setTutorialStep((prev) => prev - 1)}
                    className="px-6 py-3 border border-gray-200 rounded-full text-foreground/60 hover:bg-surface transition-colors"
                  >
                    戻る
                  </button>
                )}
                {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
                  <button
                    onClick={() => setTutorialStep((prev) => prev + 1)}
                    className="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-8 rounded-full transition-colors"
                  >
                    次へ
                  </button>
                ) : (
                  <button
                    onClick={handleStartInterview}
                    className="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-8 rounded-full transition-colors"
                  >
                    面接を開始する
                  </button>
                )}
              </div>
            </div>

            <p className="text-center text-xs text-foreground/40 mt-4">
              ※ カメラとマイクの使用許可が求められます
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Permission error screen
  if (permissionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">📷</div>
          <h2 className="text-xl font-bold mb-2">カメラ・マイクの許可が必要です</h2>
          <p className="text-foreground/60 mb-6">
            面接ではカメラとマイクを使用します。ブラウザの設定からカメラ・マイクの使用を許可してください。
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-6 py-3 rounded-full"
          >
            再試行する
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-surface">
      {/* Upload Overlay */}
      {isUploading && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <div className="mx-auto mb-6 w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <h3 className="text-lg font-bold mb-2">録画をアップロード中...</h3>
            <p className="text-foreground/60 text-sm leading-relaxed">
              完了するまでブラウザは閉じずにお待ちください。
            </p>
            <div className="flex justify-center gap-1.5 mt-4">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-primary text-white py-2 px-3 lg:py-3 lg:px-4 shadow-md flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm font-bold">
            FD
          </div>
          <span className="font-semibold hidden sm:block">Forest Dali 面接</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {isSpeaking && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs">🔊</span>
              <span>読み上げ中</span>
            </div>
          )}
          {isRecording && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse-dot" />
              <span>REC</span>
            </div>
          )}
          <span>
            質問 {Math.min(questionNum, MAX_QUESTIONS)}/{MAX_QUESTIONS}
          </span>
          <span className="font-mono">{formatTime(elapsedTime)}</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Video Preview */}
        <div className="h-[30vh] lg:h-auto lg:w-1/3 bg-black relative flex-shrink-0">
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm">カメラを起動中...</p>
              </div>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.filter((msg) => msg.role === "assistant").map((msg, i, assistantMsgs) => (
              <div key={i} className="flex justify-start">
                <div className="mr-2 mt-1">
                  <InterviewerAvatar speaking={isSpeaking && i === assistantMsgs.length - 1} />
                </div>
                <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white shadow-sm border rounded-bl-sm">
                  <p className="text-xs font-semibold text-primary/70 mb-1">AI面接官</p>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="mr-2 mt-1">
                  <InterviewerAvatar />
                </div>
                <div className="bg-white shadow-sm border rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area - Voice Only */}
          <div className="border-t bg-white p-3 lg:p-4 flex-shrink-0">
            {isComplete ? (
              <div className="text-center">
                <button
                  onClick={handleEndInterview}
                  disabled={isUploading}
                  className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-semibold py-3 px-8 rounded-full transition-colors"
                >
                  {isUploading ? "録画をアップロード中..." : "面接を終了して送信する"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-4">
                  {/* Main mic button */}
                  {!isListening ? (
                    <button
                      onClick={startListening}
                      disabled={isSending || isSpeaking}
                      className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-40 text-white font-semibold py-3 px-8 rounded-full transition-all shadow-lg hover:shadow-xl"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                        />
                      </svg>
                      {isSpeaking ? "読み上げ中..." : "マイクで回答する"}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      {/* Recording indicator */}
                      <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-medium">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                        録音中...
                      </div>

                      {/* Send button */}
                      <button
                        onClick={handleSendVoice}
                        disabled={!transcript.trim()}
                        className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-40 text-white font-semibold py-3 px-6 rounded-full transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                          />
                        </svg>
                        送信
                      </button>

                      {/* Cancel button */}
                      <button
                        onClick={() => {
                          stopListening();
                          resetTranscript();
                        }}
                        className="flex items-center justify-center w-10 h-10 text-foreground/40 hover:text-foreground/60 transition-colors"
                        title="キャンセル"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleEndInterview}
                    className="text-sm text-foreground/40 hover:text-error transition-colors"
                  >
                    面接を途中で終了する
                  </button>
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
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-surface">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <InterviewSessionContent />
    </Suspense>
  );
}
