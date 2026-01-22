export type Model = {
  id: string;
  name: string;
  provider: string;
};

export const AVAILABLE_MODELS: Model[] = [
  { id: "mistral/mistral-nemo", name: "Mistral Nemo", provider: "Mistral" },
  { id: "mistral/ministral-3b", name: "Ministral 3B", provider: "Mistral" },
  { id: "mistral/ministral-8b", name: "Ministral 8B", provider: "Mistral" },
  { id: "meta/llama-3.1-8b", name: "Llama 3.1 8B", provider: "Meta" },
  { id: "meta/llama-3.2-1b", name: "Llama 3.2 1B", provider: "Meta" },
  { id: "amazon/nova-micro", name: "Nova Micro", provider: "Amazon" },
  { id: "nvidia/nemotron-3-nano-30b-a3b", name: "Nemotron 3 Nano", provider: "NVIDIA" },
  { id: "google/gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite", provider: "Google" },
  { id: "openai/gpt-5-nano", name: "GPT-5 Nano", provider: "OpenAI" },
];

export const DEFAULT_MODEL = "mistral/mistral-nemo";
