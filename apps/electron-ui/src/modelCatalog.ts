// apps/electron-ui/src/modelCatalog.ts

export type ModelInfo = {
  id: string;
  name: string;
  size: string;
  description: string;
  filename: string;
  url: string; // direct download link to .gguf
};

export const MODEL_CATALOG: ModelInfo[] = [
  {
    id: "deepseek-1.3b-q4",
    name: "DeepSeek Coder 1.3B Instruct (Q4)",
    size: "~1.6 GB",
    description: "Fast CPU-friendly code assistant.",
    filename: "deepseek-coder-1.3b-instruct.Q4_K_M.gguf",
    // TODO: replace with the actual direct GGUF URL you choose
    url: "https://huggingface.co/unsloth/DeepSeek-Coder-1.3B-Instruct-GGUF/resolve/main/deepseek-coder-1.3b-instruct.Q4_K_M.gguf",
  },
  {
    id: "codegemma-2b-q4",
    name: "CodeGemma 2B Instruct (Q4)",
    size: "~2.0 GB",
    description: "Balanced coding + chat model.",
    filename: "codegemma-2b-instruct.Q4_K_M.gguf",
    // TODO: replace with actual GGUF URL for codegemma
    url: "https://huggingface.co/your-user-or-org/codegemma-2b-instruct.Q4_K_M.gguf",
  },
  {
    id: "llama3-8b-q4",
    name: "Llama 3.1 8B Instruct (Q4)",
    size: "~5–6 GB",
    description: "Slower but smarter general assistant.",
    filename: "llama-3.1-8b-instruct.Q4_K_M.gguf",
    // TODO: replace with real URL
    url: "https://huggingface.co/your-user-or-org/llama-3.1-8b-instruct.Q4_K_M.gguf",
  },
];
