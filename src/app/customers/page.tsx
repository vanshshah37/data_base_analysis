import { db } from "@/lib/db";
import { CustomerClient } from "./components/client";

export default async function CustomersPage() {
  const customers = await db.customer.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <CustomerClient data={customers} />
    </div>
  );
}
