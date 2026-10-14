export type CaptionPayload = {
  regionName: string;
  variableLabel: string;
  direction: string;
  significance: string;
  pValue: number;
  slopePerDecade: number;
  unit: string;
  nMonths: number;
};

export type CaptionResponse = {
  caption: string;
};

export type CaptionError = {
  error: string;
};

export async function fetchCaption(
  payload: CaptionPayload,
  signal: AbortSignal
): Promise<string> {
  const response = await fetch("/api/caption", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const errorData = (await response.json()) as CaptionError;
    throw new Error(errorData.error || "Failed to fetch caption");
  }

  const data = (await response.json()) as CaptionResponse;
  return data.caption;
}
