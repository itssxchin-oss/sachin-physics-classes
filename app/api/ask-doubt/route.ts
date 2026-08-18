import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { message, imageBase64, imageMimeType, conversationHistory } = body;

    if (!message && !imageBase64) {
      return NextResponse.json(
        { error: "Please provide a message or an image." },
        { status: 400 }
      );
    }

    // Build Gemini contents array
    const contents: Array<{
      role: string;
      parts: Array<Record<string, any>>;
    }> = [];

    // Include conversation history if provided
    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      for (const item of conversationHistory) {
        const role = item.role === "assistant" || item.role === "model" ? "model" : "user";
        const textContent =
          item.message ||
          item.text ||
          item.content ||
          (Array.isArray(item.parts)
            ? item.parts.map((p: { text?: string }) => p.text || "").join("")
            : "");

        if (textContent) {
          contents.push({
            role,
            parts: [{ text: textContent }],
          });
        }
      }
    }

    // Build parts for the current user request
    const currentParts: Array<Record<string, any>> = [];

    if (imageBase64) {
      // Strip base64 data URI header if present (e.g., "data:image/png;base64,")
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
      currentParts.push({
        inline_data: {
          mime_type: imageMimeType || "image/jpeg",
          data: cleanBase64,
        },
      });
    }

    if (message) {
      currentParts.push({ text: message });
    }

    contents.push({
      role: "user",
      parts: currentParts,
    });

    const systemInstruction = {
      parts: [
        {
          text: "You are a helpful physics, chemistry, maths, and science tutor for students of Sachin Physics Classes coaching. Explain concepts clearly and simply, suitable for school/JEE/NEET level students. If an image is provided, analyze it (it may be a diagram, question, or handwritten problem) and help solve or explain it.",
        },
      ],
    };

    const payload = {
      system_instruction: systemInstruction,
      contents,
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error?.message || `Gemini API returned status ${response.status}`;
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status || 500 }
      );
    }

    const data = await response.json();
    const reply =
      data.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || "")
        .join("") || "No response received from Gemini.";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Error in ask-doubt API route:", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred while processing your doubt." },
      { status: 500 }
    );
  }
}
