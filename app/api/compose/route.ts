import { NextRequest, NextResponse } from "next/server";
import { composeMeme } from "@/lib/image-composer";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const originalImage = formData.get("originalImage") as File | null;
    const reactionImagePath = formData.get("reactionImagePath") as string | null;
    const caption = (formData.get("caption") as string) ?? "";
    const photoOffsetX = parseFloat((formData.get("photoOffsetX") as string) ?? "0");
    const photoOffsetY = parseFloat((formData.get("photoOffsetY") as string) ?? "0");
    const photoZoom = parseFloat((formData.get("photoZoom") as string) ?? "1.0");

    if (!originalImage) {
      return NextResponse.json(
        { error: "No original image provided" },
        { status: 400 }
      );
    }

    if (!reactionImagePath) {
      return NextResponse.json(
        { error: "No reaction image path provided" },
        { status: 400 }
      );
    }

    // Convert uploaded file to buffer
    const arrayBuffer = await originalImage.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);

    // Compose the meme
    const result = await composeMeme({
      originalImageBuffer: originalBuffer,
      reactionImagePath,
      caption,
      photoOffsetX,
      photoOffsetY,
      photoZoom,
    });

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "Content-Disposition": 'inline; filename="meme.png"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Compose error:", error);
    const message =
      error instanceof Error ? error.message : "Composition failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
