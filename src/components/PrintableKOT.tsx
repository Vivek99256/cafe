interface KOTItem {
  name: string;
  variantName?: string | null;
  quantity: number;
  specialInstructions?: string | null;
  selectedAddOns?: Array<{ name: string; quantity: number }>;
}

interface PrintableKOTProps {
  orderNumber: string;
  tableNumber: string;
  customerName: string;
  createdAt: string;
  items: KOTItem[];
  notes?: string | null;
}

export default function PrintableKOT({
  orderNumber,
  tableNumber,
  customerName,
  createdAt,
  items,
  notes,
}: PrintableKOTProps) {
  return (
    <div className="printable-kot bg-white text-black p-4 border border-dashed border-black max-w-[80mm] mx-auto text-xs font-mono">
      <div className="text-center pb-2 border-b-2 border-black space-y-0.5">
        <h2 className="text-base font-bold uppercase">KITCHEN ORDER TICKET (KOT)</h2>
        <div className="text-lg font-extrabold">TABLE: {tableNumber}</div>
        <div className="text-xs">Order #{orderNumber}</div>
        <div className="text-[10px] text-stone-600">
          {new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
      </div>

      <div className="py-1 text-[11px] border-b border-black">
        Guest: <span className="font-bold">{customerName}</span>
      </div>

      {/* Items */}
      <div className="py-2 space-y-2 border-b-2 border-black">
        {items.map((item, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className="flex justify-between items-start font-bold text-sm">
              <span>{item.quantity}x {item.name}</span>
            </div>
            {item.variantName && (
              <div className="pl-4 text-[11px] text-stone-700">
                Size: {item.variantName}
              </div>
            )}
            {item.selectedAddOns && item.selectedAddOns.length > 0 && (
              <div className="pl-4 text-[11px] text-stone-700">
                Add-on: {item.selectedAddOns.map((a) => a.name).join(", ")}
              </div>
            )}
            {item.specialInstructions && (
              <div className="pl-4 text-[11px] font-bold text-stone-900 bg-stone-100 p-1 rounded-xs">
                *** {item.specialInstructions} ***
              </div>
            )}
          </div>
        ))}
      </div>

      {notes && (
        <div className="py-1.5 border-b border-black text-[11px]">
          <strong className="block">ORDER NOTES:</strong>
          <span>{notes}</span>
        </div>
      )}

      <div className="pt-2 text-center text-[10px] uppercase font-bold">
        -- End of KOT --
      </div>
    </div>
  );
}
