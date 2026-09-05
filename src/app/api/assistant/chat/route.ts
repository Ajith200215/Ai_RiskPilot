import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "placeholder_key",
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // MVP Context Gathering: Fetch the last 50 transactions to give Claude an idea of current state
    const recentTxns = await db.transaction.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, email: true } },
        merchant: { select: { name: true, category: true } },
      },
    });

    const contextString = `
Current Database Context (Last 50 Transactions):
${recentTxns
  .map(
    (tx) =>
      `[${tx.id}] ${tx.createdAt.toISOString()} - ₹${tx.amount} at ${tx.merchant.name} (${tx.merchant.category}) by ${tx.customer.name}. Status: ${tx.status}, RiskLevel: ${tx.riskLevel} (Score: ${tx.riskScore})`
  )
  .join("\n")}

Instructions:
You are an intelligent fintech risk assistant. Answer the user's questions based ONLY on the data provided above. If the user asks about something not in the context, politely inform them that you do not have data on that. Be concise, helpful, and format any IDs or monetary values clearly.
`;

    const systemPrompt = contextString;

    // Filter out system messages from client if any, and map to Anthropic format
    const anthropicMessages = messages.map((m: any) => ({
      role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
      content: m.content,
    }));

    const isRealApiKeyPresent =
      process.env.ANTHROPIC_API_KEY &&
      process.env.ANTHROPIC_API_KEY.startsWith("sk-ant-") &&
      process.env.ANTHROPIC_API_KEY.length > 20;

    if (!isRealApiKeyPresent) {
      // Fallback if no real API key
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const fallbackText = "Hello! I am operating in fallback mode as no valid Anthropic API key is configured. I see you have " + recentTxns.length + " recent transactions in the database. Please provide an API key for full AI capabilities.";
          controller.enqueue(encoder.encode(fallbackText));
          controller.close();
        },
      });
      return new Response(readable, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // Stream from Anthropic
    const stream = await anthropic.messages.stream({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    // Convert Anthropic stream to generic ReadableStream yielding text chunks
    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(encoder.encode("\n[Error: Stream interrupted]"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
