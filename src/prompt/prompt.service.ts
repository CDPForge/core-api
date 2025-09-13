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
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
  ToolMessage,
  BaseMessage
} from "@langchain/core/messages";

@Injectable()
export class PromptService
  implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown {
  private client: MultiServerMCPClient;
  private agent: CompiledStateGraph<any, any>;
  constructor(
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

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

  async send(user: User, message: string, clientId: number): Promise<string> {
    let result = "";

    try {
      const indice = `users-logs-${clientId}`;
      console.log(`🔍 Processing request for user ${user.id}, client ${clientId}, index: ${indice}`);
      console.log(`📝 User message: "${message}"`);

      const systemPrompt = `
      Sei un assistente specializzato in OpenSearch.
          Quando l’utente fa una domanda, DEVI usare esclusivamente il seguente indice:

          ${indice}

      NON devi mai cercare in altri indici, anche se sembrano rilevanti.
          Se l’informazione richiesta non è disponibile in questi indici, rispondi che non puoi fornire il dato.
      Se l'indice non è specificato cerca tra tutti quelli sopra elencati.

          Regole:
      1. Usa sempre il tool 'getMapping' per comprendere la struttura dei campi di questi indici e le loro descrizioni (meta.description).
      2. Usa solo il tool 'search' per interrogare questi indici, ignorando qualsiasi altro.
      3. Non inventare dati.
      4. Se l’utente chiede informazioni che non rientrano nei dati contenuti negli indici sopra elencati, spiega che non è possibile recuperarle.
      5. L'utente non può vedere i tool. Usa i tool solo per elaborare la risposta finale.

FORMATO RISPOSTA OBBLIGATORIO:
Restituisci SEMPRE la risposta in questo formato JSON:

\`\`\`json
{
  "response": "La tua risposta testuale qui"
}
\`\`\`

ESEMPI:
- Domanda: "Quanti log ci sono?" → {"response": "Ci sono 48 log nell'indice users-logs-23."}
- Domanda: "Qual è la data dell'ultimo log?" → {"response": "Il log più recente ha la data: 2025-07-28T17:53:14.428Z"}

IMPORTANTE: Usa SEMPRE il formato JSON sopra indicato, mai testo semplice.
`;
      const history = await this.getPromptHistory(user, clientId);

      // Debug: log della history per verificare il contenuto
      console.log(`\n=== PROMPT DEBUG ===`);
      console.log(`User: ${user.id}, Client: ${clientId}`);
      console.log(`Current message: "${message}"`);
      console.log(`History length: ${history.length}`);
      console.log(`History content:`,
        history.map((msg, idx) => ({
          index: idx,
          type: msg.constructor.name,
          content: typeof msg.content === 'string' ? msg.content.substring(0, 150) + '...' : '[complex content]'
        }))
      );

      const messages: BaseMessage[] = [
        new SystemMessage(systemPrompt),
        ...history,
        new HumanMessage(message),
      ];

      console.log(`Total messages sent to LLM: ${messages.length}`);
      console.log(`Messages structure:`, messages.map((msg, idx) => ({
        index: idx,
        type: msg.constructor.name,
        contentPreview: typeof msg.content === 'string' ? msg.content.substring(0, 100) + '...' : '[complex]'
      })));
      console.log(`===================\n`);

      console.log(`🚀 Invoking agent...`);

      // Aggiungiamo un timeout per evitare che si blocchi
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Agent timeout after 60 seconds')), 60000);
      });

      const response = await Promise.race([
        this.agent.invoke({ messages }),
        timeoutPromise
      ]) as any;

      console.log(`✅ Agent response received, processing...`);
      console.log(`Response messages count: ${response.messages?.length || 0}`);

      // Debug: mostra tutti i messaggi generati dall'agent
      console.log(`📋 All response messages:`, response.messages?.map((msg, idx) => ({
        index: idx,
        type: msg.lc_id?.[2] || 'Unknown',
        contentPreview: typeof msg.lc_kwargs?.content === 'string'
          ? msg.lc_kwargs.content.substring(0, 150) + '...'
          : '[non-string content]'
      })));

      // Prendiamo l'ULTIMO AIMessage, non il primo
      // L'agent può generare più AIMessage durante l'esecuzione
      const aiMessages = response.messages.filter(
        (msg) =>
          msg.lc_id?.[2] === "AIMessage" &&
          typeof msg.lc_kwargs?.content === "string" &&
          msg.lc_kwargs.content.trim(),
      );

      const aiMessage = aiMessages[aiMessages.length - 1]; // Ultimo messaggio

      console.log(`🔍 Found ${aiMessages.length} AI messages, using the last one`);

      console.log(`🔍 Selected AI message exists: ${!!aiMessage}`);

      const rawResult = aiMessage?.lc_kwargs.content || "Mi dispiace, non sono riuscito a completare l'elaborazione della tua richiesta. Potresti riprovare con una domanda più semplice?";
      console.log(`🤖 Raw AI Response: "${rawResult.substring(0, 200)}..."`);

      // Controlla se la risposta sembra incompleta
      if (rawResult.includes("Dammi un momento") || rawResult.includes("sto elaborando") || rawResult.length < 10) {
        result = "Mi dispiace, l'elaborazione della richiesta è stata interrotta. Potresti riprovare? Se la domanda è complessa, prova a suddividerla in parti più semplici.";
        console.log(`⚠️ Detected incomplete response, using fallback message`);
      } else {
        // Processare la risposta per estrarre sempre il testo leggibile
        result = this.extractReadableText(rawResult);
        console.log(`📝 Processed Response: "${result.substring(0, 200)}..."`);
      }

      // Salviamo solo la conversazione user-assistant, non i tool messages
      // I tool messages sono interni all'agent e non dovrebbero essere nella history
      const newMessages: BaseMessage[] = [
        new HumanMessage(message),
        new AIMessage(result),
      ];

      await this.savePromptHistory(user, clientId, newMessages);
      console.log(`💾 Saved to history for client ${clientId}`);
    } catch (error) {
      console.error("❌ Error during agent execution:", error);

      if (error.message?.includes('timeout')) {
        result = "La richiesta ha richiesto troppo tempo per essere elaborata. Prova con una domanda più semplice o riprova più tardi.";
      } else if (error.name === "ToolException") {
        console.error("🔧 Tool execution failed:", error.message);
        result = "Si è verificato un errore durante l'accesso ai dati. Riprova o contatta il supporto se il problema persiste.";
      } else {
        result = "Si è verificato un errore imprevisto. Riprova o contatta il supporto se il problema persiste.";
      }

      // Salva comunque nella history per mantenere il contesto
      const errorMessages: BaseMessage[] = [
        new HumanMessage(message),
        new AIMessage(result),
      ];

      try {
        await this.savePromptHistory(user, clientId, errorMessages);
      } catch (saveError) {
        console.error("Failed to save error to history:", saveError);
      }
    }

    return result;
  }

  private async savePromptHistory(
    user: User,
    clientId: number,
    newMessages: BaseMessage[],
  ): Promise<void> {
    const cacheKey = `promptHistory:${user.id}:${clientId}`;

    // recupero la cronologia attuale
    const history = await this.getPromptHistory(user, clientId);

    // aggiungo i nuovi messaggi
    const updatedHistory = [...history, ...newMessages];

    // limito la lunghezza per non far crescere troppo Redis
    const historyLimit = this.configService.get("REDIS_HISTORY_LIMIT") || 20;
    const trimmedHistory = updatedHistory.slice(-historyLimit);

    // Converto i messaggi in formato serializzabile
    const serializedHistory = trimmedHistory.map(msg => ({
      type: msg.constructor.name,
      content: msg.content,
    }));

    // salvo in cache
    const ttl = this.configService.get("REDIS_HISTORY_TTL") || 86400000; // 24h default
    await this.cacheManager.set(cacheKey, serializedHistory, ttl);
  }

  private async getPromptHistory(user: User, clientId: number): Promise<BaseMessage[]> {
    const cacheKey = `promptHistory:${user.id}:${clientId}`;
    const serializedHistory = (await this.cacheManager.get<any[]>(cacheKey)) || [];

    // Converto i messaggi serializzati in BaseMessage
    return serializedHistory.map(msg => {
      switch (msg.type) {
        case 'HumanMessage':
          return new HumanMessage(msg.content);
        case 'AIMessage':
          return new AIMessage(msg.content);
        case 'SystemMessage':
          return new SystemMessage(msg.content);
        default:
          return new HumanMessage(msg.content); // fallback
      }
    });
  }

  async onModuleDestroy() {
    await this.closeClient();
  }

  async onApplicationShutdown() {
    await this.closeClient();
  }

  async clearHistory(user: User, clientId: number): Promise<void> {
    const cacheKey = `promptHistory:${user.id}:${clientId}`;
    await this.cacheManager.del(cacheKey);
  }

  private extractReadableText(rawResponse: string): string {
    try {
      // Prova a parsare come JSON
      const jsonMatch = rawResponse.match(/```json\s*(\{.*?\})\s*```/s);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1];
        const parsed = JSON.parse(jsonStr);
        if (parsed.response) {
          return parsed.response;
        }
      }

      // Prova a parsare JSON diretto (senza markdown)
      if (rawResponse.trim().startsWith('{') && rawResponse.trim().endsWith('}')) {
        const parsed = JSON.parse(rawResponse);
        if (parsed.response) {
          return parsed.response;
        }
      }

      // Se non è JSON, restituisci il testo così com'è
      return rawResponse;
    } catch (error) {
      console.log(`⚠️ Failed to parse JSON response, returning raw text:`, error.message);
      return rawResponse;
    }
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
