import { MemoryClient, Message, Memory } from "mem0ai";

let memoryClientInstance: MemoryClient | null = null;

export function getMemoryClient(): MemoryClient {
  if (!memoryClientInstance) {
    const apiKey = process.env.MEM0_API_KEY;
    if (!apiKey) {
      throw new Error("MEM0_API_KEY environment variable is not set");
    }
    memoryClientInstance = new MemoryClient({ apiKey });
  }
  return memoryClientInstance;
}

export async function addMemory(
  content: string,
  chatId: string,
  role: "user" | "assistant" = "user"
): Promise<Memory[]> {
  const client = getMemoryClient();
  const messages: Message[] = [{ role, content }];

  try {
    const result = await client.add(messages, { user_id: chatId });
    console.log(`Memory added for chat ${chatId}:`, result);
    return result;
  } catch (error) {
    console.error("Error adding memory:", error);
    throw error;
  }
}
export async function searchMemories(
  query: string,
  chatId: string,
  limit: number = 5
): Promise<Memory[]> {
  const client = getMemoryClient();

  try {
    const results = await client.search(query, {
      user_id: chatId,
      limit,
    });
    console.log(`Found ${results.length} memories for chat ${chatId}`);
    return results;
  } catch (error) {
    console.error("Error searching memories:", error);
    return [];
  }
}

export function formatMemoriesAsContext(memories: Memory[]): string {
  if (!memories || memories.length === 0) {
    return "";
  }

  const memoryTexts = memories
    .map((mem) => mem.memory || mem.data?.memory)
    .filter(Boolean);

  if (memoryTexts.length === 0) {
    return "";
  }

  return `Relevant memories from previous conversations:\n${memoryTexts.join("\n- ")}`;
}
