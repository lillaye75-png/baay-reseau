"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X, Loader2 } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scanner = new Html5Qrcode("barcode-reader");
    scannerRef.current = scanner;

    const startScanning = async () => {
      try {
        setIsScanning(true);
        setError(null);

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            onScan(decodedText);
            stopScanning();
          },
          () => {}
        );
      } catch (err) {
        setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
        setIsScanning(false);
      }
    };

    startScanning();

    return () => {
      stopScanning();
    };
  }, []);

  const stopScanning = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch {}
    }
    setIsScanning(false);
  };

  const handleClose = async () => {
    await stopScanning();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary-600" />
            <h3 className="font-semibold">Scanner un code-barres</h3>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div
            ref={containerRef}
            id="barcode-reader"
            className="rounded-xl overflow-hidden bg-gray-900"
            style={{ minHeight: 300 }}
          />

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {isScanning && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Pointez la caméra vers un code-barres...
            </div>
          )}
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={handleClose}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
