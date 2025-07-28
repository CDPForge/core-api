import {
  Injectable,
  OnApplicationShutdown,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { CompiledStateGraph } from "@langchain/langgraph";

@Injectable()
export class PromptService
  implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown
{
  private client: MultiServerMCPClient;
  private agent: CompiledStateGraph<any, any>;
  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = new MultiServerMCPClient({
      throwOnLoadError: true,
      prefixToolNameWithServerName: true,
      additionalToolNamePrefix: "mcp",
      useStandardContentBlocks: true,
      mcpServers: {
        opensearch: {
          url: this.configService.get("MCP_URL")!,
          transport: "sse",
        },
      },
    });

    const tools = await this.client.getTools();

    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      temperature: 0,
    });

    this.agent = createReactAgent({
      llm: model,
      tools,
    });
  }

  async send(message: string): Promise<string> {
    let ret = "";

    try {
      const response = await this.agent.invoke({
        messages: [
          {
            role: "system",
            content: `Agisci come un assistente BI. Puoi usare solo i dati contenuti negli indici OpenSearch: users-logs-23.
            Non usare o menzionare altri dati esterni o indici differenti.
            Ogni volta che ricevi una domanda, cerca prima i dati su OpenSearch utilizzando gli strumenti disponibili.
            Non inventare dati: se non puoi trovare l'informazione, rispondi che non è disponibile.`,
          },{ role: "user", content: message }],
      });


      const allMessages = response.messages;
      let result = "";

      for (let msg of allMessages) {
        if (!msg.lc_id[2] || !msg.lc_kwargs) continue;

        const msgType = msg.lc_id[2];
        const content = msg.lc_kwargs.content;

        // ✅ RITORNA: AIMessage con risposta finale (stringa)
        if (msgType === "AIMessage" && typeof content === "string" && content.trim()) {
          result += (result ? "\n\n" : "") + content;
        }

        // ✅ RITORNA: ToolMessage con dati da OpenSearch (mantieni formattazione originale)
        if (msgType === "ToolMessage" && typeof content === "string" && content.trim()) {
          result += (result ? "\n\n" : "") + content;
        }
      }

      return result || "Nessun dato disponibile";
    } catch (error) {
      console.error("Error during agent execution:", error);
      if (error.name === "ToolException") {
        console.error("Tool execution failed:", error.message);
      }
    }

    return ret;
  }

  async onModuleDestroy() {
    await this.closeClient();
  }

  async onApplicationShutdown() {
    await this.closeClient();
  }

  private async closeClient() {
    if (this.client) {
      try {
        await this.client.close();
      } catch (err) {
        console.error("Error closing MCP client:", err);
      }
    }
  }
}
