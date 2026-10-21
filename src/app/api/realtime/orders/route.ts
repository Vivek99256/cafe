import { NextRequest } from "next/server";
import { orderEmitter, RealtimeOrderEvent } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cafeId = searchParams.get("cafeId");
  const orderId = searchParams.get("orderId");

  if (!cafeId && !orderId) {
    return new Response("Missing cafeId or orderId", { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial heartbeat
      controller.enqueue(encoder.encode(`event: ping\ndata: ${Date.now()}\n\n`));

      const onCafeEvent = (data: RealtimeOrderEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`event: order\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Stream closed
        }
      };

      const onOrderEvent = (data: RealtimeOrderEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`event: order\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Stream closed
        }
      };

      if (cafeId) {
        orderEmitter.on(`cafe:${cafeId}`, onCafeEvent);
      }
      if (orderId) {
        orderEmitter.on(`order:${orderId}`, onOrderEvent);
      }

      // Heartbeat interval to keep connection alive
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`event: ping\ndata: ${Date.now()}\n\n`));
        } catch {
          clearInterval(interval);
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        if (cafeId) orderEmitter.off(`cafe:${cafeId}`, onCafeEvent);
        if (orderId) orderEmitter.off(`order:${orderId}`, onOrderEvent);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
