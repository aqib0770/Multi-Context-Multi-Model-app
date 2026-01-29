import { embedURL } from "@/lib/vector-store";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Chat from "@/models/Chat";

import { z } from "zod";

const urlSchema = z.object({
  url: z.url("Invalid URL format"),
  chatId: z.string().min(1, "Chat ID is required"),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const parseResult = urlSchema.safeParse(json);

    if (!parseResult.success) {
      return new Response(parseResult.error.message, { status: 400 });
    }

    const { url, chatId } = parseResult.data;

    try {
      await embedURL(url, url, chatId);

      try {
        await dbConnect();
        await Chat.findByIdAndUpdate(chatId, {
          $push: {
            sources: {
              name: url,
              type: "url",
            },
          },
        });
      } catch (error) {
        console.error("Error saving source to DB", error);
      }

      return new Response("URL indexed", { status: 200 });
    } catch (error) {
      console.error("Error embedding URL:", error);
      return new Response("Failed to process URL", { status: 500 });
    }
  } catch (error) {
    console.error("Internal Server Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
