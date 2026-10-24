import { EventEmitter } from "events";

// Global event emitter for in-memory live updates across Next.js server instance
const globalForEvents = globalThis as unknown as {
  orderEmitter: EventEmitter | undefined;
};

export const orderEmitter = globalForEvents.orderEmitter ?? new EventEmitter();
orderEmitter.setMaxListeners(200);

// Retain globally across all environments so route handlers share the same instance
globalForEvents.orderEmitter = orderEmitter;

export interface RealtimeOrderEvent {
  type: "NEW_ORDER" | "STATUS_UPDATE";
  cafeId: string;
  orderId: string;
  orderNumber: string;
  tableNumber?: string;
  status: string;
  totalAmount?: number;
  timestamp: string;
}

export function broadcastOrderEvent(event: RealtimeOrderEvent) {
  orderEmitter.emit(`cafe:${event.cafeId}`, event);
  orderEmitter.emit(`order:${event.orderId}`, event);
}
