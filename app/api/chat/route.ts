import { streamText, UIMessage, convertToModelMessages } from "ai";
import { queryVectorStore } from "@/lib/vector-store";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Chat from "@/models/Chat";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { messages, chatId, model } = await req.json();
  if (!chatId) {
    return new Response("Chat ID is required", { status: 400 });
  }
  const selectedModel = model || "mistral/mistral-nemo";

  const lastMessage = messages[messages.length - 1];
  const userQuery =
    lastMessage.parts.find((part: any) => part.type === "text")?.text || "";

  let contextText = "";
  try {
    const contextDocs = await queryVectorStore(userQuery, 4, chatId);
    contextText = contextDocs.map((doc) => doc.pageContent).join("\n---\n");
  } catch (error) {
    console.error("Vector store query error:", error);
  }

  if (contextText && lastMessage.parts[0].type === "text") {
    const contextPrompt = `Context from uploaded documents:${contextText}
        User question: ${lastMessage.parts[0].text}`;

    lastMessage.parts[0].text = contextPrompt;
  }

  try {
    await dbConnect();
    await Chat.findByIdAndUpdate(chatId, {
      $push: {
        messages: {
          role: "user",
          content: userQuery,
        },
      },
    });
    console.log("User message saved to DB");
  } catch (error) {
    console.error("Error saving user message to DB", error);
  }

  const result = streamText({
    model: selectedModel,
    system:
      "You are a helpful assistant. Answer the user's questions based on the provided context from uploaded documents. If no context is provided, answer based on your general knowledge.",
    messages: await convertToModelMessages(messages),
    onFinish: async (result) => {
      try {
        await dbConnect();
        await Chat.findByIdAndUpdate(chatId, {
          $push: {
            messages: {
              role: "assistant",
              content: result.text,
            },
          },
        });
      } catch (error) {
        console.error("Error saving assistant message to DB", error);
      }
    },
  });
  return result.toUIMessageStreamResponse();
}
