"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Building2, Mail, Phone, MapPin, Calendar, Edit2, Trash2, Users, CheckCircle, XCircle, Clock } from "lucide-react";

interface Consultancy {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  selectedYear: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    students: number;
  };
}

export default function ConsultanciesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [consultancies, setConsultancies] = useState<Consultancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingConsultancy, setEditingConsultancy] = useState<Consultancy | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "PENDING" as "ACTIVE" | "INACTIVE" | "PENDING",
    selectedYear: new Date().getFullYear(),
    adminName: "",
    adminEmail: ""
  });

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (session?.user?.role !== "SUPERADMIN") {
      router.push("/dashboard");
      return;
    }

    fetchConsultancies();
  }, [status, session, router]);

  const fetchConsultancies = async () => {
    try {
      const response = await fetch("/api/admin/consultancies");
      if (!response.ok) throw new Error("Failed to fetch consultancies");
      
      const data = await response.json();
      setConsultancies(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = editingConsultancy 
        ? `/api/admin/consultancies/${editingConsultancy.id}`
        : "/api/admin/consultancies";
      
      const method = editingConsultancy ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to save consultancy");
      }

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        status: "PENDING",
        selectedYear: new Date().getFullYear(),
        adminName: "",
        adminEmail: ""
      });
      setShowCreateForm(false);
      setEditingConsultancy(null);
      
      // Refresh list
      await fetchConsultancies();
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (consultancy: Consultancy) => {
    setEditingConsultancy(consultancy);
    setFormData({
      name: consultancy.name,
      email: consultancy.email,
      phone: consultancy.phone,
      address: consultancy.address,
      status: consultancy.status,
      selectedYear: consultancy.selectedYear,
      adminName: "",
      adminEmail: ""
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this consultancy?")) return;

    try {
      const response = await fetch(`/api/admin/consultancies/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete consultancy");

      await fetchConsultancies();
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800";
      case "INACTIVE": return "bg-red-100 text-red-800";
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE": return CheckCircle;
      case "INACTIVE": return XCircle;
      case "PENDING": return Clock;
      default: return Clock;
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Consultancy Management</h1>
              <p className="text-sm text-gray-600 mt-1">Manage all consultancy accounts</p>
            </div>
            <button
              onClick={() => {
                setShowCreateForm(true);
                setEditingConsultancy(null);
                setFormData({
                  name: "",
                  email: "",
                  phone: "",
                  address: "",
                  status: "PENDING",
                  selectedYear: new Date().getFullYear(),
                  adminName: "",
                  adminEmail: ""
                });
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Consultancy
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Create/Edit Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {editingConsultancy ? "Edit Consultancy" : "Create New Consultancy"}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Consultancy Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {!editingConsultancy && (
                  <>
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-900">Admin Account</p>
                      <p className="text-xs text-gray-500">
                        We&apos;ll email this person a link to set up their password.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Admin Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.adminName}
                        onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Admin Email
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.adminEmail}
                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selected Year
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.selectedYear}
                    onChange={(e) => setFormData({ ...formData, selectedYear: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {editingConsultancy ? "Update" : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingConsultancy(null);
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Consultancies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {consultancies.map((consultancy) => {
            const StatusIcon = getStatusIcon(consultancy.status);
            
            return (
              <div key={consultancy.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <Building2 className="w-8 h-8 text-indigo-600 mr-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{consultancy.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(consultancy.status)}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {consultancy.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(consultancy)}
                      className="text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(consultancy.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    {consultancy.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    {consultancy.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    {consultancy.address}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    Year: {consultancy.selectedYear}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-1" />
                      {consultancy._count.users} users
                    </div>
                    <div className="text-gray-500">
                      {consultancy._count.students} students
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {consultancies.length === 0 && !loading && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No consultancies found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first consultancy</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Consultancy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
