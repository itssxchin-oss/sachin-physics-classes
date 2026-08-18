"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  MessageCircle,
  X,
  Send,
  Image as ImageIcon,
  Sparkles,
  Bot,
  User,
  Loader2,
  Trash2,
  LogIn,
  History,
  Plus,
  ChevronLeft,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "model" | "assistant";
  text: string;
  imagePreview?: string;
  timestamp: Date;
  isError?: boolean;
}

interface Session {
  id: string;
  title: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function titleFromMessage(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= 45) return trimmed;
  return trimmed.slice(0, 42).trimEnd() + "...";
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function DoubtChatWidget() {
  const supabase = useMemo(() => createClient(), []);

  // ── Panel state ─────────────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Exit fullscreen on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // ── Auth state ──────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  // ── Session state ───────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isDeletingSessionId, setIsDeletingSessionId] = useState<string | null>(null);

  // ── Message state ───────────────────────────────────────────────────────────
  const welcomeMessage: Message = useMemo(
    () => ({
      id: "welcome-1",
      role: "model",
      text: "Hello! 👋 I'm your AI Doubt Solver for Sachin Physics Classes. Ask me any Physics, Chemistry, or Maths question — or upload a photo of your problem/diagram!",
      timestamp: new Date(),
    }),
    []
  );

  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);

  // ── Input state ──────────────────────────────────────────────────────────────
  const [inputMessage, setInputMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<{
    file: File;
    base64: string;
    mimeType: string;
    previewUrl: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Auto-scroll ──────────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isLoading, isOpen, scrollToBottom]);

  // ── Fetch sessions list ──────────────────────────────────────────────────────
  const fetchSessions = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from("doubt_sessions")
        .select("id, title, updated_at")
        .eq("student_id", userId)
        .order("updated_at", { ascending: false });

      if (!error && data) {
        setSessions(data as Session[]);
      }
    },
    [supabase]
  );

  // ── Fetch messages for a session ─────────────────────────────────────────────
  const fetchSessionMessages = useCallback(
    async (sessionId: string) => {
      setIsFetchingHistory(true);
      try {
        const { data, error } = await supabase
          .from("doubt_messages")
          .select("*")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });

        if (!error && data) {
          if (data.length === 0) {
            setMessages([welcomeMessage]);
          } else {
            const loaded: Message[] = data.map((row) => ({
              id: row.id,
              role: row.role === "user" ? "user" : "model",
              text: row.message,
              imagePreview: row.image_url || undefined,
              timestamp: new Date(row.created_at),
            }));
            setMessages([welcomeMessage, ...loaded]);
          }
        }
      } finally {
        setIsFetchingHistory(false);
      }
    },
    [supabase, welcomeMessage]
  );

  // ── Auth init & listen ───────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) return;
      setCurrentUser(user);
      setIsAuthLoaded(true);

      if (user) {
        // Fetch sessions and auto-load most recent one
        const { data, error } = await supabase
          .from("doubt_sessions")
          .select("id, title, updated_at")
          .eq("student_id", user.id)
          .order("updated_at", { ascending: false });

        if (!isMounted) return;
        if (!error && data) {
          setSessions(data as Session[]);
          if (data.length > 0) {
            setActiveSessionId(data[0].id);
            await fetchSessionMessages(data[0].id);
          }
        }
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      const user = session?.user || null;
      setCurrentUser(user);
      setIsAuthLoaded(true);
      if (user) {
        fetchSessions(user.id);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchSessions, fetchSessionMessages]);

  // ── Select session from sidebar ──────────────────────────────────────────────
  const handleSelectSession = useCallback(
    async (sessionId: string) => {
      setActiveSessionId(sessionId);
      setShowSidebar(false);
      await fetchSessionMessages(sessionId);
    },
    [fetchSessionMessages]
  );

  // ── Delete a session ─────────────────────────────────────────────────────────
  const handleDeleteSession = useCallback(
    async (e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation();
      if (!window.confirm("Delete this conversation? This cannot be undone.")) return;

      setIsDeletingSessionId(sessionId);
      try {
        await supabase.from("doubt_sessions").delete().eq("id", sessionId);

        setSessions((prev) => prev.filter((s) => s.id !== sessionId));

        // If deleted session was active, start new chat
        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
          setMessages([welcomeMessage]);
        }
      } finally {
        setIsDeletingSessionId(null);
      }
    },
    [supabase, activeSessionId, welcomeMessage]
  );

  // ── New Chat ─────────────────────────────────────────────────────────────────
  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
    setMessages([welcomeMessage]);
    setInputMessage("");
    setSelectedImage(null);
    setShowSidebar(false);
  }, [welcomeMessage]);

  // ── Delete current session messages (header trash icon) ──────────────────────
  const handleDeleteCurrentSession = useCallback(async () => {
    if (!activeSessionId) {
      // No active session — just reset to welcome
      setMessages([welcomeMessage]);
      return;
    }

    if (!window.confirm("Delete this conversation? This cannot be undone.")) return;

    await supabase.from("doubt_sessions").delete().eq("id", activeSessionId);
    setSessions((prev) => prev.filter((s) => s.id !== activeSessionId));
    setActiveSessionId(null);
    setMessages([welcomeMessage]);
  }, [supabase, activeSessionId, welcomeMessage]);

  // ── Image handling ───────────────────────────────────────────────────────────
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedImage({ file, base64: result, mimeType: file.type, previewUrl: result });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeSelectedImage = () => setSelectedImage(null);

  // ── Submit doubt ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedText = inputMessage.trim();
    if (!trimmedText && !selectedImage) return;

    const currentImage = selectedImage;
    const userMessageText = trimmedText || "Please analyze this image and explain/solve it.";

    // Upload image to storage if user is logged in and image is selected
    let publicImageUrl: string | undefined;
    if (currentUser && currentImage?.file) {
      try {
        const cleanName = currentImage.file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const storagePath = `${currentUser.id}/${Date.now()}-${cleanName}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("doubt-images")
          .upload(storagePath, currentImage.file, { upsert: false });

        if (!uploadErr && uploadData?.path) {
          const { data: urlData } = supabase.storage
            .from("doubt-images")
            .getPublicUrl(uploadData.path);
          publicImageUrl = urlData?.publicUrl || undefined;
        }
      } catch (err) {
        console.warn("Storage upload failed, using local preview:", err);
      }
    }

    const imagePreviewToStore = publicImageUrl || currentImage?.previewUrl;

    // Optimistically add user message to UI
    const tempId = Date.now().toString();
    const userMsgObj: Message = {
      id: tempId,
      role: "user",
      text: trimmedText,
      imagePreview: imagePreviewToStore,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsgObj]);
    setInputMessage("");
    setSelectedImage(null);
    setIsLoading(true);

    // If logged in, persist to Supabase
    let resolvedSessionId = activeSessionId;

    if (currentUser) {
      // Create a new session on first message
      if (!resolvedSessionId) {
        const sessionTitle = titleFromMessage(userMessageText);
        const { data: newSession, error: sessionErr } = await supabase
          .from("doubt_sessions")
          .insert({ student_id: currentUser.id, title: sessionTitle })
          .select("id")
          .single();

        if (!sessionErr && newSession) {
          resolvedSessionId = newSession.id;
          setActiveSessionId(newSession.id);
          // Add the new session to sidebar list at the top
          setSessions((prev) => [
            { id: newSession.id, title: sessionTitle, updated_at: new Date().toISOString() },
            ...prev,
          ]);
        }
      }

      // Insert user message row
      try {
        await supabase.from("doubt_messages").insert({
          student_id: currentUser.id,
          session_id: resolvedSessionId,
          role: "user",
          message: userMessageText,
          image_url: publicImageUrl || null,
        });
      } catch (err) {
        console.error("Failed to save user message:", err);
      }
    }

    // Build conversation history for the API
    const historyForApi = messages.map((msg) => ({
      role: msg.role,
      text: msg.text,
    }));

    try {
      const res = await fetch("/api/ask-doubt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessageText,
          imageBase64: currentImage?.base64 || undefined,
          imageMimeType: currentImage?.mimeType || undefined,
          conversationHistory: historyForApi,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get an answer from AI solver.");

      const aiReplyText =
        data.reply || "Sorry, I couldn't generate a response. Please try again.";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          text: aiReplyText,
          timestamp: new Date(),
        },
      ]);

      // Update session updated_at in sidebar
      if (resolvedSessionId) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === resolvedSessionId
              ? { ...s, updated_at: new Date().toISOString() }
              : s
          )
        );
      }

      // Save AI reply to Supabase
      if (currentUser && resolvedSessionId) {
        try {
          await supabase.from("doubt_messages").insert({
            student_id: currentUser.id,
            session_id: resolvedSessionId,
            role: "assistant",
            message: aiReplyText,
            image_url: null,
          });
        } catch (err) {
          console.error("Failed to save AI message:", err);
        }
      }
    } catch (err: any) {
      console.error("Error asking doubt:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          text: `⚠️ ${err.message || "Something went wrong. Please try again."}`,
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const quickQuestions = [
    "Explain Newton's 2nd Law with examples 🚀",
    "What is the difference between Sn1 and Sn2 reactions? 🧪",
    "How to solve quadratic equations quickly? 📐",
  ];

  // ────────────────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
        {!isOpen && (
          <div className="hidden sm:block text-xs font-medium bg-slate-900/90 text-sky-400 px-3 py-1.5 rounded-full border border-sky-500/30 shadow-lg backdrop-blur-md animate-bounce">
            Need help? Ask AI Doubt Solver ✨
          </div>
        )}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (isOpen) {
              setShowSidebar(false);
              setIsFullscreen(false);
            }
          }}
          aria-label="Toggle AI Doubt Solver"
          className="relative group p-4 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white shadow-xl shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
        >
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-sky-400 to-purple-600 opacity-70 blur group-hover:opacity-100 transition duration-300 animate-pulse" />
          <div className="relative flex items-center justify-center">
            {isOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <MessageCircle className="w-6 h-6 text-white" />
            )}
          </div>
        </button>
      </div>

      {/* Floating Chat Panel */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 bg-slate-950/98 text-slate-100 backdrop-blur-xl border flex overflow-hidden ${
            isFullscreen
              ? "inset-0 w-full h-full max-h-none rounded-none border-none"
              : "bottom-24 right-4 sm:right-6 left-4 sm:left-auto w-[calc(100vw-2rem)] sm:w-[420px] h-[75vh] sm:h-[580px] max-h-[65vh] sm:max-h-[65vh] border-slate-800/90 shadow-2xl rounded-2xl"
          }`}
          style={{ animation: isFullscreen ? "none" : "fadeSlideIn 0.25s ease-out both" }}
        >
          {/* ── Sidebar ────────────────────────────────────────────────────────── */}
          <div
            className={`flex-shrink-0 flex flex-col bg-slate-900/95 border-r border-slate-800 transition-all duration-300 overflow-hidden ${
              showSidebar
                ? isFullscreen
                  ? "w-72 sm:w-80"
                  : "w-[65%]"
                : "w-0"
            }`}
          >
            {showSidebar && (
              <>
                {/* Sidebar Header */}
                <div className="px-3 py-3 border-b border-slate-800 flex items-center justify-between gap-1.5">
                  <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
                    Conversations
                  </span>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

                {/* New Chat Button */}
                <button
                  onClick={handleNewChat}
                  className="mx-2.5 mt-2.5 mb-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 hover:bg-sky-500/25 transition-colors text-xs font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Chat
                </button>

                {/* Sessions List */}
                <div className="flex-1 overflow-y-auto py-1.5 space-y-0.5 scrollbar-thin px-1.5">
                  {sessions.length === 0 ? (
                    <div className="px-3 py-6 text-center text-[11px] text-slate-500">
                      No saved conversations yet.
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => handleSelectSession(session.id)}
                        className={`group flex items-start justify-between gap-1 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                          activeSessionId === session.id
                            ? "bg-sky-500/15 border border-sky-500/20"
                            : "hover:bg-slate-800/60"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-medium text-slate-200 truncate leading-snug">
                            {session.title}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {formatSessionDate(session.updated_at)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteSession(e, session.id)}
                          disabled={isDeletingSessionId === session.id}
                          className="shrink-0 mt-0.5 p-1 rounded-md text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                          title="Delete conversation"
                        >
                          {isDeletingSessionId === session.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── Main Chat Area ─────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Header */}
            <div className="px-3 py-3 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-xl bg-gradient-to-tr from-sky-500 to-purple-600 text-white shadow-md shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-xs text-slate-100 flex items-center gap-1.5 truncate">
                    Ask a Doubt 🤔
                    <span className="text-[9px] uppercase font-bold tracking-wider px-1 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 shrink-0">
                      AI Tutor
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-500 truncate">
                    {activeSessionId
                      ? (sessions.find((s) => s.id === activeSessionId)?.title ?? "Conversation")
                      : "Sachin Physics Classes"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                {/* History Sidebar Toggle */}
                {currentUser && (
                  <button
                    onClick={() => setShowSidebar((v) => !v)}
                    title="Chat History"
                    className={`p-1.5 rounded-lg transition-colors ${
                      showSidebar
                        ? "text-sky-400 bg-sky-500/10"
                        : "text-slate-400 hover:text-sky-300 hover:bg-slate-800/60"
                    }`}
                  >
                    <History className="w-4 h-4" />
                  </button>
                )}
                {/* Fullscreen toggle */}
                <button
                  onClick={() => setIsFullscreen((v) => !v)}
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isFullscreen
                      ? "text-sky-400 bg-sky-500/10"
                      : "text-slate-400 hover:text-sky-300 hover:bg-slate-800/60"
                  }`}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
                {/* Delete current session */}
                <button
                  onClick={handleDeleteCurrentSession}
                  title="Delete this conversation"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {/* Close panel */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowSidebar(false);
                    setIsFullscreen(false);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Guest Notice Banner */}
            {isAuthLoaded && !currentUser && (
              <div className="px-3.5 py-2 bg-indigo-950/40 border-b border-indigo-500/20 text-[11px] text-indigo-200 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <LogIn className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Log in to save your doubt history.</span>
                </span>
                <Link
                  href="/login"
                  className="underline font-semibold text-sky-400 hover:text-sky-300 shrink-0"
                >
                  Log In
                </Link>
              </div>
            )}

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-700">
              {isFetchingHistory ? (
                <div className="py-8 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
                  <span>Loading conversation...</span>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 ${
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white"
                          : "bg-gradient-to-br from-sky-500 to-purple-600 text-white"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <User className="w-3.5 h-3.5" />
                      ) : (
                        <Bot className="w-3.5 h-3.5" />
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-tr-none shadow-md"
                          : msg.isError
                          ? "bg-rose-950/60 border border-rose-800/60 text-rose-200 rounded-tl-none"
                          : "bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm"
                      }`}
                    >
                      {msg.imagePreview && (
                        <div className="mb-2 overflow-hidden rounded-lg border border-slate-700/60">
                          <img
                            src={msg.imagePreview}
                            alt="Doubt image"
                            className="max-h-40 w-full object-cover"
                          />
                        </div>
                      )}
                      {msg.text && (
                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      )}
                      <span
                        className={`block text-[9px] mt-1 text-right ${
                          msg.role === "user" ? "text-sky-200/60" : "text-slate-500"
                        }`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}

              {/* Quick Questions (shown only on fresh new chat) */}
              {!isFetchingHistory && messages.length === 1 && !activeSessionId && (
                <div className="pt-1">
                  <p className="text-[10px] font-medium text-slate-400 mb-2">Try asking:</p>
                  <div className="space-y-1.5">
                    {quickQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInputMessage(q)}
                        className="w-full text-left text-[11px] bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-sky-300 px-2.5 py-2 rounded-xl transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs text-slate-400 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                    <span>AI Tutor is thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Image Thumbnail Preview */}
            {selectedImage && (
              <div className="px-3.5 py-2 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-md overflow-hidden border border-sky-500/40">
                    <img
                      src={selectedImage.previewUrl}
                      alt="Attachment preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs text-slate-300">Image attached</span>
                </div>
                <button
                  type="button"
                  onClick={removeSelectedImage}
                  className="p-1 rounded-full text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={handleSubmit}
              className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex items-end gap-2"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach image"
                className={`p-2 rounded-xl border transition-colors ${
                  selectedImage
                    ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                    : "bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700/60"
                }`}
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your doubt or question..."
                rows={1}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500/60 resize-none max-h-24 scrollbar-thin"
              />

              <button
                type="submit"
                disabled={isLoading || (!inputMessage.trim() && !selectedImage)}
                className="p-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
