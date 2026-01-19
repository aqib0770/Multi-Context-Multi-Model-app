import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Chat from '@/models/Chat';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { chatId } = await params;

  try {
    await dbConnect();
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // @ts-ignore
    if (chat.userId.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 });
  }
}
