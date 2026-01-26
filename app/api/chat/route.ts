import { streamText } from "ai";
import { queryVectorStore } from "@/lib/vector-store";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Chat from "@/models/Chat";
import {
  addMemory,
  searchMemories,
  formatMemoriesAsContext,
} from "@/lib/memory";

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
  console.log("Messages received:", messages.length);
  
  const lastMessage = messages[messages.length - 1];
  const userQuery =
    lastMessage.parts.find((part: any) => part.type === "text")?.text || "";

  try {
    await addMemory(userQuery, chatId, "user");
    console.log("User query added to memory");
  } catch (error) {
    console.error("Failed to add user query to memory:", error);
  }

  let memoryContext = "";
  try {
    const relevantMemories = await searchMemories(userQuery, chatId, 5);
    memoryContext = formatMemoriesAsContext(relevantMemories);
    console.log("Memory context:", memoryContext);
  } catch (error) {
    console.error("Failed to search memories:", error);
  }

  let documentContext = "";
  try {
    const contextDocs = await queryVectorStore(userQuery, 4, chatId);
    documentContext = contextDocs.map((doc) => doc.pageContent).join("\n---\n");
  } catch (error) {
    console.error("Vector store query error:", error);
  }

  let contextSection = "";
  if (memoryContext) {
    contextSection += memoryContext + "\n\n";
  }
  if (documentContext) {
    contextSection += `Context from uploaded documents:\n${documentContext}\n\n`;
  }

 
  const promptWithContext = contextSection
    ? `${contextSection}User question: ${userQuery}`
    : userQuery;
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
  console.log("Prompt with context:", promptWithContext);
  const result = streamText({
    model: selectedModel,
    system:
      "You are a helpful assistant. Answer the user's questions based on the provided context which may include memories from previous conversations and content from uploaded documents. If no relevant context is provided, don't answer the question. Be conversational and helpful.",
    messages: [
      {
        role: "user",
        content: promptWithContext,
      },
    ],
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

      try {
        await addMemory(result.text, chatId, "assistant");
        console.log("Assistant response added to memory");
      } catch (error) {
        console.error("Failed to add assistant response to memory:", error);
      }
    },
  });
  return result.toUIMessageStreamResponse();
}
