import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // Fetch recent transactions for context
    const recentTxns = await db.transaction.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, email: true } },
        merchant: { select: { name: true, category: true } },
      },
    });

    const systemPrompt = `You are an intelligent fintech risk assistant for RiskPilot.
Answer the user's questions based ONLY on the data provided below. Be concise and helpful.

Current Database Context (Last ${recentTxns.length} Transactions):
${recentTxns
  .map(
    (tx) =>
      `[${tx.id.substring(0, 8)}] ₹${tx.amount} at ${tx.merchant.name} (${tx.merchant.category}) by ${tx.customer.name}. Status: ${tx.status}, Risk: ${tx.riskLevel} (Score: ${tx.riskScore})`
  )
  .join("\n")}`;

    const apiKey = process.env.GROQ_API_KEY;
    const isValidKey = apiKey && apiKey.startsWith("gsk_") && apiKey.length > 20;

    if (!isValidKey) {
      return new Response(
        `I'm in fallback mode — no valid GROQ_API_KEY found. I can see ${recentTxns.length} transactions in the database.`,
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    const groq = new Groq({ apiKey });

    const groqMessages = messages.map((m: any) => ({
      role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
      content: m.content,
    }));

    let stream;
    try {
      stream = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        max_tokens: 1024,
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          ...groqMessages,
        ],
      });
    } catch (groqErr: any) {
      console.error("Groq API error:", groqErr);
      // Return a readable error instead of crashing with 500
      return new Response(
        `AI error: ${groqErr?.message || "Groq API failed"}. Please try again.`,
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

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
        } catch (streamErr) {
          console.error("Stream error:", streamErr);
          controller.enqueue(encoder.encode("\n[Stream interrupted. Please try again.]"));
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
    // Return 200 with error text so the frontend shows it instead of crashing
    return new Response(
      `Server error: ${error.message}. Please try again.`,
      { headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }
}
