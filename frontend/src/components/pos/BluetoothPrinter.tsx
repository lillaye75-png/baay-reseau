"use client";

import { useState, useEffect } from "react";
import { Bluetooth, BluetoothOff, Loader2, Check, X } from "lucide-react";
import { showToast } from "@/components/ui/Toast";

interface BluetoothPrinterProps {
  onConnect: (device: any) => void;
  onClose: () => void;
}

export default function BluetoothPrinter({ onConnect, onClose }: BluetoothPrinterProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [deviceName, setDeviceName] = useState<string>("");

  const scanAndConnect = async () => {
    if (!("bluetooth" in navigator)) {
      setError("Bluetooth n'est pas supporté par ce navigateur");
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { services: ["6e400001-b5a3-f393-e0a9-e50e24dcca9e"] },
          { namePrefix: "MPT" },
          { namePrefix: "Blue" },
          { namePrefix: "Printer" },
          { namePrefix: "POS" },
          { namePrefix: "Thermal" },
        ],
        optionalServices: ["6e400001-b5a3-f393-e0a9-e50e24dcca9e"],
      });

      setDeviceName(device.name || "Imprimante inconnue");

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService("6e400001-b5a3-f393-e0a9-e50e24dcca9e");
      const characteristic = await service.getCharacteristic("6e400002-b5a3-f393-e0a9-e50e24dcca9e");

      setConnected(true);
      showToast(`Connecté à ${device.name || "l'imprimante"}`);
      onConnect({ device, characteristic });
    } catch (err: any) {
      if (err.name === "NotFoundError") {
        setError("Aucun appareil sélectionné");
      } else {
        setError("Erreur de connexion: " + err.message);
      }
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Bluetooth className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Imprimante Bluetooth</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {connected ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Connecté !</h4>
              <p className="text-sm text-gray-500">{deviceName}</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Bluetooth className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Connecter une imprimante</h4>
              <p className="text-sm text-gray-500 mb-4">
                Activez le Bluetooth sur votre appareil et cliquez pour scanner
              </p>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4">
                  {error}
                </div>
              )}

              <button
                onClick={scanAndConnect}
                disabled={isScanning}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Recherche en cours...
                  </>
                ) : (
                  <>
                    <Bluetooth className="h-4 w-4" />
                    Scanner les appareils
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {connected ? "Fermer" : "Annuler"}
          </button>
        </div>
      </div>
    </div>
  );
}
