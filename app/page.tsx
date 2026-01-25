"use client";

import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const router = useRouter();

  const createNewChat = async () => {
    try {
      const res = await fetch("/api/chats", { method: "POST" });
      if (res.ok) {
        const newChat = await res.json();
        window.dispatchEvent(new CustomEvent("chatCreated", { detail: newChat }));
        router.push(`/c/${newChat._id}`);
      }
    } catch (error) {
      console.error("Failed to create chat", error);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex items-center justify-center h-full w-full text-muted-foreground">
        <div className="text-center max-w-md px-4">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <PlusCircle className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-foreground">
            Welcome to NotebookLM Clone
          </h2>
          <p className="mb-6 text-muted-foreground">
            Select a chat from the sidebar or create a new one to get started with AI-powered document analysis.
          </p>
          <Button
            onClick={createNewChat}
            size="lg"
            className="gap-2"
          >
            <PlusCircle className="h-5 w-5" />
            Create New Chat
          </Button>
        </div>
      </div>
    </div>
  );
}
