import { embedURL } from "@/lib/vector-store"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import Chat from "@/models/Chat"

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
  }

  const { url, chatId } = await req.json();

  if (!url) {
    return new Response("No URL provided", { status: 400 });
  }
  if (!chatId) {
      return new Response("Chat ID is required", { status: 400 });
  }

  await embedURL(url, url, chatId);

  try {
      await dbConnect();
      await Chat.findByIdAndUpdate(chatId, {
          $push: {
              sources: {
                  name: url,
                  type: 'url'
              }
          }
      });
  } catch (error) {
      console.error("Error saving source to DB", error);
  }

  return new Response("URL indexed", { status: 200 });
}
