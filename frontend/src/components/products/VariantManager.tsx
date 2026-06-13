"use client";

import { useState, useEffect } from "react";
import { Plus, X, Palette, Ruler } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { showToast } from "@/components/ui/Toast";
import api from "@/lib/api";

interface VariantOption {
  id: string;
  option_type: string;
  option_value: string;
  display_name: string | null;
  hex_color: string | null;
  sort_order: number;
}

interface ProductVariant {
  id: string;
  name: string;
  sku: string | null;
  color: string | null;
  size: string | null;
  price_cfa: number;
  stock_quantity: number;
}

interface VariantManagerProps {
  productId: string;
  basePrice: number;
  onVariantsChange?: (hasVariants: boolean) => void;
}

export default function VariantManager({ productId, basePrice, onVariantsChange }: VariantManagerProps) {
  const [options, setOptions] = useState<VariantOption[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [showAddOption, setShowAddOption] = useState(false);
  const [optionType, setOptionType] = useState<"color" | "size">("color");
  const [optionValue, setOptionValue] = useState("");
  const [hexColor, setHexColor] = useState("#000000");
  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  useEffect(() => {
    loadOptions();
    loadVariants();
  }, [productId]);

  const loadOptions = async () => {
    try {
      const res = await api.get(`/products/${productId}/options`);
      setOptions(res.data);
    } catch {}
  };

  const loadVariants = async () => {
    try {
      const res = await api.get(`/products/${productId}/variants`);
      setVariants(res.data);
      onVariantsChange?.(res.data.length > 0);
    } catch {}
  };

  const addOption = async () => {
    if (!optionValue.trim()) return;
    try {
      await api.post(`/products/${productId}/options`, {
        option_type: optionType,
        option_value: optionValue.trim(),
        display_name: optionValue.trim(),
        hex_color: optionType === "color" ? hexColor : null,
        sort_order: options.filter((o) => o.option_type === optionType).length,
      });
      setOptionValue("");
      setShowAddOption(false);
      loadOptions();
      showToast("Option ajoutée");
    } catch {
      showToast("Erreur", "error");
    }
  };

  const deleteOption = async (optionId: string) => {
    try {
      await api.delete(`/products/${productId}/options/${optionId}`);
      loadOptions();
    } catch {}
  };

  const generateVariants = async () => {
    const colors = options.filter((o) => o.option_type === "color").map((o) => o.option_value);
    const sizes = options.filter((o) => o.option_type === "size").map((o) => o.option_value);

    if (colors.length === 0 && sizes.length === 0) {
      showToast("Ajoutez des options couleur ou taille d'abord", "warning");
      return;
    }

    const combinations: { color?: string; size?: string }[] = [];

    if (colors.length > 0 && sizes.length > 0) {
      for (const color of colors) {
        for (const size of sizes) {
          combinations.push({ color, size });
        }
      }
    } else if (colors.length > 0) {
      colors.forEach((color) => combinations.push({ color }));
    } else {
      sizes.forEach((size) => combinations.push({ size }));
    }

    for (const combo of combinations) {
      const name = [combo.color, combo.size].filter(Boolean).join(" - ");
      try {
        await api.post(`/products/${productId}/variants`, {
          name,
          color: combo.color || null,
          size: combo.size || null,
          price_cfa: basePrice,
          stock_quantity: 0,
        });
      } catch {}
    }

    setShowGenerate(false);
    loadVariants();
    showToast(`${combinations.length} variantes générées`);
  };

  const colors = options.filter((o) => o.option_type === "color");
  const sizes = options.filter((o) => o.option_type === "size");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Variantes</h3>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setOptionType("color"); setShowAddOption(true); }}>
            <Palette className="h-3 w-3 mr-1" /> Couleur
          </Button>
          <Button variant="secondary" size="sm" onClick={() => { setOptionType("size"); setShowAddOption(true); }}>
            <Ruler className="h-3 w-3 mr-1" /> Taille
          </Button>
          {(colors.length > 0 || sizes.length > 0) && (
            <Button size="sm" onClick={() => setShowGenerate(true)}>
              <Plus className="h-3 w-3 mr-1" /> Générer
            </Button>
          )}
        </div>
      </div>

      {colors.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Couleurs</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((opt) => (
              <div key={opt.id} className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5">
                {opt.hex_color && (
                  <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: opt.hex_color }} />
                )}
                <span className="text-sm">{opt.display_name || opt.option_value}</span>
                <button onClick={() => deleteOption(opt.id)} className="text-gray-400 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Tailles</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((opt) => (
              <div key={opt.id} className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5">
                <span className="text-sm">{opt.display_name || opt.option_value}</span>
                <button onClick={() => deleteOption(opt.id)} className="text-gray-400 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {variants.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left">Variante</th>
                <th className="px-3 py-2 text-left">Prix</th>
                <th className="px-3 py-2 text-left">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {variants.map((v) => (
                <tr key={v.id}>
                  <td className="px-3 py-2">{v.name}</td>
                  <td className="px-3 py-2">{v.price_cfa.toLocaleString()} CFA</td>
                  <td className="px-3 py-2">{v.stock_quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddOption && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-semibold mb-4">
              Ajouter une {optionType === "color" ? "couleur" : "taille"}
            </h3>
            <div className="space-y-3">
              <Input
                label={optionType === "color" ? "Nom de la couleur" : "Taille"}
                value={optionValue}
                onChange={(e) => setOptionValue(e.target.value)}
                placeholder={optionType === "color" ? "ex: Rouge" : "ex: XL"}
              />
              {optionType === "color" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Couleur
                  </label>
                  <input
                    type="color"
                    value={hexColor}
                    onChange={(e) => setHexColor(e.target.value)}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setShowAddOption(false)}>
                  Annuler
                </Button>
                <Button onClick={addOption}>Ajouter</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-semibold mb-2">Générer les variantes</h3>
            <p className="text-sm text-gray-500 mb-4">
              Cela créera toutes les combinaisons de{" "}
              {colors.length > 0 && `${colors.length} couleur(s)`}
              {colors.length > 0 && sizes.length > 0 && " × "}
              {sizes.length > 0 && `${sizes.length} taille(s)`}
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowGenerate(false)}>
                Annuler
              </Button>
              <Button onClick={generateVariants}>Générer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
