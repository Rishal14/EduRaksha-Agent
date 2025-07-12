# Ollama Setup Guide for EduRaksha AI Assistant

This guide will help you set up Ollama to use Llama models with the EduRaksha AI Assistant.

## Prerequisites

- Windows 10/11, macOS, or Linux
- At least 8GB RAM (16GB recommended)
- 10GB free disk space

## Installation

### Windows
1. Download Ollama from [https://ollama.ai/download](https://ollama.ai/download)
2. Run the installer and follow the setup wizard
3. Ollama will be installed as a Windows service

### macOS
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

## Starting Ollama

### Windows
Ollama runs automatically as a Windows service. You can also start it manually:
```bash
ollama serve
```

### macOS/Linux
```bash
ollama serve
```

## Installing Llama Models

The AI Assistant is configured to use `llama3.2` by default. To install it:

```bash
ollama pull llama3.2
```

### Alternative Models

You can also use other models:

```bash
# Llama 3.1 (smaller, faster)
ollama pull llama3.1

# Llama 2 (stable)
ollama pull llama2

# Code Llama (good for technical queries)
ollama pull codellama

# Mistral (good balance of speed and quality)
ollama pull mistral
```

## Configuration

### Environment Variables

Create a `.env.local` file in the `frontend-next` directory:

```env
NEXT_PUBLIC_OLLAMA_BASE_URL=http://localhost:11434
```

### Model Selection

You can change the model by updating the configuration in `src/lib/ollama-config.ts`:

```typescript
export const DEFAULT_OLLAMA_CONFIG: OllamaConfig = {
  baseUrl: "http://localhost:11434",
  model: "llama3.1", // Change this to your preferred model
  temperature: 0.7,
  maxTokens: 2048,
};
```

## Testing the Setup

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Navigate to the AI Assistant page in your application

3. The AI Assistant will automatically:
   - Check if Ollama is running
   - Verify the model is available
   - Pull the model if needed
   - Fall back to mock responses if Ollama is not available

## Troubleshooting

### Ollama not starting
- Check if the service is running: `ollama list`
- Restart the service: `ollama serve`

### Model not found
- List available models: `ollama list`
- Pull the required model: `ollama pull <model-name>`

### Connection errors
- Verify Ollama is running on port 11434
- Check firewall settings
- Ensure the base URL is correct in your configuration

### Performance issues
- Use smaller models like `llama3.1` or `llama2:7b`
- Increase system RAM
- Close other applications to free up resources

## Model Comparison

| Model | Size | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| llama3.2 | ~4GB | Medium | High | General purpose |
| llama3.1 | ~2GB | Fast | Good | Quick responses |
| llama2 | ~4GB | Medium | High | Stable, reliable |
| codellama | ~4GB | Medium | High | Technical queries |
| mistral | ~4GB | Fast | Good | Balanced performance |

## Advanced Configuration

### Custom Models
You can create custom models with specific prompts:

```bash
# Create a custom model
ollama create eduraksha -f Modelfile

# Use the custom model
ollama run eduraksha
```

### Modelfile Example
```
FROM llama3.2
SYSTEM You are EduRaksha AI Assistant, specialized in privacy-preserving verification systems.
```

### Performance Tuning
- Adjust `temperature` for response creativity (0.0-1.0)
- Modify `maxTokens` for response length
- Use `num_ctx` parameter for context window size

## Security Notes

- Ollama runs locally on your machine
- No data is sent to external servers
- Models are downloaded and stored locally
- All conversations remain private

## Support

If you encounter issues:
1. Check the [Ollama documentation](https://ollama.ai/docs)
2. Verify your system meets the requirements
3. Check the browser console for error messages
4. Ensure Ollama is running and accessible 