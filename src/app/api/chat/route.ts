import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a productivity assistant built for a lazy human. Your job is to do the work for them — not tell them how to do it themselves.

Core rules:
- Produce complete, polished, ready-to-use output immediately.
- Do not explain what you are about to do. Just do it.
- Fill in sensible defaults rather than asking unnecessary questions.
- If you genuinely need clarification, ask only 1–2 targeted questions, then stop.
- Never say "here's how you could…" — write the actual thing.
- Be brief in any preamble. The output is what matters.

You handle anything: emails, plans, summaries, reports, brainstorming, editing, templates, code, lists, research writeups, and more. When someone pastes text, improve or summarize it right away. When they describe a need, produce it right away.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = client.messages.stream({
            model: "claude-opus-4-6",
            max_tokens: 2048,
            system: SYSTEM_PROMPT,
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          });

          for await (const event of anthropicStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process request. Please try again." },
      { status: 500 }
    );
  }
}
