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
import { z } from "zod";

const chatRequestSchema = z.object({
  messages: z.array(z.any()),
  chatId: z.string().min(1, "Chat ID is required"),
  model: z.string().optional().default("mistral/mistral-nemo"),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const parseResult = chatRequestSchema.safeParse(json);

    if (!parseResult.success) {
      return new Response(parseResult.error.message, { status: 400 });
    }

    const { messages, chatId, model } = parseResult.data;
    const selectedModel = model;

    console.log(
      `[Chat] Processing request for chat ${chatId} with model ${selectedModel}`,
    );

    const lastMessage = messages[messages.length - 1];
    let userQuery = "";

    if (lastMessage.content) {
      userQuery = lastMessage.content;
    } else if (lastMessage.parts) {
      userQuery =
        lastMessage.parts.find((part: any) => part.type === "text")?.text || "";
    }

    if (!userQuery) {
      return new Response("No user userQuery found in the last message", {
        status: 400,
      });
    }

    try {
      await addMemory(userQuery, chatId, "user");
      console.log(`[Memory] User query added for ${chatId}`);
    } catch (error) {
      console.error(`[Memory] Failed to add user query for ${chatId}:`, error);
    }

    let memoryContext = "";
    try {
      const relevantMemories = await searchMemories(userQuery, chatId, 5);
      memoryContext = formatMemoriesAsContext(relevantMemories);
      console.log(
        `[Memory] Found ${relevantMemories.length} relevant memories`,
      );
    } catch (error) {
      console.error(`[Memory] Failed to search memories for ${chatId}:`, error);
    }

    let documentContext = "";
    try {
      const contextDocs = await queryVectorStore(userQuery, 4, chatId);
      documentContext = contextDocs
        .map((doc) => doc.pageContent)
        .join("\n---\n");
      console.log(
        `[VectorStore] Found context of length ${documentContext.length}`,
      );
    } catch (error) {
      console.error(`[VectorStore] Query error for ${chatId}:`, error);
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
      console.log(`[DB] User message saved for ${chatId}`);
    } catch (error) {
      console.error(`[DB] Error saving user message for ${chatId}`, error);
    }

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
          console.log(`[DB] Assistant message saved for ${chatId}`);
        } catch (error) {
          console.error(
            `[DB] Error saving assistant message for ${chatId}`,
            error,
          );
        }

        try {
          await addMemory(result.text, chatId, "assistant");
          console.log(`[Memory] Assistant response added for ${chatId}`);
        } catch (error) {
          console.error(
            `[Memory] Failed to add assistant response for ${chatId}:`,
            error,
          );
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error("[Chat] Internal Server Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
