"use client"

import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { PlusCircle, MessageSquare, LogOut } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

type Chat = {
  _id: string
  title: string
  createdAt: string
}

export function AppSidebar() {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)

  useEffect(() => {
    fetchChats()

    // Listen for chats created from the main page
    const handleChatCreated = (e: CustomEvent<Chat>) => {
      setChats(prev => [e.detail, ...prev])
      setCurrentChatId(e.detail._id)
    }

    window.addEventListener("chatCreated", handleChatCreated as EventListener)
    return () => {
      window.removeEventListener("chatCreated", handleChatCreated as EventListener)
    }
  }, [])

  const fetchChats = async () => {
    try {
      const res = await fetch("/api/chats")
      if (res.ok) {
        const data = await res.json()
        setChats(data)
        if (data.length > 0 && !currentChatId) {
          setCurrentChatId(data[0]._id)
          // Dispatch event to notify page of chat selection
          window.dispatchEvent(new CustomEvent("chatSelected", { detail: data[0]._id }))
        }
      }
    } catch (error) {
      console.error("Failed to fetch chats", error)
    }
  }

  const createNewChat = async () => {
    try {
      const res = await fetch("/api/chats", { method: "POST" })
      if (res.ok) {
        const newChat = await res.json()
        setChats([newChat, ...chats])
        setCurrentChatId(newChat._id)
        window.dispatchEvent(new CustomEvent("chatSelected", { detail: newChat._id }))
      }
    } catch (error) {
      console.error("Failed to create chat", error)
    }
  }

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId)
    window.dispatchEvent(new CustomEvent("chatSelected", { detail: chatId }))
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MessageSquare className="h-4 w-4" />
          </div>
          <span className="font-semibold">NotebookLM</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <Button
              onClick={createNewChat}
              className="w-full justify-start gap-2"
              variant="outline"
            >
              <PlusCircle className="h-4 w-4" />
              New Chat
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.map((chat) => (
                <SidebarMenuItem key={chat._id}>
                  <SidebarMenuButton
                    onClick={() => handleChatSelect(chat._id)}
                    isActive={currentChatId === chat._id}
                    className="truncate"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span className="truncate">{chat.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {chats.length === 0 && (
                <p className="px-2 py-4 text-sm text-muted-foreground text-center">
                  No chats yet. Create one to get started!
                </p>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => {
                await signOut({ redirectTo: "/login" })
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}