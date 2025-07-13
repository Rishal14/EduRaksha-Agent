export interface OllamaConfig {
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens?: number;
}

export const DEFAULT_OLLAMA_CONFIG: OllamaConfig = {
  baseUrl: "http://localhost:11434",
  model: "llama3.2",
  temperature: 0.7,
  maxTokens: 2048,
};

export const AVAILABLE_MODELS = [
  "llama3.2",
  "llama3.1", 
  "llama2",
  "llama2:13b",
  "llama2:7b",
  "codellama",
  "mistral",
  "neural-chat",
  "phi3",
  "qwen2",
];

export class OllamaManager {
  private config: OllamaConfig;

  constructor(config: Partial<OllamaConfig> = {}) {
    this.config = { ...DEFAULT_OLLAMA_CONFIG, ...config };
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      console.error("Ollama connection failed:", error);
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`);
      if (!response.ok) throw new Error("Failed to fetch models");
      
      const data = await response.json();
      return data.models?.map((model: { name: string }) => model.name) || [];
    } catch (error) {
      console.error("Failed to get available models:", error);
      return [];
    }
  }

  async pullModel(modelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName }),
      });
      return response.ok;
    } catch (error) {
      console.error(`Failed to pull model ${modelName}:`, error);
      return false;
    }
  }

  getConfig(): OllamaConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<OllamaConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export const ollamaManager = new OllamaManager(); 