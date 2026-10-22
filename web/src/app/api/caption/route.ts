import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

type CaptionPayload = {
  regionName: string;
  variableLabel: string;
  direction: string;
  significance: string;
  pValue: number;
  slopePerDecade: number;
  unit: string;
  nMonths: number;
  comparisonMode?: boolean;
  regionBName?: string;
  slopeB?: number;
};

export async function POST(request: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return NextResponse.json(
      { error: "DEEPSEEK_API_KEY is not configured" },
      { status: 500 }
    );
  }

  let payload: CaptionPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  if (
    typeof payload.regionName !== "string" ||
    typeof payload.variableLabel !== "string" ||
    typeof payload.direction !== "string" ||
    typeof payload.significance !== "string" ||
    typeof payload.pValue !== "number" ||
    typeof payload.slopePerDecade !== "number" ||
    typeof payload.unit !== "string" ||
    typeof payload.nMonths !== "number"
  ) {
    return NextResponse.json(
      { error: "Missing required fields in payload" },
      { status: 400 }
    );
  }

  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.deepseek.com",
  });

  const isComparison =
    payload.comparisonMode === true &&
    typeof payload.regionBName === "string" &&
    typeof payload.slopeB === "number";

  const systemPrompt = isComparison
    ? `You are a climate science communicator. Generate a two-sentence plain English summary comparing the two regional trends provided. Use ONLY the numbers provided. Do not speculate or add information beyond the data given. Be concise and clear.`
    : `You are a climate science communicator. Generate a two-sentence plain English summary of the provided trend data. Use ONLY the numbers provided. Do not speculate or add information beyond the data given. Be concise and clear.`;

  const userPrompt = isComparison
    ? `Region A: ${payload.regionName} (${payload.slopePerDecade.toFixed(3)} ${payload.unit}/decade, ${payload.direction})
Region B: ${payload.regionBName} (${payload.slopeB!.toFixed(3)} ${payload.unit}/decade)
Variable: ${payload.variableLabel}
Significance: ${payload.significance} (best p-value: ${payload.pValue.toFixed(4)})
Data span: ${payload.nMonths} months`
    : `Region: ${payload.regionName}
Variable: ${payload.variableLabel}
Direction: ${payload.direction}
Significance: ${payload.significance}
P-value: ${payload.pValue.toFixed(4)}
Slope: ${payload.slopePerDecade.toFixed(3)} ${payload.unit}/decade
Data span: ${payload.nMonths} months`;

  try {
    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const caption = response.choices[0]?.message?.content?.trim();
    if (!caption) {
      return NextResponse.json(
        { error: "No caption generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({ caption });
  } catch (error: unknown) {
    console.error("DeepSeek API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate caption",
      },
      { status: 500 }
    );
  }
}
