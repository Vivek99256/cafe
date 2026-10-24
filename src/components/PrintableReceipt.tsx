import { formatCurrency } from "@/lib/utils";

interface ReceiptItem {
  name: string;
  variantName?: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  selectedAddOns?: Array<{ name: string; price: number; quantity: number }>;
}

interface OrderRound {
  roundNumber: number;
  orderNumber: string;
  createdAt?: string;
  items: ReceiptItem[];
}

interface PrintableReceiptProps {
  cafeName: string;
  cafeAddress?: string | null;
  cafePhone?: string | null;
  orderNumber: string;
  tableNumber: string;
  customerName: string;
  createdAt: string;
  items: ReceiptItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  isCombinedTableBill?: boolean;
  orderNumbers?: string[];
  orderRounds?: OrderRound[];
}

export default function PrintableReceipt({
  cafeName,
  cafeAddress,
  cafePhone,
  orderNumber,
  tableNumber,
  customerName,
  createdAt,
  items,
  subtotal,
  taxAmount,
  totalAmount,
  paymentMethod,
  paymentStatus,
  isCombinedTableBill,
  orderNumbers,
  orderRounds,
}: PrintableReceiptProps) {
  const displayOrderNumbers = orderNumbers && orderNumbers.length > 0
    ? orderNumbers.join(", #")
    : orderNumber;

  return (
    <div className="printable-card bg-white text-black p-5 border border-stone-300 max-w-[80mm] mx-auto text-xs font-mono">
      <div className="text-center pb-2 border-b border-black space-y-0.5">
        <h2 className="text-base font-bold uppercase">{cafeName}</h2>
        {cafeAddress && <p className="text-[10px] text-stone-600">{cafeAddress}</p>}
        {cafePhone && <p className="text-[10px] text-stone-600">Tel: {cafePhone}</p>}
        <div className="text-xs font-bold pt-1">
          {isCombinedTableBill ? "CONSOLIDATED TABLE INVOICE / BILL" : "TAX INVOICE / RECEIPT"}
        </div>
        {isCombinedTableBill && (
          <div className="text-[10px] font-bold text-stone-700 bg-stone-100 py-0.5 mt-0.5">
            ★ ALL ORDERS COMBINED FOR TABLE {tableNumber} ★
          </div>
        )}
      </div>

      <div className="py-2 border-b border-black space-y-0.5 text-[11px]">
        <div className="flex justify-between">
          <span className="font-bold">Table: {tableNumber}</span>
          <span>{isCombinedTableBill ? `${orderNumbers?.length || 1} Orders Combined` : `Order: #${orderNumber}`}</span>
        </div>
        {isCombinedTableBill && (
          <div className="text-[10px] text-stone-700 truncate">
            Orders: #{displayOrderNumbers}
          </div>
        )}
        <div className="flex justify-between">
          <span>Date: {new Date(createdAt).toLocaleDateString()}</span>
          <span>{new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div>Customer: {customerName}</div>
      </div>

      {/* Itemized Rounds or Single Items */}
      {orderRounds && orderRounds.length > 1 ? (
        <div className="py-2 border-b border-black space-y-2">
          <div className="flex justify-between font-bold border-b border-stone-200 pb-0.5 text-[10px]">
            <span>ROUNDS & ITEMS</span>
            <span>AMT</span>
          </div>
          {orderRounds.map((round) => (
            <div key={round.orderNumber} className="space-y-1">
              <div className="font-bold text-[10px] bg-stone-100 px-1 py-0.5 flex justify-between border-y border-stone-200">
                <span>Round {round.roundNumber} (#{round.orderNumber})</span>
                {round.createdAt && (
                  <span className="font-normal text-stone-500">
                    {new Date(round.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
              {round.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5 pl-1.5">
                  <div className="flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{formatCurrency(item.totalPrice)}</span>
                  </div>
                  {item.variantName && (
                    <div className="pl-3 text-[10px] text-stone-600">
                      ({item.variantName})
                    </div>
                  )}
                  {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                    <div className="pl-3 text-[10px] text-stone-600">
                      + {item.selectedAddOns.map((a) => a.name).join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (

      <div className="py-2 border-b border-black space-y-1.5">
        <div className="flex justify-between font-bold border-b border-stone-200 pb-0.5 text-[10px]">
          <span>ITEM / QTY</span>
          <span>AMT</span>
        </div>
        {items.map((item, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className="flex justify-between">
              <span>{item.quantity}x {item.name}</span>
              <span>{formatCurrency(item.totalPrice)}</span>
            </div>
            {item.variantName && (
              <div className="pl-3 text-[10px] text-stone-600">
                ({item.variantName})
              </div>
            )}
            {item.selectedAddOns && item.selectedAddOns.length > 0 && (
              <div className="pl-3 text-[10px] text-stone-600">
                + {item.selectedAddOns.map((a) => a.name).join(", ")}
              </div>
            )}
          </div>
        ))}
      </div>
      )}

      <div className="py-2 border-b border-black space-y-1 text-right">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>GST / Taxes:</span>
          <span>{formatCurrency(taxAmount)}</span>
        </div>
        <div className="flex justify-between font-bold text-sm pt-1 border-t border-stone-300">
          <span>GRAND TOTAL:</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      <div className="py-1.5 text-center text-[10px] text-stone-700 space-y-0.5">
        <div>Mode: {paymentMethod === "PAY_AT_COUNTER" ? "Cash / Counter" : "UPI Online"} ({paymentStatus})</div>
        <p className="font-bold pt-1">Thank you for visiting {cafeName}!</p>
        <p className="text-[9px] text-stone-400">Powered by Aura Cafe SaaS</p>
      </div>
    </div>
  );
}
