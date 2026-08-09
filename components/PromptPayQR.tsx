"use client";

import { useEffect, useState } from "react";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";
import { Loader2 } from "lucide-react";

interface PromptPayQRProps {
  promptpayId: string;
  amount: number;
}

export function PromptPayQR({ promptpayId, amount }: PromptPayQRProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!promptpayId || amount <= 0) {
      setDataUrl(null);
      return;
    }
    try {
      const payload = generatePayload(promptpayId, { amount });
      QRCode.toDataURL(payload, { width: 260, margin: 1 })
        .then(setDataUrl)
        .catch((err) => setError(err.message || "สร้าง QR ไม่สำเร็จ"));
    } catch (err: any) {
      setError(err.message || "สร้าง QR ไม่สำเร็จ");
    }
  }, [promptpayId, amount]);

  if (error) {
    return <p className="text-red-500 text-xs text-center">{error}</p>;
  }

  if (!dataUrl) {
    return (
      <div className="w-[220px] h-[220px] flex items-center justify-center glass-panel rounded-xl">
        <Loader2 className="animate-spin text-brand-300" size={28} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="bg-white p-3 rounded-xl border border-white/70 shadow-glass-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt="PromptPay QR" width={220} height={220} />
      </div>
      <p className="text-xs text-slate-400">สแกนเพื่อชำระผ่าน PromptPay</p>
    </div>
  );
}
