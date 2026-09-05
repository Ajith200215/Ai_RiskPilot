import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { db } from "@/lib/db";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // MVP Context Gathering: Fetch the last 50 transactions to give the model context
    const recentTxns = await db.transaction.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, email: true } },
        merchant: { select: { name: true, category: true } },
      },
    });

    const systemPrompt = `You are an intelligent fintech risk assistant for RiskPilot.
Answer the user's questions based ONLY on the data provided below. If the user asks about something not in the context, politely inform them that you do not have data on that. Be concise, helpful, and format any IDs or monetary values clearly.

Current Database Context (Last 50 Transactions):
${recentTxns
  .map(
    (tx) =>
      `[${tx.id}] ${tx.createdAt.toISOString()} - ₹${tx.amount} at ${tx.merchant.name} (${tx.merchant.category}) by ${tx.customer.name}. Status: ${tx.status}, RiskLevel: ${tx.riskLevel} (Score: ${tx.riskScore})`
  )
  .join("\n")}`;

    const isRealApiKeyPresent =
      process.env.GROQ_API_KEY &&
      process.env.GROQ_API_KEY.startsWith("gsk_") &&
      process.env.GROQ_API_KEY.length > 20;

    if (!isRealApiKeyPresent) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const fallbackText =
            "Hello! I am operating in fallback mode as no valid Groq API key is configured. I see you have " +
            recentTxns.length +
            " recent transactions in the database. Please provide a GROQ_API_KEY for full AI capabilities.";
          controller.enqueue(encoder.encode(fallbackText));
          controller.close();
        },
      });
      return new Response(readable, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // Map messages to Groq format
    const groqMessages = messages.map((m: any) => ({
      role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
      content: m.content,
    }));

    // Stream from Groq
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...groqMessages,
      ],
    });

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              controller.enqueue(encoder.encode(text));
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
        Connection: "keep-alive",
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
