import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

@Injectable()
export class PromptService {

  constructor(private configService: ConfigService) { }

  async send(message: string): Promise<string> {
    const client = new MultiServerMCPClient({
      throwOnLoadError: true,
      prefixToolNameWithServerName: true,
      additionalToolNamePrefix: "mcp",
      useStandardContentBlocks: true,
      mcpServers: {
        "opensearch": { 
          "url": this.configService.get("MCP_URL")!,
          "transport": "sse",
        }
      }
    });

    let ret: string = "";
    const tools = await client.getTools();
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      temperature: 0,
    });
    const agent = createReactAgent({
      llm: model,
      tools,
    });

    try {
      const response = await agent.invoke({
        messages: [{ role: "user", content: message }],
      });
      ret = response.messages.pop()!.content.toString();
    } catch (error) {
      console.error("Error during agent execution:", error);
      // Tools throw ToolException for tool-specific errors
      if (error.name === "ToolException") {
        console.error("Tool execution failed:", error.message);
      }
    }
    await client.close();

    return ret;
  }
}
