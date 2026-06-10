"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { Customer } from "@prisma/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CustomerClientProps {
  data: Customer[];
}

export function CustomerClient({ data }: CustomerClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("Gujarat");
  const [gstin, setGstin] = useState("");
  const [stateCode, setStateCode] = useState("24");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setCompanyName("");
    setCustomerName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCity("");
    setCountry("");
    setState("Gujarat");
    setGstin("");
    setStateCode("24");
    setNotes("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName || companyName.trim() === "") {
      toast.error("Company name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName,
          customerName,
          email: email || undefined,
          phone,
          address,
          city,
          country,
          state,
          gstin,
          stateCode,
          notes,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Failed to create customer");
      }

      toast.success(resData.message || "Customer created successfully!");
      setOpen(false);
      resetForm();
      router.refresh(); // Refresh database contents in the client table

    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">
            Manage your customers and leads.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </div>
      <DataTable searchKey="companyName" columns={columns} data={data} />

      {/* Customer Create Modal Dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add New Customer</DialogTitle>
            <DialogDescription>
              Fill out the customer information below to save it to the CRM portal database.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="font-semibold">Company / Billing Name *</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. ADK Engineering & Solutions"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerName" className="font-semibold">Contact Person (Attention Name)</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Mr. Paresh Thakkar"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. contact@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-semibold">Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 98251 78489"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="font-semibold">Address Line 1</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 107, Palace Plaza"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="font-semibold">Address Line 2 (City)</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Jawahar Nehru Road"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country" className="font-semibold">Address Line 3 (Country / Zip)</Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. India - 390001"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="state" className="font-semibold">State Name</Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Gujarat"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stateCode" className="font-semibold">State Code</Label>
                <Input
                  id="stateCode"
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value)}
                  placeholder="e.g. 24"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstin" className="font-semibold">GSTIN</Label>
              <Input
                id="gstin"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="e.g. 24ABEFA1383M1ZF"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="font-semibold">Internal Notes / Comments</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this customer..."
              />
            </div>

            <DialogFooter className="pt-4 border-t flex flex-row items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Customer"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
