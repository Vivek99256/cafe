"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Trash2,
  Shield,
  Coffee,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Mail,
  Phone,
  Clock,
  Sparkles,
  Copy,
  Check,
  MessageCircle,
  KeyRound,
  ExternalLink,
} from "lucide-react";

interface StaffMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  isOwner: boolean;
  createdAt: string;
}

export default function StaffManagementPage() {
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [maxStaff, setMaxStaff] = useState(10);
  const [canManageStaff, setCanManageStaff] = useState(false);
  const [loading, setLoading] = useState(true);

  // Add Member Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"CAFE_MANAGER" | "KITCHEN_STAFF">("KITCHEN_STAFF");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Created Credentials Modal State
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: "CAFE_MANAGER" | "KITCHEN_STAFF";
    loginUrl: string;
  } | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/dashboard/staff");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.memberships || []);
        setMaxStaff(data.maxStaff || 10);
        setCanManageStaff(data.canManageStaff ?? false);
      }
    } catch (err) {
      console.error("Fetch staff error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setModalError("Name, email, and password are required.");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    const enteredName = name.trim();
    const enteredEmail = email.trim();
    const enteredPassword = password;
    const enteredPhone = phone.trim();
    const enteredRole = role;

    try {
      const res = await fetch("/api/dashboard/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: enteredName,
          email: enteredEmail,
          password: enteredPassword,
          phone: enteredPhone || undefined,
          role: enteredRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create staff member");
      }

      const loginUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/login`
          : "https://cafe-flame-two.vercel.app/login";

      // Show credentials popup so manager can copy / share via WhatsApp
      setCreatedCredentials({
        name: enteredName,
        email: enteredEmail,
        password: enteredPassword,
        phone: enteredPhone || undefined,
        role: enteredRole,
        loginUrl,
      });

      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setShowAddModal(false);
      setSuccessMsg(`Account created for ${data.member.name} (${data.member.role})!`);
      setTimeout(() => setSuccessMsg(null), 5000);
      await fetchStaff();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (membershipId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this cafe's staff?`)) return;

    try {
      const res = await fetch(`/api/dashboard/staff/${membershipId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Cannot remove member");
        return;
      }
      await fetchStaff();
    } catch (err) {
      console.error("Delete staff error:", err);
    }
  };

  const getCredentialsShareText = (creds: {
    name: string;
    email: string;
    password: string;
    role: string;
    loginUrl: string;
  }) => {
    const roleTitle =
      creds.role === "KITCHEN_STAFF" ? "Kitchen Staff / Barista" : "Cafe Floor Manager";
    return `☕ *Aura Cafe - Staff Login Account*\n\nHello ${creds.name},\nYour staff login account is ready:\n\n• *Role:* ${roleTitle}\n• *Login URL:* ${creds.loginUrl}\n• *Login Email:* ${creds.email}\n• *Password:* ${creds.password}\n\nPlease log in to view and manage live orders. Welcome to the team!`;
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = getCredentialsShareText(createdCredentials);
    navigator.clipboard.writeText(text);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 2500);
  };

  const handleWhatsAppShare = () => {
    if (!createdCredentials) return;
    const text = getCredentialsShareText(createdCredentials);
    const cleanPhone = createdCredentials.phone?.replace(/[^0-9]/g, "");
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="p-8 text-center py-24">
        <RefreshCw className="w-8 h-8 text-[#C58B5B] animate-spin mx-auto mb-2" />
        <p className="text-xs text-[#24211F]/70">Loading team permissions and roles...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#2B1D18]">
            Team & Staff Role Accounts
          </h1>
          <p className="text-xs text-[#24211F]/70 mt-1">
            Create dedicated logins for your floor managers, baristas, and kitchen line staff.
          </p>
        </div>

        {canManageStaff && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#C58B5B]" />
            <span>+ Add Staff Member (Create Login)</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Plan Capacity Indicator */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-base text-[#2B1D18]">
              Staff Capacity
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF5EC] text-[#2B1D18] border border-[#E6DCCE]">
              {members.length} / {maxStaff} Active Logins
            </span>
          </div>
          <p className="text-xs text-[#24211F]/70">
            {members.length} of {maxStaff} active accounts in use for this cafe.
          </p>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-full sm:w-48 bg-[#FAF5EC] rounded-full h-2.5 overflow-hidden border border-[#E6DCCE]">
            <div
              style={{ width: `${Math.min(100, (members.length / maxStaff) * 100)}%` }}
              className="bg-[#2B1D18] h-full transition-all rounded-full"
            />
          </div>
          {canManageStaff && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 bg-[#C58B5B] hover:bg-[#B37949] text-[#2B1D18] rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Staff</span>
            </button>
          )}
        </div>
      </div>

      {/* STAFF MEMBERS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map((member) => {
          let roleBadge = {
            label: "Kitchen Staff",
            bg: "bg-purple-100 text-purple-900 border-purple-200",
            icon: "👨‍🍳",
          };
          if (member.role === "CAFE_OWNER") {
            roleBadge = {
              label: "Cafe Owner",
              bg: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
              icon: "👑",
            };
          } else if (member.role === "CAFE_MANAGER") {
            roleBadge = {
              label: "Cafe Manager",
              bg: "bg-blue-100 text-blue-900 border-blue-200",
              icon: "📋",
            };
          }

          return (
            <div
              key={member.id}
              className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#C58B5B] transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FAF5EC] border border-[#E6DCCE] flex items-center justify-center font-bold text-sm text-[#2B1D18]">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-sm text-[#2B1D18]">
                        {member.name}
                      </h3>
                      <span className="text-[11px] text-[#24211F]/60 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-[#C58B5B]" />
                        {member.email}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${roleBadge.bg}`}
                  >
                    <span>{roleBadge.icon}</span>
                    <span>{roleBadge.label}</span>
                  </span>
                </div>

                <div className="text-xs text-[#24211F]/70 pt-2 border-t border-[#FAF5EC] space-y-1">
                  {member.phone && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Phone className="w-3 h-3 text-[#75856B]" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[11px] text-[#24211F]/50">
                    <Clock className="w-3 h-3" />
                    <span>Added {new Date(member.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {canManageStaff && !member.isOwner && (
                <div className="pt-2 border-t border-[#FAF5EC] flex justify-end">
                  <button
                    onClick={() => handleDeleteMember(member.id, member.name)}
                    className="text-stone-400 hover:text-rose-600 text-xs font-semibold flex items-center gap-1 p-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Access</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ADD STAFF MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#2B1D18]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6DCCE]">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#2B1D18]">
                  Add Staff Member
                </h3>
                <p className="text-xs text-[#24211F]/60">
                  Provision a dedicated team login for this cafe
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#24211F]/60 hover:text-[#2B1D18] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                  Login Email (Username) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="kitchen.staff@auracafe.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#24211F]/80">
                    Initial Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setPassword("Cafe@" + Math.floor(1000 + Math.random() * 9000))}
                    className="text-[11px] text-[#C58B5B] hover:underline font-medium"
                  >
                    Generate Random
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Set initial password (e.g. Kitchen@123)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                  Phone Number (Optional - for WhatsApp credentials)
                </label>
                <input
                  type="tel"
                  placeholder="+91 98200 99887"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#24211F]/80 mb-2">
                  Assign Operational Role *
                </label>

                <div className="space-y-2">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      role === "KITCHEN_STAFF"
                        ? "border-[#C58B5B] bg-[#F7EFE8]"
                        : "border-[#E6DCCE] bg-[#FAF5EC]/60 hover:bg-[#FAF5EC]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="staffRole"
                      checked={role === "KITCHEN_STAFF"}
                      onChange={() => setRole("KITCHEN_STAFF")}
                      className="mt-0.5 text-[#C58B5B] focus:ring-[#C58B5B]"
                    />
                    <div>
                      <span className="block font-bold text-xs text-[#2B1D18]">
                        👨‍🍳 Kitchen / Barista Staff
                      </span>
                      <p className="text-[11px] text-[#24211F]/70 leading-relaxed mt-0.5">
                        Dedicated live kitchen display access. When they log in, they go directly to Live Orders to accept tickets, print KOTs, and advance order statuses (Preparing, Ready, Served).
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      role === "CAFE_MANAGER"
                        ? "border-[#C58B5B] bg-[#F7EFE8]"
                        : "border-[#E6DCCE] bg-[#FAF5EC]/60 hover:bg-[#FAF5EC]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="staffRole"
                      checked={role === "CAFE_MANAGER"}
                      onChange={() => setRole("CAFE_MANAGER")}
                      className="mt-0.5 text-[#C58B5B] focus:ring-[#C58B5B]"
                    />
                    <div>
                      <span className="block font-bold text-xs text-[#2B1D18]">
                        📋 Cafe Manager
                      </span>
                      <p className="text-[11px] text-[#24211F]/70 leading-relaxed mt-0.5">
                        Can manage live orders, edit menu items & prices, manage dining tables & QR codes, manage staff accounts, and view sales analytics.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {modalError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                >
                  {isSubmitting ? "Creating Account..." : "Create Staff Account"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-[#E6DCCE] text-[#24211F]/70 hover:bg-[#FAF5EC] rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDENTIALS READY / SHARE MODAL */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 bg-[#2B1D18]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-[#E6DCCE]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#2B1D18]">
                    Account Created Successfully!
                  </h3>
                  <p className="text-xs text-[#24211F]/70">
                    Share these login details with your staff member so they can log in.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreatedCredentials(null)}
                className="text-[#24211F]/50 hover:text-[#2B1D18] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Credential Details Card */}
            <div className="bg-[#2B1D18] text-[#FAF5EC] rounded-xl p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#3D2B24] font-sans">
                <span className="text-[11px] text-[#C58B5B] font-bold uppercase tracking-wider">
                  Operational Account Details
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-900/60 text-purple-200 border border-purple-700/50">
                  {createdCredentials.role === "KITCHEN_STAFF" ? "👨‍🍳 Kitchen Staff" : "📋 Cafe Manager"}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-[#3D2B24]/40">
                  <span className="text-stone-400 font-sans">Name:</span>
                  <span className="font-semibold text-[#FAF5EC]">{createdCredentials.name}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#3D2B24]/40">
                  <span className="text-stone-400 font-sans">Login Email (ID):</span>
                  <span className="font-semibold text-emerald-300">{createdCredentials.email}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#3D2B24]/40">
                  <span className="text-stone-400 font-sans">Password:</span>
                  <span className="font-bold text-amber-300 bg-[#3D2B24] px-2 py-0.5 rounded">
                    {createdCredentials.password}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-stone-400 font-sans">Login Portal:</span>
                  <span className="text-xs text-[#C58B5B] underline truncate max-w-[220px]">
                    {createdCredentials.loginUrl}
                  </span>
                </div>
              </div>
            </div>

            {/* Kitchen Staff Tip */}
            {createdCredentials.role === "KITCHEN_STAFF" && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2">
                <Coffee className="w-4 h-4 shrink-0 text-[#C58B5B]" />
                <p className="text-[11px]">
                  <strong>Kitchen Display Ready:</strong> When logging in at <code>/login</code>, this staff member will automatically be directed straight to the Live Kitchen Orders board.
                </p>
              </div>
            )}

            {/* Action Buttons: WhatsApp & Copy */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={handleCopyCredentials}
                className="flex-1 py-2.5 px-3 bg-[#FAF5EC] hover:bg-[#F3EAD8] text-[#2B1D18] border border-[#E6DCCE] font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copiedCredentials ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#C58B5B]" />
                    <span>Copy Login Details</span>
                  </>
                )}
              </button>

              <button
                onClick={handleWhatsAppShare}
                className="flex-1 py-2.5 px-3 bg-[#25D366] hover:bg-[#20BE5A] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send via WhatsApp</span>
              </button>
            </div>

            <div className="pt-2 border-t border-[#E6DCCE] flex justify-end">
              <button
                onClick={() => setCreatedCredentials(null)}
                className="px-5 py-2 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] text-xs font-bold rounded-xl cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

