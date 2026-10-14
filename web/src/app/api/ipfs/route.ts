import { NextResponse } from "next/server";

export const runtime = "nodejs";

type PinataResponse = {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
};

export async function POST(request: Request) {
  const jwt = process.env.PINATA_JWT;

  if (!jwt || jwt.trim().length === 0) {
    return NextResponse.json(
      { error: "PINATA_JWT is not configured" },
      { status: 500 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { error: "Payload must be a JSON object" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        pinataContent: payload,
        pinataMetadata: {
          name: `bluegram-trend-${Date.now()}.json`,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pinata API error:", response.status, errorText);
      return NextResponse.json(
        { error: `Pinata API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = (await response.json()) as PinataResponse;

    return NextResponse.json({
      cid: data.IpfsHash,
      gateway_url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
      timestamp: data.Timestamp,
      size: data.PinSize,
    });
  } catch (error: unknown) {
    console.error("IPFS upload error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to upload to IPFS",
      },
      { status: 500 }
    );
  }
}
