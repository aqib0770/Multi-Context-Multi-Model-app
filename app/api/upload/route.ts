import { embedPDF } from "@/lib/vector-store";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Chat from "@/models/Chat";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const chatId = formData.get("chatId") as string;

  if (!file) {
    return new Response("No file provided", { status: 400 });
  }
  if (!chatId) {
    return new Response("Chat ID is required", { status: 400 });
  }

  const fileObject = file as File;
  await embedPDF(fileObject, fileObject.name, chatId);

  try {
    await dbConnect();
    await Chat.findByIdAndUpdate(chatId, {
      $push: {
        sources: {
          name: fileObject.name,
          type: "pdf",
        },
      },
    });
  } catch (error) {
    console.error("Error saving source to DB", error);
  }

  return new Response("PDF indexed", { status: 200 });
}
