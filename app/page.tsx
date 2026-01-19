"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { DefaultChatTransport } from "ai";

type Chat = {
  _id: string;
  title: string;
  createdAt: string;
};

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const res = await fetch("/api/chats");
      if (res.ok) {
        const data = await res.json();
        setChats(data);
        if (data.length > 0 && !currentChatId) {
          handleChatSelect(data[0]._id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch chats", error);
    }
  };

  const createNewChat = async () => {
    try {
      const res = await fetch("/api/chats", { method: "POST" });
      if (res.ok) {
        const newChat = await res.json();
        setChats([newChat, ...chats]);
        handleChatSelect(newChat._id);
      }
    } catch (error) {
      console.error("Failed to create chat", error);
    }
  };

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${isSidebarOpen ? "w-64" : "w-0"} bg-gray-900 text-white transition-all duration-300 flex flex-col overflow-hidden`}
      >
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h1 className="font-bold text-lg">NotebookLM Clone</h1>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
            X
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={createNewChat}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 transition-colors"
          >
            <span>+</span> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {chats.map((chat) => (
            <button
              key={chat._id}
              onClick={() => handleChatSelect(chat._id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                currentChatId === chat._id
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {chat.title}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-gray-800">
          <form
            action={async () => {
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="w-full text-left text-gray-400 hover:text-white text-sm flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign Out
            </button>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Toggle Sidebar Button (Mobile) */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-md shadow-md"
          >
            <svg
              className="w-6 h-6 text-gray-600 dark:text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}

        {/* Content Area */}
        {currentChatId ? (
          <ChatInterface key={currentChatId} chatId={currentChatId} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">
                Welcome to NotebookLM Clone
              </h2>
              <p className="mb-8">
                Select a chat from the sidebar or create a new one to get
                started.
              </p>
              <button
                onClick={createNewChat}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6 py-3 transition-colors"
              >
                Create New Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatInterface({ chatId }: { chatId: string }) {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [input, setInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initial load of messages
  const [initialMessages, setInitialMessages] = useState<any[]>([]);

  useEffect(() => {
    const loadChat = async () => {
      try {
        const res = await fetch(`/api/chats/${chatId}`);
        if (res.ok) {
          const data = await res.json();
          const uiMessages = data.messages.map((msg: any) => ({
            id: msg._id,
            role: msg.role,
            content: msg.content,
            parts: [{ type: "text", text: msg.content }],
          }));
          setInitialMessages(uiMessages);
          const sources = data.sources.map((s: any) => s.name);
          setUploadedFiles(sources);
        }
      } catch (error) {
        console.error("Failed to load chat details", error);
      }
    };
    loadChat();
  }, [chatId]);

  const { messages, setMessages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        chatId: chatId,
      },
    }),
    onFinish: () => {
      setIsLoading(false);
    },
  });

  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages, setMessages]);

  useEffect(() => {
    if (status === "streaming" || status === "submitted") {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [status]);

  const handleFileUpload = async (file: File) => {
    if (!file.type.includes("pdf")) {
      alert("Please upload a PDF file");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("chatId", chatId);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setUploadedFiles((prev) => [...prev, file.name]);
      } else {
        alert("Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlUpload = async (url: string) => {
    if (!url) return;
    setIsUploading(true);
    try {
      const res = await fetch("/api/upload/url", {
        method: "POST",
        body: JSON.stringify({ url, chatId }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setUploadedFiles((prev) => [...prev, url]);
      } else {
        alert("URL upload failed");
      }
    } catch (error) {
      console.error("URL upload error:", error);
      alert("URL upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteSource = async (fileName: string) => {
    if (!confirm(`Delete ${fileName}?`)) return;
    try {
      const res = await fetch("/api/delete", {
        method: "POST",
        body: JSON.stringify({ fileName, chatId }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setUploadedFiles((prev) => prev.filter((f) => f !== fileName));
      } else {
        alert("Delete failed");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Delete failed");
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      content: input,
      parts: [{ type: "text", text: input }],
    };

    setIsLoading(true);
    // @ts-ignore
    await sendMessage(userMessage);
    setInput("");
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-col flex-1 h-full max-w-6xl mx-auto w-full p-4 lg:p-6 gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          <div className="lg:col-span-1 flex flex-col gap-4 max-h-full overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
                Sources
              </h2>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) =>
                  e.target.files?.[0] && handleFileUpload(e.target.files[0])
                }
                className="hidden"
              />

              <div className="space-y-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 rounded-xl p-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium text-sm"
                >
                  {isUploading ? (
                    <span>Uploading...</span>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                      <span>Upload PDF</span>
                    </>
                  )}
                </button>

                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Add URL source..."
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        const target = e.target as HTMLInputElement;
                        if (target.value) {
                          await handleUrlUpload(target.value);
                          target.value = "";
                        }
                      }
                    }}
                  />
                  <button
                    onClick={async () => {
                      const input = document.querySelector(
                        'input[type="url"]',
                      ) as HTMLInputElement;
                      if (input?.value) {
                        await handleUrlUpload(input.value);
                        input.value = "";
                      }
                    }}
                    disabled={isUploading}
                    className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-700 dark:text-gray-300 group"
                  >
                    <div className="flex items-center gap-2 truncate flex-1 leading-tight">
                      {file.startsWith("http") ? (
                        <svg
                          className="w-4 h-4 text-blue-500 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 text-red-500 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                        </svg>
                      )}
                      <span className="truncate" title={file}>
                        {file}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteSource(file)}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      title="Delete source"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    }`}
                  >
                    {/* @ts-ignore */}
                    {message.parts
                      ? message.parts.map((part, i) => {
                          if (part.type === "text") {
                            return (
                              <div
                                key={`${message.id}-${i}`}
                                className="whitespace-pre-wrap"
                              >
                                {part.text}
                              </div>
                            );
                          }
                          return null;
                        })
                      : null}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3">
                    Typing...
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={handleSend}
              className="p-4 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="flex gap-2">
                <input
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-gray-100"
                  value={input}
                  placeholder="Type a message..."
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
