import React, { useEffect, useState } from "react";
import { User, Mail, MapPin, Plus, Trash2, Loader2, Phone } from "lucide-react";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import userService, { type UserAddress, type AddressPayload } from "../../services/userService";
import authService from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { fetchAddressByPincode } from "../../utils/pincode";

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<AddressPayload>({
    label: "",
    line1: "",
    line2: "",
    landmark: "",
    city: "",
    pincode: "",
  });

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, addrRes] = await Promise.all([
        userService.getProfile(),
        userService.getAddresses(),
      ]);
      setName(profileRes.data.name);
      setPhone(profileRes.data.phone);
      setEmail(profileRes.data.email);
      setAddresses(addrRes.data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    const pincode = form.pincode;
    if (pincode.length === 6) {
      fetchAddressByPincode(pincode).then((details) => {
        if (details) {
          setForm((f) => ({
            ...f,
            city: details.city,
            line2: details.area,
          }));
        }
      });
    }
  }, [form.pincode]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await userService.updateProfile({ name, phone });
      const token = authService.getToken();
      const saved = authService.getSavedUser();
      if (token && saved) {
        authService.saveSession(token, {
          ...saved,
          name: res.data.name,
          phone: res.data.phone,
        });
      }
      setSuccess("Profile updated successfully");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await userService.addAddress({
        label: form.label,
        line1: form.line1,
        line2: form.line2 || undefined,
        landmark: form.landmark || undefined,
        city: form.city,
        pincode: form.pincode,
      });
      setAddresses((prev) => [res.data, ...prev]);
      setForm({ label: "", line1: "", line2: "", landmark: "", city: "", pincode: "" });
      setSuccess("Address added successfully");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add address");
    } finally {
      setAddressSaving(false);
    }
  };

  const removeAddress = async (id: string) => {
    setError(null);
    try {
      await userService.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a._id !== id));
      setSuccess("Address removed");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete address");
    }
  };

  const displayName = name || user?.name || "User";

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col gap-6 h-fit">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-black text-3xl shadow-lg shadow-orange-500/20 mb-4 select-none">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-200">{displayName}</h3>
          <span className="text-xs text-slate-400 font-semibold">{email}</span>
        </div>

        {(error || success) && (
          <p
            className={`text-xs font-semibold text-center ${error ? "text-red-500" : "text-emerald-500"}`}
          >
            {error || success}
          </p>
        )}

        <form onSubmit={saveProfile} className="flex flex-col gap-4">
          <Input
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={<User className="w-4 h-4" />}
            required
          />
          <Input
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            icon={<Phone className="w-4 h-4" />}
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={email}
            disabled
            icon={<Mail className="w-4 h-4" />}
            className="opacity-60 cursor-not-allowed"
          />
          <Button variant="primary" className="w-full mt-2" disabled={saving}>
            {saving ? "Saving..." : "Save Details"}
          </Button>
        </form>
      </div>

      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
          <h3 className="font-black text-lg mb-4 text-slate-800 dark:text-slate-200">Delivery Addresses</h3>

          {addresses.length === 0 ? (
            <p className="text-sm text-slate-500">No addresses saved yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {addresses.map((address) => (
                <div
                  key={address._id}
                  className="flex items-start justify-between gap-4 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        {address.label}
                        {address.isDefault && (
                          <span className="ml-2 text-[10px] text-orange-500 font-bold">DEFAULT</span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ""}
                        {address.landmark ? `, ${address.landmark}` : ""}, {address.city} –{" "}
                        {address.pincode}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeAddress(address._id)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
          <h3 className="font-black text-lg mb-4 text-slate-800 dark:text-slate-200">Add New Address</h3>
          <form onSubmit={addAddress} className="flex flex-col gap-4">
            <Input
              label="Address Label (e.g. Home, Office)"
              type="text"
              required
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="Home"
            />
            <Input
              label="Address Line 1"
              type="text"
              required
              value={form.line1}
              onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
              placeholder="Flat, Building, Street"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="City"
                type="text"
                required
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="Gurgaon"
              />
              <Input
                label="Pincode"
                type="text"
                required
                value={form.pincode}
                onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
                placeholder="122001"
              />
            </div>
            <Input
              label="Line 2 (optional)"
              type="text"
              value={form.line2 ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))}
              placeholder="Area, Sector"
            />
            <Input
              label="Landmark (optional)"
              type="text"
              value={form.landmark ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))}
              placeholder="Near metro station"
            />
            <Button
              type="submit"
              variant="secondary"
              className="w-full flex items-center justify-center gap-1.5"
              disabled={addressSaving}
            >
              <Plus className="w-4 h-4" />
              {addressSaving ? "Adding..." : "Add Address"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default Profile;
