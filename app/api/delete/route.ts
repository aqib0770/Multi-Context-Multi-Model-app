
import { deletePointFromCollection } from "@/lib/vector-store";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Chat from "@/models/Chat";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
  }

  const { fileName, chatId } = await req.json();

  if (!fileName) {
    return new Response("No fileName provided", { status: 400 });
  }
  if (!chatId) {
    return new Response("Chat ID is required", { status: 400 });
  }

  try {
    await deletePointFromCollection(fileName, chatId);
    
    await dbConnect();
    await Chat.findByIdAndUpdate(chatId, {
        $pull: {
            sources: {
                name: fileName
            }
        }
    });

    return new Response("Document deleted", { status: 200 });
  } catch (error) {
    console.error("Error deleting document:", error);
    return new Response("Error deleting document", { status: 500 });
  }
}
