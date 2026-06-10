import React from "react";

interface InvoicePrintViewProps {
  type: "invoice" | "pi";
  invoiceNo: string;
  date: string;
  bookNo?: string;
  buyerOrderNo?: string;
  buyerOrderDate?: string;
  deliveryNote?: string;
  paymentTerms?: string;
  despatchedThrough?: string;
  destination?: string;
  vehicleNo?: string;
  customer: {
    name: string;
    addressLine1: string;
    addressLine2: string;
    addressLine3: string;
    phone: string;
    gstin: string;
    stateName: string;
    stateCode: string;
    attention?: string;
  };
  consignee?: {
    name: string;
    addressLine1: string;
    addressLine2: string;
    addressLine3: string;
    gstin: string;
    stateName: string;
    stateCode: string;
  };
  items: Array<{
    name: string;
    description: string;
    serialNumbers?: string;
    hsn: string;
    per?: string;
    qty: number;
    rate: number;
    gstRate: number;
  }>;
  totals: {
    gross: number;
    cgst: number;
    sgst: number;
    grand: number;
  };
}

function numberToWordsIndian(num: number): string {
  const a = [
    "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"
  ];
  const b = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

  function g(n: number): string {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit !== 0 ? " " + a[digit] : "");
  }

  function convert(n: number): string {
    if (n === 0) return "";
    let str = "";
    if (n >= 10000000) {
      str += convert(Math.floor(n / 10000000)) + " crore ";
      n %= 10000000;
    }
    if (n >= 100000) {
      str += convert(Math.floor(n / 100000)) + " lakh ";
      n %= 100000;
    }
    if (n >= 1000) {
      str += convert(Math.floor(n / 1000)) + " thousand ";
      n %= 1000;
    }
    if (n >= 100) {
      str += g(Math.floor(n / 100)) + " hundred ";
      n %= 100;
    }
    if (n > 0) {
      if (str !== "") str += "and ";
      str += g(n);
    }
    return str.trim();
  }

  if (num === 0) return "INDIAN RUPEES ZERO ONLY";
  const intPart = Math.floor(num);
  const decimalPart = Math.round((num - intPart) * 100);

  let result = "INDIAN RUPEES " + convert(intPart).toUpperCase();
  if (decimalPart > 0) {
    result += " AND " + convert(decimalPart).toUpperCase() + " PAISE";
  }
  result += " ONLY";
  return result;
}

export const InvoicePrintView: React.FC<InvoicePrintViewProps> = ({
  type,
  invoiceNo,
  date,
  bookNo = "2",
  buyerOrderNo = "",
  buyerOrderDate = "",
  deliveryNote = "",
  paymentTerms = "",
  despatchedThrough = "",
  destination = "",
  vehicleNo = "",
  customer,
  consignee,
  items,
  totals,
}) => {
  const isPI = type === "pi";
  const formattedDate = date ? new Date(date).toLocaleDateString("en-IN") : "";
  const formattedOrderDate = buyerOrderDate ? new Date(buyerOrderDate).toLocaleDateString("en-IN") : "";

  const renderInvoiceCopy = (subtitle: string) => (
    <div className="bg-white p-8 text-black font-sans text-xs border border-gray-300 w-[794px] min-h-[1123px] relative mx-auto my-4 print:my-0 print:border-none print:w-full print:p-4">
      {/* Header */}
      <div className="text-center font-bold text-sm tracking-widest border-b pb-1 mb-2 uppercase">
        {isPI ? "PROFORMA INVOICE" : `TAX INVOICE (${subtitle})`}
      </div>

      <div className="flex justify-between border-b pb-2 mb-2">
        <div>
          <div className="font-bold text-base text-blue-900">VNT SYSTEM & SERVICES</div>
          <div className="text-gray-600 mt-1">
            BLOCK A 312, SAHJANAND BUSINESS PARK,<br />
            NR. KESHVAM ESTATE, NIKOL RING ROAD,<br />
            AHMEDABAD, GUJARAT - 382350
          </div>
          <div className="mt-1 font-semibold">GSTIN/UIN: 24AATFV2696L1Z9</div>
          <div>State: Gujarat, Code: 24</div>
          <div>Email: vntsystemservices@gmail.com | Call: +91 9106798231</div>
        </div>
        <div className="text-right border-l pl-4 min-w-[200px]">
          <div className="mb-2">
            <span className="font-bold text-gray-500">{isPI ? "Proforma Inv No:" : "Invoice No:"}</span>
            <div className="font-bold text-sm">{invoiceNo}</div>
          </div>
          <div>
            <span className="font-bold text-gray-500">Dated:</span>
            <div className="font-semibold">{formattedDate}</div>
          </div>
          {isPI && (
            <div className="mt-1">
              <span className="font-bold text-gray-500">Book No:</span>
              <div>{bookNo}</div>
            </div>
          )}
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-4 border-b pb-2 mb-2">
        <div>
          <table className="w-full">
            <tbody>
              <tr>
                <td className="font-bold text-gray-500 w-1/3">Buyer's Order No:</td>
                <td>{buyerOrderNo || "N/A"}</td>
              </tr>
              <tr>
                <td className="font-bold text-gray-500">Order Date:</td>
                <td>{formattedOrderDate || "N/A"}</td>
              </tr>
              {vehicleNo && (
                <tr>
                  <td className="font-bold text-gray-500">Vehicle No:</td>
                  <td>{vehicleNo}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-l pl-4">
          <table className="w-full">
            <tbody>
              {!isPI && (
                <>
                  <tr>
                    <td className="font-bold text-gray-500 w-1/2">Delivery Note:</td>
                    <td>{deliveryNote || "N/A"}</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-gray-500">Terms of Payment:</td>
                    <td>{paymentTerms || "N/A"}</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-gray-500">Despatched through:</td>
                    <td>{despatchedThrough || "N/A"}</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-gray-500">Destination:</td>
                    <td>{destination || "N/A"}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-4 border-b pb-2 mb-2">
        <div className="bg-gray-50 p-2 rounded">
          <div className="font-bold border-b pb-1 mb-1 text-blue-900">Buyer (Bill to)</div>
          <div className="font-bold text-sm">{customer.name}</div>
          <div className="text-gray-600">
            {customer.addressLine1}<br />
            {customer.addressLine2}<br />
            {customer.addressLine3}
          </div>
          {customer.phone && <div>Phone: {customer.phone}</div>}
          {customer.gstin && <div className="font-semibold mt-1">GSTIN/UIN: {customer.gstin}</div>}
          {customer.stateName && <div>State Name: {customer.stateName}, Code: {customer.stateCode}</div>}
          {isPI && customer.attention && (
            <div className="mt-1 font-semibold text-gray-700">Attn: {customer.attention}</div>
          )}
        </div>
        <div className="bg-gray-50 p-2 rounded border-l">
          <div className="font-bold border-b pb-1 mb-1 text-blue-900">Consignee (Shipped to)</div>
          {!isPI && consignee ? (
            <>
              <div className="font-bold text-sm">{consignee.name || customer.name}</div>
              <div className="text-gray-600">
                {consignee.addressLine1 || customer.addressLine1}<br />
                {consignee.addressLine2 || customer.addressLine2}<br />
                {consignee.addressLine3 || customer.addressLine3}
              </div>
              {(consignee.gstin || customer.gstin) && (
                <div className="font-semibold mt-1">GSTIN/UIN: {consignee.gstin || customer.gstin}</div>
              )}
              {(consignee.stateName || customer.stateName) && (
                <div>State Name: {consignee.stateName || customer.stateName}, Code: {consignee.stateCode || customer.stateCode}</div>
              )}
            </>
          ) : (
            <div className="text-gray-500 italic flex items-center h-full">Same as Buyer</div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse border border-gray-300 text-left mb-2">
        <thead>
          <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300">
            <th className="border-r border-gray-300 p-2 text-center w-10">Sr.</th>
            <th className="border-r border-gray-300 p-2">Description of Goods</th>
            <th className="border-r border-gray-300 p-2 w-20">HSN/SAC</th>
            <th className="border-r border-gray-300 p-2 w-14 text-center">Qty</th>
            <th className="border-r border-gray-300 p-2 w-14 text-center">Per</th>
            <th className="border-r border-gray-300 p-2 w-20 text-right">Rate (Rs)</th>
            <th className="border-r border-gray-300 p-2 w-24 text-right">Taxable Amt</th>
            <th className="border-r border-gray-300 p-2 w-24 text-right">GST Rate</th>
            <th className="p-2 w-24 text-right">Net Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const itemGross = item.qty * item.rate;
            const itemGST = itemGross * item.gstRate;
            const itemNet = itemGross + itemGST;

            return (
              <React.Fragment key={idx}>
                <tr className="align-top border-b border-gray-200">
                  <td className="border-r border-gray-300 p-2 text-center">{idx + 1}</td>
                  <td className="border-r border-gray-300 p-2">
                    <div className="font-semibold text-black">{item.name}</div>
                    <div className="text-gray-600 mt-0.5">{item.description}</div>
                  </td>
                  <td className="border-r border-gray-300 p-2">{item.hsn}</td>
                  <td className="border-r border-gray-300 p-2 text-center">{item.qty}</td>
                  <td className="border-r border-gray-300 p-2 text-center">{item.per || "Nos."}</td>
                  <td className="border-r border-gray-300 p-2 text-right">{item.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="border-r border-gray-300 p-2 text-right">{itemGross.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="border-r border-gray-300 p-2 text-right">{(item.gstRate * 100).toFixed(0)}%</td>
                  <td className="p-2 text-right">{itemNet.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
                {item.serialNumbers && (
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="border-r border-gray-300"></td>
                    <td colSpan={8} className="p-1 px-2 text-[10px] text-gray-500 italic">
                      Serial No: {item.serialNumbers}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
          {/* Fill spacing if items are fewer than 3 */}
          {Array.from({ length: Math.max(0, 3 - items.length) }).map((_, idx) => (
            <tr key={`empty-${idx}`} className="h-10 border-b border-gray-200">
              <td className="border-r border-gray-300"></td>
              <td className="border-r border-gray-300"></td>
              <td className="border-r border-gray-300"></td>
              <td className="border-r border-gray-300"></td>
              <td className="border-r border-gray-300"></td>
              <td className="border-r border-gray-300"></td>
              <td className="border-r border-gray-300"></td>
              <td className="border-r border-gray-300"></td>
              <td></td>
            </tr>
          ))}
          {/* Totals Row */}
          <tr className="font-bold bg-gray-50 border-t border-gray-300">
            <td colSpan={3} className="border-r border-gray-300 p-2 text-right">Total</td>
            <td className="border-r border-gray-300 p-2 text-center">{items.reduce((acc, i) => acc + i.qty, 0)}</td>
            <td className="border-r border-gray-300 p-2 text-center">Nos.</td>
            <td className="border-r border-gray-300"></td>
            <td className="border-r border-gray-300 p-2 text-right">{totals.gross.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td className="border-r border-gray-300"></td>
            <td className="p-2 text-right">{(totals.gross + totals.cgst + totals.sgst).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>

      {/* Summary calculations */}
      <div className="flex justify-between items-start mt-2 border-t pt-2 mb-4">
        <div className="w-1/2">
          {/* Bank Details */}
          <div className="border p-2 rounded bg-gray-50">
            <div className="font-bold text-xs text-blue-900 border-b pb-0.5 mb-1">Bank Details</div>
            <table className="w-full text-[10px]">
              <tbody>
                <tr>
                  <td className="font-bold text-gray-500 w-1/4">Bank Name:</td>
                  <td>Ahmedabad Mercantile Co Op Bank</td>
                </tr>
                <tr>
                  <td className="font-bold text-gray-500">Branch:</td>
                  <td>AMBAWADI City : AHMEDABAD</td>
                </tr>
                <tr>
                  <td className="font-bold text-gray-500">A/C No:</td>
                  <td className="font-semibold">66010101003569</td>
                </tr>
                <tr>
                  <td className="font-bold text-gray-500">NEFT/RTGS:</td>
                  <td className="font-semibold">AMCB0660010</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-5/12 border rounded p-2 bg-gray-50">
          <table className="w-full font-bold">
            <tbody>
              <tr>
                <td className="text-gray-500 py-1">Taxable Amount:</td>
                <td className="text-right py-1">Rs. {totals.gross.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td className="text-gray-500 py-0.5">CGST (9%):</td>
                <td className="text-right py-0.5">Rs. {totals.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td className="text-gray-500 py-0.5">SGST (9%):</td>
                <td className="text-right py-0.5">Rs. {totals.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr className="border-t border-gray-300">
                <td className="text-blue-900 text-sm py-1 font-extrabold">Invoice Total:</td>
                <td className="text-right text-blue-900 text-sm py-1 font-extrabold">Rs. {totals.grand.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-4">
        <span className="font-bold text-gray-500">Amount in Words:</span>
        <div className="font-bold uppercase text-[10px] text-gray-800 bg-gray-50 p-2 border rounded mt-0.5">
          {numberToWordsIndian(totals.grand)}
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="grid grid-cols-2 gap-4 border-t pt-2 mb-10 text-[9px] text-gray-600">
        <div>
          <div className="font-bold border-b pb-0.5 mb-1 text-gray-700">Terms & Conditions:</div>
          <ol className="list-decimal pl-3 space-y-0.5">
            <li>Goods once sold will not be taken back or exchanged.</li>
            <li>{isPI ? "Taxes applicable at final invoice & Insurance not covered by us." : "Interest @ 24% p.a. will be charged if payment is delayed."}</li>
            <li>We don't take responsibility for damage, loss, or delay in transit.</li>
            <li>All claims must be made in writing within 3 days.</li>
            <li>Subject to Ahmedabad Jurisdiction only. E.&.O.E</li>
          </ol>
        </div>
        <div className="text-right flex flex-col justify-between items-end min-h-[80px]">
          <div className="font-bold text-black">For, VNT System & Services</div>
          <div className="border-t border-dashed w-36 pt-1 text-center font-bold text-[10px]">Authorised Signatory</div>
        </div>
      </div>
    </div>
  );

  if (isPI) {
    return (
      <div className="invoice-print-container">
        {renderInvoiceCopy("")}
      </div>
    );
  }

  return (
    <div className="invoice-print-container space-y-8 print:space-y-0">
      <div className="print:page-break-after">
        {renderInvoiceCopy("ORIGINAL FOR BUYER")}
      </div>
      <div className="print:page-break-after print:mt-0">
        {renderInvoiceCopy("DUPLICATE FOR TRANSPORTER")}
      </div>
      <div>
        {renderInvoiceCopy("TRIPLICATE FOR SUPPLIER")}
      </div>
    </div>
  );
};
