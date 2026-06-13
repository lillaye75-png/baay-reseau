"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { formatCFA } from "@/lib/format";
import api, { Product } from "@/lib/api";
import { Plus, Edit, Trash2, Search, X, PackagePlus, PackageMinus, Package, Download, Globe, Camera } from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import { exportProducts } from "@/lib/export";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "",
    price_cfa: 0,
    cost_price_cfa: 0,
    stock_quantity: 0,
    low_stock_threshold: 5,
    unit: "piece",
    sku: "",
    barcode: "",
  });
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    api.get("/products/").then((res) => setProducts(res.data));
  };

  const resetForm = () => {
    setForm({ name: "", price_cfa: 0, cost_price_cfa: 0, stock_quantity: 0, low_stock_threshold: 5, unit: "piece", sku: "", barcode: "" });
    setEditingProduct(null);
    setShowForm(false);
    setImageFile(null);
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      price_cfa: product.price_cfa,
      cost_price_cfa: product.cost_price_cfa,
      stock_quantity: product.stock_quantity,
      low_stock_threshold: product.low_stock_threshold,
      unit: product.unit,
      sku: product.sku || "",
      barcode: product.barcode || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let productId: string;
    if (editingProduct) {
      await api.put(`/products/${editingProduct.id}`, form);
      productId = editingProduct.id;
      showToast("Produit modifié avec succès");
    } else {
      const res = await api.post("/products/", form);
      productId = res.data.id;
      showToast("Produit ajouté avec succès");
    }
    if (imageFile && productId) {
      const formData = new FormData();
      formData.append("file", imageFile);
      await api.post(`/products/${productId}/image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }).catch(() => {});
    }
    resetForm();
    loadProducts();
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Supprimer "${name}" ?`)) {
      await api.delete(`/products/${id}`);
      showToast(`"${name}" supprimé`, "warning");
      loadProducts();
    }
  };

  const handleAdjustStock = async () => {
    if (!adjustingProduct || adjustQty === 0) return;
    try {
      const res = await api.post(`/sales/${adjustingProduct.id}/adjust-stock`, { quantity: adjustQty });
      showToast(`Stock de "${adjustingProduct.name}" mis à jour: ${res.data.stock_quantity}`);
      setAdjustingProduct(null);
      setAdjustQty(0);
      loadProducts();
    } catch (err) {
      showToast("Erreur lors de l'ajustement", "error");
    }
  };

  const handleImageUpload = async (productId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.post(`/products/${productId}/image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showToast("Image uploadée");
      loadProducts();
    } catch {
      showToast("Erreur d'upload", "error");
    }
  };

  const toggleOnline = async (productId: string, isOnline: boolean) => {
    try {
      await api.put(`/storefront/products/${productId}/online`, { is_online: !isOnline });
      showToast(isOnline ? "Retiré de la boutique" : "Ajouté à la boutique");
      loadProducts();
    } catch {
      showToast("Erreur", "error");
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Produits</h1>
            <p className="text-sm text-gray-500">{products.length} produits au total</p>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un produit
          </Button>
          <Button variant="secondary" onClick={() => exportProducts(products)}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {editingProduct ? "Modifier le produit" : "Nouveau produit"}
                </h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <Input
                  label="Nom du produit"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <Input
                  label="SKU"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="ex: CHG-001"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code-barres</label>
                  <div className="flex gap-2">
                    <Input
                      value={form.barcode}
                      onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                      placeholder="Scanner ou entrer le code"
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const scanner = new (window as any).Html5Qrcode("barcode-scanner-modal");
                        scanner.start(
                          { facingMode: "environment" },
                          { fps: 10, qrbox: { width: 250, height: 250 } },
                          (text: string) => {
                            setForm({ ...form, barcode: text });
                            scanner.stop();
                          },
                          () => {}
                        );
                      }}
                      className="flex items-center gap-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  <div id="barcode-scanner-modal" className="hidden" />
                </div>
                <Input
                  label="Prix de vente (CFA)"
                  type="number"
                  value={form.price_cfa}
                  onChange={(e) => setForm({ ...form, price_cfa: parseInt(e.target.value) || 0 })}
                  required
                />
                <Input
                  label="Prix d'achat (CFA)"
                  type="number"
                  value={form.cost_price_cfa}
                  onChange={(e) => setForm({ ...form, cost_price_cfa: parseInt(e.target.value) || 0 })}
                />
                <Input
                  label="Stock"
                  type="number"
                  value={form.stock_quantity}
                  onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })}
                />
                <Input
                  label="Seuil stock bas"
                  type="number"
                  value={form.low_stock_threshold}
                  onChange={(e) => setForm({ ...form, low_stock_threshold: parseInt(e.target.value) || 5 })}
                />
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Images du produit</label>
                  <div className="flex items-start gap-4">
                    <label className="cursor-pointer">
                      <div className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-primary-500 transition-colors overflow-hidden">
                        {imageFile ? (
                          <img src={URL.createObjectURL(imageFile)} alt="Preview" className="h-full w-full object-cover" />
                        ) : editingProduct?.image_url ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${editingProduct.image_url}`}
                            alt="Current" className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                    </label>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Cliquez pour {editingProduct ? "changer" : "ajouter"} une image</p>
                      <p className="text-xs text-gray-400">JPG, PNG — max 5 MB</p>
                      {editingProduct && (
                        <p className="text-xs text-primary-600 mt-1">Ajoutez plus d&apos;images depuis le tableau des produits (icône image)</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  <Button variant="secondary" type="button" onClick={resetForm}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingProduct ? "Mettre à jour" : "Enregistrer"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Rechercher un produit ou SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {adjustingProduct && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Ajuster le stock de &ldquo;{adjustingProduct.name}&rdquo;</h3>
                    <p className="text-sm text-gray-500">Stock actuel: {adjustingProduct.stock_quantity} {adjustingProduct.unit}</p>
                  </div>
                </div>
                <button onClick={() => { setAdjustingProduct(null); setAdjustQty(0); }} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-end gap-3">
                <div className="w-48">
                  <Input
                    label="Quantité (+ ajout, - retrait)"
                    type="number"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setAdjustQty(5)}>
                    <PackagePlus className="h-3 w-3 mr-1" /> +5
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setAdjustQty(10)}>
                    <PackagePlus className="h-3 w-3 mr-1" /> +10
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setAdjustQty(-1)}>
                    <PackageMinus className="h-3 w-3 mr-1" /> -1
                  </Button>
                  <Button onClick={handleAdjustStock} disabled={adjustQty === 0}>
                    Appliquer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Prix</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer flex-shrink-0">
                          {product.image_url ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${product.image_url}`}
                              alt={product.name}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200">
                              <Package className="h-4 w-4" />
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(product.id, file);
                            }}
                          />
                        </label>
                        <span className="text-sm font-medium text-gray-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{product.sku || "-"}</td>
                    <td className="px-6 py-4 text-sm text-right font-medium">{formatCFA(product.price_cfa)}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      <span className={product.stock_quantity <= product.low_stock_threshold ? "text-red-600 font-bold" : ""}>
                        {product.stock_quantity} {product.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {product.stock_quantity <= product.low_stock_threshold ? (
                        <Badge variant="danger">Stock bas</Badge>
                      ) : (
                        <Badge variant="success">OK</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleOnline(product.id, (product as any).is_online || false)}
                          className={`p-1 rounded ${product.is_online ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                          title={product.is_online ? "En ligne" : "Hors ligne"}
                        >
                          <Globe className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setAdjustingProduct(product); setAdjustQty(0); }}
                          className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                          title="Ajuster le stock"
                        >
                          <Package className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => startEdit(product)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
