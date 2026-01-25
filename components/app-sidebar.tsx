"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { PlusCircle, MessageSquare, LogOut, Trash2, User2, ChevronUp } from "lucide-react"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Chat = {
  _id: string
  title: string
  createdAt: string
}

export function AppSidebar() {
  const [chats, setChats] = useState<Chat[]>([])
  const router = useRouter()
  const pathname = usePathname()
  const currentChatId = pathname?.startsWith("/c/") ? pathname.split("/c/")[1] : null

  const { data: session } = useSession()
  const name = session?.user?.name
  const image = session?.user?.image
  useEffect(() => {
    fetchChats()

    const handleChatCreated = (e: CustomEvent<Chat>) => {
      setChats(prev => [e.detail, ...prev])
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
      router.push(`/c/${newChat._id}`)
      }
    } catch (error) {
      console.error("Failed to create chat", error)
    }
  }

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm("Are you sure you want to delete this chat?")) return

    try {
      const res = await fetch(`/api/chats/${chatId}`, { method: "DELETE" })
      if (res.ok) {
        setChats(prev => prev.filter(c => c._id !== chatId))
      if (currentChatId === chatId) {
        router.push("/")
      }
    } else {
        alert("Failed to delete chat")
      }
    } catch (error) {
      console.error("Failed to delete chat", error)
      alert("Failed to delete chat")
    }
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
                    asChild
                    isActive={currentChatId === chat._id}
                  >
                    <Link href={`/c/${chat._id}`}>
                      <MessageSquare className="h-4 w-4" />
                      <span className="truncate">{chat.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    onClick={(e) => deleteChat(chat._id, e)}
                    showOnHover
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete chat</span>
                  </SidebarMenuAction>
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
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton variant="outline">
                    <Avatar>
  <AvatarImage src={image || ""} />
  <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
</Avatar> {name}
                    
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  className="w-[--radix-popper-anchor-width]"
                >
                  <DropdownMenuItem onClick={() => signOut()}>
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}