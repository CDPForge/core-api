import {Injectable, OnApplicationShutdown, OnModuleDestroy, OnModuleInit} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import {CompiledStateGraph} from "@langchain/langgraph";

@Injectable()
export class PromptService implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown {
  private client: MultiServerMCPClient;
  private agent: CompiledStateGraph<any,any>;
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
        messages: [{ role: "user", content: message }],
      });

      ret = response.messages.pop()?.content?.toString() ?? "";
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
