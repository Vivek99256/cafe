import Image from "next/image";
import { QrCode, Sparkles } from "lucide-react";

interface PrintableTentCardProps {
  cafeName: string;
  cafeLogo?: string | null;
  tableNumber: string;
  label?: string | null;
  qrDataUrl: string;
}

export default function PrintableTentCard({
  cafeName,
  cafeLogo,
  tableNumber,
  label,
  qrDataUrl,
}: PrintableTentCardProps) {
  return (
    <div className="printable-card bg-white text-stone-900 border-2 border-stone-800 rounded-2xl p-8 max-w-sm mx-auto shadow-md text-center space-y-4">
      {/* Header with Logo */}
      <div className="flex flex-col items-center space-y-2">
        {cafeLogo ? (
          <div className="w-14 h-14 rounded-full overflow-hidden relative border border-stone-300">
            <Image src={cafeLogo} alt={cafeName} fill className="object-cover" />
          </div>
        ) : null}
        <h2 className="font-serif text-xl font-bold tracking-tight text-stone-900">
          {cafeName}
        </h2>
        <span className="text-[10px] uppercase tracking-widest font-bold text-stone-500">
          Digital Table Service
        </span>
      </div>

      {/* Table Badge */}
      <div className="bg-stone-100 py-2 px-4 rounded-xl border border-stone-200 inline-block">
        <span className="block text-[10px] uppercase font-bold text-stone-600">Table</span>
        <span className="block font-serif text-3xl font-extrabold text-stone-900">
          {tableNumber}
        </span>
        {label && <span className="block text-xs text-stone-500">{label}</span>}
      </div>

      {/* QR Code */}
      <div className="flex justify-center p-3 bg-stone-50 rounded-2xl border border-stone-200">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt={`QR Code for Table ${tableNumber}`}
            className="w-48 h-48 rounded-lg"
          />
        ) : (
          <div className="w-48 h-48 flex items-center justify-center bg-stone-200 text-stone-400">
            <QrCode className="w-12 h-12" />
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="space-y-1 text-xs text-stone-600">
        <p className="font-bold text-stone-900 flex items-center justify-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          Scan with your phone camera
        </p>
        <p className="text-[11px] text-stone-500">
          Browse digital menu • Customize your coffee • Order to table
        </p>
      </div>

      <div className="pt-2 text-[9px] text-stone-400 uppercase tracking-widest border-t border-stone-100">
        Powered by Aura Cafe SaaS
      </div>
    </div>
  );
}
