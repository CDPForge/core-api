import {
  Inject,
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
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { User } from "../users/user.model";

@Injectable()
export class PromptService
  implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown
{
  private client: MultiServerMCPClient;
  private agent: CompiledStateGraph<any, any>;
  constructor(
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

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

  async send(user: User, message: string): Promise<string> {
    let result = "";

    try {
      const indici = ["users-logs-23"];
      const systemPrompt = `
      Sei un assistente specializzato in OpenSearch.
          Quando l’utente fa una domanda, DEVI usare esclusivamente i seguenti indici:

          ${indici.map((i) => "- " + i).join("\n")}

      NON devi mai cercare in altri indici, anche se sembrano rilevanti.
          Se l’informazione richiesta non è disponibile in questi indici, rispondi che non puoi fornire il dato.
      Se l'indice non è specificato cerca tra tutti quelli sopra elencati.

          Regole:
      1. Usa sempre il tool 'getMapping' per comprendere la struttura dei campi di questi indici e le loro descrizioni (meta.description).
      2. Usa solo il tool 'search' per interrogare questi indici, ignorando qualsiasi altro.
      3. Non inventare dati.
      4. Se l’utente chiede informazioni che non rientrano nei dati contenuti negli indici sopra elencati, spiega che non è possibile recuperarle.
      5. L'utente non può vedere i tool. Usa i tool solo per elaborare la risposta finale.

Formattazione risposta:
  - Crea un oggetto JSON. Aggiungi la risposta nella proprietà response.
  - Se dalla risposta è possibile generare dei grafici, aggiungi una proprietà charts di tipo array contenente gli oggetti con le informazioni dei grafici da creare.
  - Basati sulla libreria chartjs per creare l'oggetto per i grafici.
  - L'oggetto per i grafici sarà composto da una proprietà type di tipo string per la tipologia del grafico (pie, linear,ecc.) e una proprietà data che conterrà i dati per il grafico.
`;
      const history = await this.getPromptHistory(user);

      const messages = [
        { role: "system", content: systemPrompt },
        ...(history || []),
        { role: "user", content: message },
      ];

      const response = await this.agent.invoke({ messages });
      const aiMessage = response.messages.find(
        (msg) =>
          msg.lc_id?.[2] === "AIMessage" &&
          typeof msg.lc_kwargs?.content === "string" &&
          msg.lc_kwargs.content.trim(),
      );

      const toolMessages = response.messages
        .filter(
          (msg) =>
            msg.lc_id?.[2] === "ToolMessage" &&
            typeof msg.lc_kwargs?.content === "string" &&
            msg.lc_kwargs.content.trim(),
        )
        .map((msg) => ({ role: "tool", content: msg.lc_kwargs.content }));

      result = aiMessage?.lc_kwargs.content || "Nessun dato disponibile";

      await this.savePromptHistory(user, [
        { role: "user", content: message },
        { role: "assistant", content: result },
        ...toolMessages,
      ]);
    } catch (error) {
      console.error("Error during agent execution:", error);
      if (error.name === "ToolException") {
        console.error("Tool execution failed:", error.message);
      }
    }

    return result;
  }

  private async savePromptHistory(
    user: User,
    newMessages: any[],
  ): Promise<void> {
    const cacheKey = `promptHistory:${user.id}`;

    // recupero la cronologia attuale
    const history = ((await this.cacheManager.get(cacheKey)) as any[]) || [];

    // aggiungo i nuovi messaggi
    const updatedHistory = [...history, ...newMessages];

    // limito la lunghezza per non far crescere troppo Redis
    const trimmedHistory = updatedHistory.slice(
      -this.configService.get("REDIS_HISTORY_LIMIT"),
    );

    // salvo in cache
    await this.cacheManager.set(
      cacheKey,
      trimmedHistory,
      this.configService.get("REDIS_HISTORY_TTL"),
    );
  }

  private async getPromptHistory(user: User): Promise<any[]> {
    const cacheKey = `promptHistory:${user.id}`;
    return (await this.cacheManager.get<any[]>(cacheKey)) || [];
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
