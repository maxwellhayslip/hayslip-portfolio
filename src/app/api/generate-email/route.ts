import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guestName, guestRoom, issueDescription, resolutionTaken, compensation } = body;

    if (!guestName || !issueDescription || !resolutionTaken || !compensation) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const prompt = `You are a professional hotel guest relations manager drafting a sincere, empathetic email to a guest who experienced a problem during their stay.

Guest Information:
- Guest Name: ${guestName}${guestRoom ? `\n- Room Number: ${guestRoom}` : ""}

Issue Experienced:
${issueDescription}

Steps Taken to Resolve:
${resolutionTaken}

Compensation / Goodwill Gesture Being Offered:
${compensation}

Write a professional guest recovery email that:
1. Opens with a warm, personalized greeting
2. Sincerely acknowledges and apologizes for the specific inconvenience — without making excuses
3. Briefly explains what was done to address the issue
4. Presents the compensation offer clearly and graciously
5. Reaffirms commitment to their comfort and reiterates how much their stay means to us
6. Closes with a genuine invitation to return and a warm sign-off

Tone guidelines:
- Empathetic and genuinely sorry — not robotic or formulaic
- Professional yet warm — this is a luxury hospitality brand
- Confident and solution-focused — we took this seriously
- Personal — address the guest by name naturally throughout
- Avoid over-apologizing or being self-deprecating; be gracious and forward-looking

Sign the email as:
Guest Relations Team
[Hotel Name]

Format the email with proper spacing. Return only the email text — no subject line prefix, no metadata.`;

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      thinking: { type: "adaptive" },
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const emailText = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as Anthropic.TextBlock).text)
      .join("");

    return NextResponse.json({ email: emailText });
  } catch (error) {
    console.error("Error generating email:", error);
    return NextResponse.json(
      { error: "Failed to generate email. Please try again." },
      { status: 500 }
    );
  }
}
