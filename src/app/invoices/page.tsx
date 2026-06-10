import { db } from "@/lib/db";
import { InvoiceClient } from "./components/invoice-client";

export const metadata = {
  title: "Invoices & PIs | CRM Portal",
  description: "Create, edit, preview, and generate Excel and PDF Invoices and Proforma Invoices.",
};

export default async function InvoicesPage() {
  const customers = await db.customer.findMany({
    orderBy: { customerName: "asc" },
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      <InvoiceClient dbCustomers={customers} />
    </div>
  );
}
