import { useState, useEffect } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Avatar from "../../../components/common/Avatar";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";
import Modal from "../../../components/common/Modal";
import { FormField, Input, Select } from "../../../components/common/Field";
import adminService from "../../../services/adminService";

export default function ManagePHIs() {
  const [phis, setPhis] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    area: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [phisData, areasData] = await Promise.all([
        adminService.phis(),
        adminService.areas()
      ]);
      setPhis(Array.isArray(phisData) ? phisData : []);
      setAreas(Array.isArray(areasData) ? areasData : []);
    } catch (error) {
      console.error("Failed to load PHI data:", error);
      toast.error(error?.response?.data?.message ?? "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", email: "", password: "", mobile: "", area: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (phi) => {
    setEditingId(phi.id);
    setFormData({
      name: phi.name || "",
      email: phi.email || "",
      password: "", // Leave blank for edit
      mobile: phi.mobile || "",
      area: phi.area || "",
    });
    setIsModalOpen(true);
  };

  const handleSavePhi = async () => {
    try {
      setIsSubmitting(true);
      if (editingId) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password; // Don't update if empty
        const updated = await adminService.updateUser(editingId, payload);
        
        // If area changed and we have the area assignment logic
        if (formData.area && formData.area !== phis.find(p => p.id === editingId)?.area) {
           const selectedArea = areas.find(a => a.name.toLowerCase() === formData.area.toLowerCase());
           if (selectedArea) {
             await adminService.assignArea(editingId, selectedArea.id).catch(() => {});
           }
        }
        
        setPhis((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...updated } : p)));
        toast.success("PHI updated successfully");
      } else {
        const newPhi = await adminService.createPhi(formData);
        
        // Assign area if found in existing areas
        if (formData.area) {
           const selectedArea = areas.find(a => a.name.toLowerCase() === formData.area.toLowerCase());
           if (selectedArea) {
             await adminService.assignArea(newPhi.id, selectedArea.id).catch(() => {});
             newPhi.area = selectedArea.name;
           }
        }
        
        setPhis((prev) => [...prev, newPhi]);
        toast.success("PHI added successfully");
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save PHI");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this PHI?")) return;
    try {
      await adminService.deleteUser(id);
      setPhis((prev) => prev.filter((p) => p.id !== id));
      toast.success("PHI deleted");
    } catch (error) {
      toast.error("Failed to delete PHI");
    }
  };

  return (
    <>
      <PageHeader
        title="Manage PHIs"
        description={loading ? "Loading..." : `${phis.length} inspectors`}
        action={
          <Button onClick={openAddModal}>
            <Plus className="h-4 w-4" /> Add PHI
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {phis.map((phi) => (
          <div key={phi.id} className="soft-shadow rounded-2xl border border-border bg-card p-5 flex flex-col">
            <div className="flex items-start gap-3">
              <Avatar name={phi.name} className="h-12 w-12" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold">{phi.name}</h3>
                  <Badge
                    className={
                      phi.status === "Active"
                        ? "bg-success/15 text-success"
                        : "bg-warning/15 text-warning"
                    }
                  >
                    {phi.status}
                  </Badge>
                </div>
                <p className="truncate text-xs text-muted-foreground">{phi.email}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">📍 {phi.area || "Unassigned"}</p>
              </div>
            </div>
            
            <div className="mt-4 rounded-xl bg-muted/40 p-3 text-center text-xs">
              <div className="text-lg font-bold">{phi.inspections || 0}</div>
              <div className="text-muted-foreground">Inspections Completed</div>
            </div>
            
            <div className="mt-auto pt-4 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditModal(phi)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                onClick={() => handleDelete(phi.id)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit PHI" : "Add New PHI"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePhi} disabled={isSubmitting || !formData.name || !formData.email || (!editingId && !formData.password)}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Full Name" htmlFor="name">
            <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Nimal Perera" />
          </FormField>
          <FormField label="Email Address" htmlFor="email">
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="nimal@moh.lk" />
          </FormField>
          <FormField label={editingId ? "Password (leave blank to keep current)" : "Password"} htmlFor="password">
            <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" />
          </FormField>
          <FormField label="Mobile Number" htmlFor="mobile">
            <Input id="mobile" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="0712345678" />
          </FormField>
          <FormField label="Assigned Area" htmlFor="area">
            <Input id="area" name="area" value={formData.area} onChange={handleChange} placeholder="Colombo" />
          </FormField>
        </div>
      </Modal>
    </>
  );
}
