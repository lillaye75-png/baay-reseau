"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import api, { ProductCategory } from "@/lib/api";
import { Plus, Edit, Trash2, Folder, X } from "lucide-react";
import { showToast } from "@/components/ui/Toast";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProductCategory | null>(null);
  const [form, setForm] = useState({ name: "", name_wo: "" });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    api.get("/products/categories/").then((res) => setCategories(res.data));
  };

  const resetForm = () => {
    setForm({ name: "", name_wo: "" });
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (cat: ProductCategory) => {
    setEditing(cat);
    setForm({ name: cat.name, name_wo: cat.name_wo || "" });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await api.put(`/products/categories/${editing.id}`, form);
      showToast("Catégorie modifiée");
    } else {
      await api.post("/products/categories/", form);
      showToast("Catégorie créée");
    }
    resetForm();
    loadCategories();
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Supprimer "${name}" ?`)) {
      await api.delete(`/products/categories/${id}`);
      showToast(`"${name}" supprimé`, "warning");
      loadCategories();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Catégories</h1>
            <p className="text-sm text-gray-500">{categories.length} catégories</p>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {editing ? "Modifier la catégorie" : "Nouvelle catégorie"}
                </h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <Input
                  label="Nom (Français)"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="ex: Électronique"
                />
                <Input
                  label="Nom (Wolof)"
                  value={form.name_wo}
                  onChange={(e) => setForm({ ...form, name_wo: e.target.value })}
                  placeholder="ex: Electronique"
                />
                <div className="col-span-2 flex justify-end gap-2">
                  <Button variant="secondary" type="button" onClick={resetForm}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editing ? "Mettre à jour" : "Enregistrer"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Card key={cat.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                      <Folder className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{cat.name}</p>
                      {cat.name_wo && (
                        <p className="text-xs text-gray-500">{cat.name_wo}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(cat)}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {categories.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Folder className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune catégorie</p>
              <p className="text-sm text-gray-400">Créez des catégories pour organiser vos produits</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
