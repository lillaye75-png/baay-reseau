"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { formatCFA } from "@/lib/format";
import api, { Customer } from "@/lib/api";
import { Plus, Edit, Trash2, Phone, Search, X, History, Download, Upload } from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import { exportCustomers } from "@/lib/export";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    whatsapp_number: "",
    nickname: "",
    notes: "",
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = () => {
    api.get("/customers/").then((res) => setCustomers(res.data));
  };

  const resetForm = () => {
    setForm({ name: "", phone: "", whatsapp_number: "", nickname: "", notes: "" });
    setEditingCustomer(null);
    setShowForm(false);
  };

  const startEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      phone: customer.phone || "",
      whatsapp_number: customer.whatsapp_number || "",
      nickname: customer.nickname || "",
      notes: customer.notes || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      await api.put(`/customers/${editingCustomer.id}`, form);
      showToast("Client modifié avec succès");
    } else {
      await api.post("/customers/", form);
      showToast("Client ajouté avec succès");
    }
    resetForm();
    loadCustomers();
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Supprimer le client "${name}" ?`)) {
      await api.delete(`/customers/${id}`);
      showToast(`"${name}" supprimé`, "warning");
      loadCustomers();
    }
  };

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.nickname && c.nickname.toLowerCase().includes(search.toLowerCase())) ||
    (c.phone && c.phone.includes(search))
  );

  const totalDebt = customers.reduce((sum, c) => sum + c.total_credit_cfa, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
            <p className="text-sm text-gray-500">
              {customers.length} clients | Dette totale: {formatCFA(totalDebt)}
            </p>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un client
          </Button>
          <Button variant="secondary" onClick={() => exportCustomers(customers)}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
            <Upload className="h-4 w-4" />
            Importer CSV
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const formData = new FormData();
                formData.append("file", file);
                try {
                  const res = await api.post("/customers/import-csv", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                  });
                  showToast(`${res.data.imported} client(s) importé(s), ${res.data.skipped} ignoré(s)`);
                  loadCustomers();
                } catch {
                  showToast("Erreur lors de l'import", "error");
                }
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {editingCustomer ? "Modifier le client" : "Nouveau client"}
                </h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <Input
                  label="Nom complet"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <Input
                  label="Surnom (Wolof)"
                  value={form.nickname}
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                  placeholder="ex: Amadou baye"
                />
                <Input
                  label="Téléphone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="771234567"
                />
                <Input
                  label="WhatsApp"
                  value={form.whatsapp_number}
                  onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                  placeholder="221771234567"
                />
                <div className="col-span-2">
                  <Input
                    label="Notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Notes sur le client..."
                  />
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  <Button variant="secondary" type="button" onClick={resetForm}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingCustomer ? "Mettre à jour" : "Enregistrer"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      {customer.nickname && (
                        <p className="text-xs text-gray-500">{customer.nickname}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(customer)}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id, customer.name)}
                      className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {customer.phone && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="h-3 w-3" />
                    {customer.phone}
                  </div>
                )}
                {customer.total_credit_cfa > 0 && (
                  <div className="mt-3">
                    <Badge variant="danger">
                      Dette: {formatCFA(customer.total_credit_cfa)}
                    </Badge>
                  </div>
                )}
                <Link
                  href={`/customers/${customer.id}`}
                  className="mt-3 flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  <History className="h-3 w-3" />
                  Voir l&apos;historique
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">Aucun client trouvé</p>
              <p className="text-sm text-gray-400">Ajoutez votre premier client</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
