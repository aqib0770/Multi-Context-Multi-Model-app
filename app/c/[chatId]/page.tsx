"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useEffect, use, useRef } from "react";
import { AVAILABLE_MODELS, DEFAULT_MODEL } from "@/lib/models";
import { DefaultChatTransport } from "ai";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
  MessageToolbar,
} from "@/components/ai-elements/message";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorLogoGroup,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckIcon,
  CopyIcon,
  FileIcon,
  FolderIcon,
  LinkIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

interface Source {
  name: string;
  type: "pdf" | "url";
}

export default function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = use(params);

  return (
    <div className="flex h-full overflow-hidden">
      <ChatInterface key={chatId} chatId={chatId} />
    </div>
  );
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts?: { type: "text"; text: string }[];
}

function ChatInterface({ chatId }: { chatId: string }) {
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadChat = async () => {
      try {
        const res = await fetch(`/api/chats/${chatId}`);
        if (res.ok) {
          const data = await res.json();
          const uiMessages: ChatMessage[] = data.messages.map((msg: any) => ({
            id: msg._id,
            role: msg.role,
            content: msg.content,
            parts: [{ type: "text", text: msg.content }],
          }));
          setInitialMessages(uiMessages);
          if (data.sources) {
            setSources(data.sources);
          }
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
    onFinish: () => {},
  });

  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages as any);
    }
  }, [initialMessages, setMessages]);

  const getMessageText = (message: (typeof messages)[0]) => {
    const textPart = message.parts.find((part) => part.type === "text");
    return textPart?.type === "text" ? textPart.text : "";
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleSend = async (message: PromptInputMessage) => {
    const text = message.text;
    if (!text.trim()) return;

    const userMessage = {
      role: "user",
      content: text,
      parts: [{ type: "text", text: text }],
    };

    // @ts-ignore
    await sendMessage(userMessage, {
      body: { model: selectedModel },
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("pdf")) {
      alert("Please upload a PDF file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("chatId", chatId);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setSources((prev) => [...prev, { name: file.name, type: "pdf" }]);
      } else {
        const error = await res.text();
        alert(`Upload failed: ${error}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUrlUpload = async () => {
    if (!urlInput.trim()) return;

    setIsUploading(true);
    try {
      const res = await fetch("/api/upload/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput, chatId }),
      });

      if (res.ok) {
        setSources((prev) => [...prev, { name: urlInput, type: "url" }]);
        setUrlInput("");
      } else {
        const error = await res.text();
        alert(`URL upload failed: ${error}`);
      }
    } catch (error) {
      console.error("URL upload error:", error);
      alert("URL upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteSource = async (sourceName: string) => {
    if (!confirm(`Delete "${sourceName}"?`)) return;

    try {
      const res = await fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: sourceName, chatId }),
      });

      if (res.ok) {
        setSources((prev) => prev.filter((s) => s.name !== sourceName));
      } else {
        alert("Delete failed");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Delete failed");
    }
  };

  const selectedModelData = AVAILABLE_MODELS.find(
    (m) => m.id === selectedModel,
  );
  const isLoading = status === "streaming" || status === "submitted";

  return (
    <div className="relative flex size-full flex-col divide-y overflow-hidden">
      <Conversation>
        <ConversationContent>
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const content = getMessageText(message);
              return (
                <Message
                  from={message.role === "user" ? "user" : "assistant"}
                  key={message.id}
                >
                  <MessageContent className="text-base">
                    {message.role === "assistant" ? (
                      <MessageResponse>{content}</MessageResponse>
                    ) : (
                      content
                    )}
                  </MessageContent>
                  {message.role === "assistant" && (
                    <MessageToolbar>
                      <MessageActions>
                        <MessageAction
                          label="Copy"
                          onClick={() => handleCopy(content)}
                          tooltip="Copy to clipboard"
                        >
                          <CopyIcon className="size-4" />
                        </MessageAction>
                      </MessageActions>
                    </MessageToolbar>
                  )}
                </Message>
              );
            })
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="grid shrink-0 gap-4 pt-4">
        <div className="w-full px-4 pb-4">
          <PromptInputProvider>
            <PromptInput onSubmit={handleSend}>
              <PromptInputBody>
                <PromptInputTextarea />
              </PromptInputBody>
              <PromptInputFooter>
                <PromptInputTools>
                  <Sheet open={sourcesOpen} onOpenChange={setSourcesOpen}>
                    <SheetTrigger asChild>
                      <PromptInputButton>
                        <FolderIcon className="size-4" />
                        <span>Sources</span>
                        {sources.length > 0 && (
                          <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                            {sources.length}
                          </span>
                        )}
                      </PromptInputButton>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Sources</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6 flex flex-col gap-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="flex-1"
                          >
                            {isUploading ? (
                              <Loader2Icon className="mr-2 size-4 animate-spin" />
                            ) : (
                              <FileIcon className="mr-2 size-4" />
                            )}
                            Upload PDF
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter URL..."
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleUrlUpload();
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleUrlUpload}
                            disabled={isUploading || !urlInput.trim()}
                          >
                            {isUploading ? (
                              <Loader2Icon className="size-4 animate-spin" />
                            ) : (
                              <PlusIcon className="size-4" />
                            )}
                          </Button>
                        </div>

                        <div className="mt-4">
                          <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                            {sources.length === 0
                              ? "No sources added yet"
                              : `${sources.length} source${sources.length > 1 ? "s" : ""}`}
                          </h4>
                          <div className="flex flex-col gap-2">
                            {sources.map((source) => (
                              <div
                                key={source.name}
                                className="flex items-center justify-between rounded-lg border p-3"
                              >
                                <div className="flex min-w-0 items-center gap-2">
                                  {source.type === "pdf" ? (
                                    <FileIcon className="size-4 shrink-0 text-red-500" />
                                  ) : (
                                    <LinkIcon className="size-4 shrink-0 text-blue-500" />
                                  )}
                                  <span className="truncate text-sm">
                                    {source.name}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleDeleteSource(source.name)
                                  }
                                  className="shrink-0"
                                >
                                  <Trash2Icon className="size-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>

                  <ModelSelector
                    onOpenChange={setModelSelectorOpen}
                    open={modelSelectorOpen}
                  >
                    <ModelSelectorTrigger asChild>
                      <PromptInputButton>
                        {selectedModelData?.provider && (
                          <ModelSelectorLogo
                            provider={selectedModelData.provider.toLowerCase()}
                          />
                        )}
                        {selectedModelData?.name && (
                          <ModelSelectorName>
                            {selectedModelData.name}
                          </ModelSelectorName>
                        )}
                      </PromptInputButton>
                    </ModelSelectorTrigger>
                    <ModelSelectorContent>
                      <ModelSelectorInput placeholder="Search models..." />
                      <ModelSelectorList>
                        <ModelSelectorEmpty>
                          No models found.
                        </ModelSelectorEmpty>
                        {Array.from(
                          new Set(AVAILABLE_MODELS.map((m) => m.provider)),
                        ).map((provider) => (
                          <ModelSelectorGroup heading={provider} key={provider}>
                            {AVAILABLE_MODELS.filter(
                              (m) => m.provider === provider,
                            ).map((m) => (
                              <ModelSelectorItem
                                key={m.id}
                                onSelect={() => {
                                  setSelectedModel(m.id);
                                  setModelSelectorOpen(false);
                                }}
                                value={m.id}
                              >
                                <ModelSelectorLogo
                                  provider={m.provider.toLowerCase()}
                                />
                                <ModelSelectorName>{m.name}</ModelSelectorName>
                                <ModelSelectorLogoGroup>
                                  <ModelSelectorLogo
                                    provider={m.provider.toLowerCase()}
                                  />
                                </ModelSelectorLogoGroup>
                                {selectedModel === m.id ? (
                                  <CheckIcon className="ml-auto size-4" />
                                ) : (
                                  <div className="ml-auto size-4" />
                                )}
                              </ModelSelectorItem>
                            ))}
                          </ModelSelectorGroup>
                        ))}
                      </ModelSelectorList>
                    </ModelSelectorContent>
                  </ModelSelector>
                </PromptInputTools>
                <PromptInputSubmit status={isLoading ? "streaming" : "ready"} />
              </PromptInputFooter>
            </PromptInput>
          </PromptInputProvider>
        </div>
      </div>
    </div>
  );
}
