import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Chat from "@/models/Chat";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const chat = await Chat.create({
      // @ts-ignore
      userId: session.user.id,
      title: "New Chat",
      messages: [],
      sources: [],
    });

    return NextResponse.json(chat);
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    // @ts-ignore
    const chats = await Chat.find({ userId: session.user.id }).sort({
      updatedAt: -1,
    });
    console.log("Chats",chats);
    return NextResponse.json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 },
    );
  }
}
