import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";
import { FormField, Input, Textarea } from "../../../components/common/Field";
import { rules, validate } from "../../../utils/validators";
import citizenService from "../../../services/citizenService";
import useAuth from "../../../hooks/useAuth";

const INITIAL = {
  name: "",
  email: "",
  mobile: "",
  nic: "",
  address: "",
};

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    citizenService
      .profile()
      .then((data) => {
        setValues({
          name: data.name || "",
          email: data.email || "",
          mobile: data.mobile || "",
          nic: data.nic || "",
          address: data.address || data.area || "",
        });
      })
      .catch(() => {
        toast.error("Failed to load profile details");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const onChange = (field) => (event) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(values, {
      name: [rules.required()],
      email: [rules.required(), rules.email()],
      mobile: [rules.required(), rules.mobile()],
      address: [rules.required()],
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      setSaving(true);
      await citizenService.updateProfile({
        name: values.name,
        email: values.email,
        mobile: values.mobile,
        nic: values.nic,
        address: values.address,
      });
      // Update the AuthContext's cached name if it changed
      if (values.name !== user?.name) {
        login({ ...user, name: values.name });
      }
      toast.success("Profile updated");
      navigate("/citizen/profile");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Edit Profile" description="Update your personal information" />
      <form
        onSubmit={submit}
        className="soft-shadow rounded-2xl border border-border bg-card p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Full Name" htmlFor="name" error={errors.name}>
            <Input id="name" value={values.name} onChange={onChange("name")} error={errors.name} />
          </FormField>
          <FormField label="Email" htmlFor="email" error={errors.email}>
            <Input id="email" type="email" value={values.email} onChange={onChange("email")} error={errors.email} />
          </FormField>
          <FormField label="Mobile" htmlFor="mobile" error={errors.mobile}>
            <Input id="mobile" value={values.mobile} onChange={onChange("mobile")} error={errors.mobile} />
          </FormField>
          <FormField label="NIC" htmlFor="nic">
            <Input id="nic" value={values.nic} onChange={onChange("nic")} />
          </FormField>
          <FormField label="Address" htmlFor="address" error={errors.address} className="sm:col-span-2">
            <Textarea
              id="address"
              className="min-h-[80px]"
              value={values.address}
              onChange={onChange("address")}
              error={errors.address}
            />
          </FormField>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => navigate("/citizen/profile")} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </>
  );
}
