export function generateESCPOS(data: {
  shopName: string;
  shopPhone: string;
  saleId: string;
  date: string;
  customerName?: string;
  paymentMethod: string;
  items: { name: string; quantity: number; unit_price_cfa: number; total_cfa: number }[];
  total: number;
}): Uint8Array {
  const lines: string[] = [];
  const center = (text: string) => text.padStart(Math.floor((32 + text.length) / 2)).padEnd(32);
  const hr = "================================";

  lines.push("\x1B\x40");
  lines.push("\x1B\x61\x01");
  lines.push(center(data.shopName));
  lines.push(center(data.shopPhone));
  lines.push(center("--- Ticket de caisse ---"));
  lines.push("\x1B\x61\x00");
  lines.push(hr);
  lines.push(`Date:     ${data.date}`);
  lines.push(`Vente #:  ${data.saleId.slice(0, 8).toUpperCase()}`);
  if (data.customerName) lines.push(`Client:   ${data.customerName}`);
  lines.push(`Paiement: ${data.paymentMethod}`);
  lines.push(hr);

  for (const item of data.items) {
    const name = item.name.length > 20 ? item.name.slice(0, 17) + "..." : item.name;
    lines.push(`${name}`);
    lines.push(`  ${item.quantity} x ${item.unit_price_cfa.toLocaleString()} = ${item.total_cfa.toLocaleString()} F`);
  }

  lines.push(hr);
  lines.push("\x1B\x45\x01");
  lines.push(`TOTAL:    ${data.total.toLocaleString()} CFA`);
  lines.push("\x1B\x45\x00");
  lines.push("");
  lines.push("\x1B\x61\x01");
  lines.push(center("Mèrsi, dëgg na tànggi!"));
  lines.push(center("Baay Réseau"));
  lines.push("\x1B\x61\x00");
  lines.push("");
  lines.push("");
  lines.push("\x1B\x69");

  const text = lines.join("\n");
  const encoder = new TextEncoder();
  return encoder.encode(text);
}

export async function printToThermal(data: Parameters<typeof generateESCPOS>[0]) {
  const escpos = generateESCPOS(data);

  if ("bluetooth" in navigator) {
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { services: ["6e400001-b5a3-f393-e0a9-e50e24dcca9e"] },
          { namePrefix: "MPT" },
          { namePrefix: "Blue" },
          { namePrefix: "Printer" },
          { namePrefix: "POS" },
        ],
        optionalServices: ["6e400001-b5a3-f393-e0a9-e50e24dcca9e"],
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService("6e400001-b5a3-f393-e0a9-e50e24dcca9e");
      const characteristic = await service.getCharacteristic("6e400002-b5a3-f393-e0a9-e50e24dcca9e");

      await characteristic.writeValue(escpos);

      return { success: true, method: "bluetooth" };
    } catch (err) {
      console.error("Bluetooth printing failed:", err);
    }
  }

  const blob = new Blob([escpos.buffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt-${data.saleId.slice(0, 8)}.prn`;
  a.click();
  URL.revokeObjectURL(url);

  return { success: true, method: "download" };
}
