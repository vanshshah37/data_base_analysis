"use client";

import { useState, useEffect } from "react";
import { 
  FileSpreadsheet, 
  FileText, 
  Plus, 
  Trash2, 
  Download, 
  Edit2, 
  Check, 
  Upload, 
  Printer, 
  Eye, 
  Loader2, 
  Building2, 
  User, 
  CheckSquare, 
  Square,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { InvoicePrintView } from "./invoice-print-view";

interface DbCustomer {
  id: string;
  companyName: string | null;
  customerName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  industry: string | null;
  gstin: string | null;
  stateCode: string | null;
}

interface InvoiceClientProps {
  dbCustomers: DbCustomer[];
}

export function InvoiceClient({ dbCustomers }: InvoiceClientProps) {
  // Mode: "edit" (form) or "preview" (excel grid & print view)
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [activeTab, setActiveTab] = useState<"form" | "templates">("form");
  const [previewSheet, setPreviewSheet] = useState<string>("");
  
  // Document Type
  const [type, setType] = useState<"invoice" | "pi">("invoice");
  
  // Form State - Metadata
  const [invoiceNo, setInvoiceNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [bookNo, setBookNo] = useState("2");
  const [buyerOrderNo, setBuyerOrderNo] = useState("");
  const [buyerOrderDate, setBuyerOrderDate] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("100% Against PI");

  // Auto-fetch next invoice number
  useEffect(() => {
    async function fetchNextNumber() {
      try {
        const response = await fetch(`/api/invoices/next-number?type=${type}`);
        const data = await response.json();
        if (data.nextNumber) {
          setInvoiceNo(data.nextNumber);
        }
      } catch (err) {
        console.error("Failed to fetch next invoice number", err);
      }
    }
    fetchNextNumber();
  }, [type]);
  const [despatchedThrough, setDespatchedThrough] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");

  // Customer State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("manual");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress1, setCustomerAddress1] = useState("");
  const [customerAddress2, setCustomerAddress2] = useState("");
  const [customerAddress3, setCustomerAddress3] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [customerStateName, setCustomerStateName] = useState("");
  const [customerStateCode, setCustomerStateCode] = useState("");
  const [customerAttention, setCustomerAttention] = useState("");

  // Consignee State
  const [consigneeSameAsBuyer, setConsigneeSameAsBuyer] = useState(true);
  const [consigneeName, setConsigneeName] = useState("");
  const [consigneeAddress1, setConsigneeAddress1] = useState("");
  const [consigneeAddress2, setConsigneeAddress2] = useState("");
  const [consigneeAddress3, setConsigneeAddress3] = useState("");
  const [consigneeGstin, setConsigneeGstin] = useState("");
  const [consigneeStateName, setConsigneeStateName] = useState("");
  const [consigneeStateCode, setConsigneeStateCode] = useState("");

  // Items State (default 1 item)
  const [items, setItems] = useState<Array<{
    name: string;
    description: string;
    serialNumbers: string;
    hsn: string;
    per: string;
    qty: string;
    rate: string;
    gstRate: string;
  }>>([{
    name: "",
    description: "",
    serialNumbers: "",
    hsn: "85044090",
    per: "Nos.",
    qty: "1",
    rate: "",
    gstRate: "0.18"
  }]);

  // Generation Response
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);

  // Template Upload State
  const [invoiceTemplateFile, setInvoiceTemplateFile] = useState<File | null>(null);
  const [piTemplateFile, setPiTemplateFile] = useState<File | null>(null);
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);
  const [isUploadingPi, setIsUploadingPi] = useState(false);

  // Handle DB Customer Selection
  useEffect(() => {
    if (selectedCustomerId === "manual") {
      // Clear fields for manual entry
      setCustomerName("");
      setCustomerAddress1("");
      setCustomerAddress2("");
      setCustomerAddress3("");
      setCustomerPhone("");
      setCustomerGstin("");
      setCustomerStateName("Gujarat");
      setCustomerStateCode("24");
      setCustomerAttention("");
    } else {
      const dbCust = dbCustomers.find(c => c.id === selectedCustomerId);
      if (dbCust) {
        setCustomerName(dbCust.companyName || dbCust.customerName || "");
        setCustomerAddress1(dbCust.address || "");
        setCustomerAddress2(dbCust.city || "");
        setCustomerAddress3(dbCust.country || "");
        setCustomerPhone(dbCust.phone || "");
        setCustomerGstin(dbCust.gstin || "");
        setCustomerStateName(dbCust.state || "Gujarat");
        setCustomerStateCode(dbCust.stateCode || "24");
        setCustomerAttention(dbCust.customerName || "");
      }
    }
  }, [selectedCustomerId, dbCustomers]);

  // Handle Item Operations
  const addItem = () => {
    if (items.length >= 3) {
      toast.warning("Excel templates support up to 3 items maximum.");
      return;
    }
    setItems([...items, {
      name: "",
      description: "",
      serialNumbers: "",
      hsn: "85044090",
      per: "Nos.",
      qty: "1",
      rate: "",
      gstRate: "0.18"
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    const newItems = items.filter((_, idx) => idx !== index);
    setItems(newItems);
  };

  const updateItem = (index: number, key: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [key]: value };
    setItems(newItems);
  };

  // Generate Excel & Show Preview
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoiceNo) {
      toast.error("Please enter Invoice/PI number.");
      return;
    }

    // Validate blank fields and confirm
    const blankFields: string[] = [];
    if (!buyerOrderNo) blankFields.push("Buyer's Order No");
    if (!buyerOrderDate) blankFields.push("Buyer's Order Date");
    if (!vehicleNo) blankFields.push("Vehicle / Dispatch No");
    if (!customerGstin) blankFields.push("Customer GSTIN");
    if (!customerPhone) blankFields.push("Customer Phone No");
    
    if (type === "pi") {
      if (!customerAttention) blankFields.push("Attention (Contact Person)");
    } else {
      if (!deliveryNote) blankFields.push("Delivery Note");
      if (!paymentTerms) blankFields.push("Terms of Payment");
      if (!despatchedThrough) blankFields.push("Despatched Through");
      if (!destination) blankFields.push("Destination");
      if (!consigneeSameAsBuyer) {
        if (!consigneeName) blankFields.push("Consignee Name");
        if (!consigneeAddress1) blankFields.push("Consignee Address Line 1");
        if (!consigneeGstin) blankFields.push("Consignee GSTIN");
      }
    }

    if (blankFields.length > 0) {
      const confirmMessage = `The following fields are left blank:\n- ${blankFields.join("\n- ")}\n\nAre you willing to continue?`;
      const proceed = window.confirm(confirmMessage);
      if (!proceed) {
        return;
      }
    }

    setIsGenerating(true);

    const payload = {
      type,
      invoiceNo,
      date,
      bookNo,
      buyerOrderNo,
      buyerOrderDate,
      deliveryNote,
      paymentTerms,
      despatchedThrough,
      destination,
      vehicleNo,
      customer: {
        name: customerName,
        addressLine1: customerAddress1,
        addressLine2: customerAddress2,
        addressLine3: customerAddress3,
        phone: customerPhone,
        gstin: customerGstin,
        stateName: customerStateName,
        stateCode: customerStateCode,
        attention: customerAttention,
      },
      consignee: consigneeSameAsBuyer ? null : {
        name: consigneeName,
        addressLine1: consigneeAddress1,
        addressLine2: consigneeAddress2,
        addressLine3: consigneeAddress3,
        gstin: consigneeGstin,
        stateName: consigneeStateName,
        stateCode: consigneeStateCode,
      },
      items: items.map(item => ({
        name: item.name,
        description: item.description,
        serialNumbers: item.serialNumbers,
        hsn: item.hsn,
        per: item.per,
        qty: Number(item.qty) || 0,
        rate: Number(item.rate) || 0,
        gstRate: Number(item.gstRate) || 0.18,
      })),
    };

    try {
      const response = await fetch("/api/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Failed to generate invoice.");
      }

      setGeneratedData(resData);
      const sheetNames = Object.keys(resData.preview);
      setPreviewSheet(sheetNames[0]);
      setMode("preview");
      toast.success(`Excel file saved: ${resData.filename}`);
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Upload Template Files
  const handleUploadTemplate = async (fileType: "invoice" | "pi") => {
    const file = fileType === "invoice" ? invoiceTemplateFile : piTemplateFile;
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    if (fileType === "invoice") setIsUploadingInvoice(true);
    else setIsUploadingPi(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", fileType);

    try {
      const response = await fetch("/api/invoices/upload-template", {
        method: "POST",
        body: formData,
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Failed to upload template.");
      }

      toast.success(resData.message);
      if (fileType === "invoice") setInvoiceTemplateFile(null);
      else setPiTemplateFile(null);
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      if (fileType === "invoice") setIsUploadingInvoice(false);
      else setIsUploadingPi(false);
    }
  };

  // Trigger Print to PDF
  const handlePrint = () => {
    window.print();
  };

  // Download Link Helper
  const handleDownloadFile = () => {
    if (!generatedData) return;
    window.open(`/api/invoices/download?file=${encodeURIComponent(generatedData.filename)}`, "_blank");
  };

  // Download PDF Link Helper
  const handleDownloadPdf = () => {
    if (!generatedData) return;
    window.open(`/api/invoices/download?file=${encodeURIComponent(generatedData.pdfFilename)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header element (hidden on print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Invoices & PIs</h1>
          <p className="text-muted-foreground mt-1">
            Build styled Excel worksheets and print vector PDFs for Sales Invoices and Proforma Invoices (PIs).
          </p>
        </div>
        {mode === "edit" ? (
          <div className="flex border rounded-lg overflow-hidden bg-white shadow-sm p-1">
            <button
              onClick={() => setActiveTab("form")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeTab === "form" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Generate Document
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeTab === "templates" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Manage Templates
            </button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setMode("edit")} className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Edit
          </Button>
        )}
      </div>

      {mode === "edit" && activeTab === "form" && (
        <form onSubmit={handleGenerate} className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
          {/* Main inputs (Left Column) */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Document Settings</CardTitle>
                    <CardDescription>Select document type and metadata.</CardDescription>
                  </div>
                  <div className="flex border rounded-lg bg-gray-50 p-1">
                    <button
                      type="button"
                      onClick={() => setType("invoice")}
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${type === "invoice" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      <FileText className="h-3.5 w-3.5" /> Invoice
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("pi")}
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${type === "pi" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" /> PI (Proforma)
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="invoiceNo">{type === "pi" ? "PI Number" : "Invoice Number"}</Label>
                  <Input 
                    id="invoiceNo" 
                    value={invoiceNo} 
                    onChange={e => setInvoiceNo(e.target.value)} 
                    placeholder="e.g. 125 or VNT/26-27/008" 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    required 
                  />
                </div>
                {type === "pi" ? (
                  <div>
                    <Label htmlFor="bookNo">Book Number</Label>
                    <Input 
                      id="bookNo" 
                      value={bookNo} 
                      onChange={e => setBookNo(e.target.value)} 
                      placeholder="e.g. 2" 
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="deliveryNote">Delivery Note</Label>
                    <Input 
                      id="deliveryNote" 
                      value={deliveryNote} 
                      onChange={e => setDeliveryNote(e.target.value)} 
                      placeholder="e.g. Courier" 
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="buyerOrderNo">Buyer's Order No</Label>
                  <Input 
                    id="buyerOrderNo" 
                    value={buyerOrderNo} 
                    onChange={e => setBuyerOrderNo(e.target.value)} 
                    placeholder="e.g. 33/2026-27" 
                  />
                </div>
                <div>
                  <Label htmlFor="buyerOrderDate">Buyer's Order Date</Label>
                  <Input 
                    id="buyerOrderDate" 
                    type="date" 
                    value={buyerOrderDate} 
                    onChange={e => setBuyerOrderDate(e.target.value)} 
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleNo">Vehicle / Dispatch No</Label>
                  <Input 
                    id="vehicleNo" 
                    value={vehicleNo} 
                    onChange={e => setVehicleNo(e.target.value)} 
                    placeholder="e.g. GJ-01-XX-XXXX" 
                  />
                </div>
                {type === "invoice" && (
                  <>
                    <div>
                      <Label htmlFor="paymentTerms">Terms of Payment</Label>
                      <Input 
                        id="paymentTerms" 
                        value={paymentTerms} 
                        onChange={e => setPaymentTerms(e.target.value)} 
                        placeholder="e.g. 100% Against PI" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="despatchedThrough">Despatched Through</Label>
                      <Input 
                        id="despatchedThrough" 
                        value={despatchedThrough} 
                        onChange={e => setDespatchedThrough(e.target.value)} 
                        placeholder="e.g. courier" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="destination">Destination</Label>
                      <Input 
                        id="destination" 
                        value={destination} 
                        onChange={e => setDestination(e.target.value)} 
                        placeholder="e.g. Vadodara" 
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Line Items</CardTitle>
                  <CardDescription>Enter product details. Max 3 items allowed in templates.</CardDescription>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addItem}
                  disabled={items.length >= 3}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, idx) => (
                  <div key={idx} className="border p-4 rounded-lg bg-gray-50/50 space-y-3 relative group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Item #{idx + 1}</span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2">
                        <Label>Product Name</Label>
                        <Input 
                          value={item.name} 
                          onChange={e => updateItem(idx, "name", e.target.value)} 
                          placeholder="e.g. YASKAWA CIPR-GA70D4031ABMA"
                          required 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Model Details / Description</Label>
                        <Input 
                          value={item.description} 
                          onChange={e => updateItem(idx, "description", e.target.value)} 
                          placeholder="e.g. 11 kW (HD)/ 15 kW (ND)"
                          required 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                      <div className="col-span-2">
                        <Label>Serial Numbers (comma sep.)</Label>
                        <Input 
                          value={item.serialNumbers} 
                          onChange={e => updateItem(idx, "serialNumbers", e.target.value)} 
                          placeholder="e.g. 1D2652182000014, ..."
                          disabled={type === "pi"} 
                        />
                      </div>
                      <div>
                        <Label>HSN/SAC</Label>
                        <Input 
                          value={item.hsn} 
                          onChange={e => updateItem(idx, "hsn", e.target.value)} 
                          placeholder="85044090"
                          required 
                        />
                      </div>
                      <div>
                        <Label>Qty</Label>
                        <Input 
                          type="number"
                          value={item.qty} 
                          onChange={e => updateItem(idx, "qty", e.target.value)} 
                          min="1"
                          required 
                        />
                      </div>
                      <div>
                        <Label>Rate (Rs)</Label>
                        <Input 
                          type="number"
                          value={item.rate} 
                          onChange={e => updateItem(idx, "rate", e.target.value)} 
                          placeholder="e.g. 37500"
                          required 
                        />
                      </div>
                      <div>
                        <Label>GST Rate</Label>
                        <select
                          value={item.gstRate}
                          onChange={e => updateItem(idx, "gstRate", e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        >
                          <option value="0.18">18% GST</option>
                          <option value="0.12">12% GST</option>
                          <option value="0.05">5% GST</option>
                          <option value="0.00">0% (Nil)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Customer Selection (Right Column) */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Selection</CardTitle>
                <CardDescription>Select client from CRM or enter details manually.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customerSelect">Database Link</Label>
                  <select
                    id="customerSelect"
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
                  >
                    <option value="manual">➕ Enter Manually (New Customer)</option>
                    {dbCustomers.map(cust => (
                      <option key={cust.id} value={cust.id}>
                        {cust.companyName || cust.customerName || "Unnamed Client"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div>
                    <Label htmlFor="custName">Customer Name / Company</Label>
                    <Input 
                      id="custName" 
                      value={customerName} 
                      onChange={e => setCustomerName(e.target.value)} 
                      placeholder="e.g. Searock International" 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="custAddr1">Address Line 1</Label>
                    <Input 
                      id="custAddr1" 
                      value={customerAddress1} 
                      onChange={e => setCustomerAddress1(e.target.value)} 
                      placeholder="e.g. 107, Palace Plaza" 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="custAddr2">Address Line 2</Label>
                    <Input 
                      id="custAddr2" 
                      value={customerAddress2} 
                      onChange={e => setCustomerAddress2(e.target.value)} 
                      placeholder="e.g. Jawahar Nehru Road" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="custAddr3">Address Line 3</Label>
                    <Input 
                      id="custAddr3" 
                      value={customerAddress3} 
                      onChange={e => setCustomerAddress3(e.target.value)} 
                      placeholder="e.g. Vadodara-390001, Gujarat" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="custPhone">Phone No</Label>
                      <Input 
                        id="custPhone" 
                        value={customerPhone} 
                        onChange={e => setCustomerPhone(e.target.value)} 
                        placeholder="e.g. 98251 78489" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="custGstin">GSTIN</Label>
                      <Input 
                        id="custGstin" 
                        value={customerGstin} 
                        onChange={e => setCustomerGstin(e.target.value)} 
                        placeholder="e.g. 24ABAPT7860J1ZB" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="custState">State Name</Label>
                      <Input 
                        id="custState" 
                        value={customerStateName} 
                        onChange={e => setCustomerStateName(e.target.value)} 
                        placeholder="Gujarat" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="custStateCode">State Code</Label>
                      <Input 
                        id="custStateCode" 
                        value={customerStateCode} 
                        onChange={e => setCustomerStateCode(e.target.value)} 
                        placeholder="24" 
                      />
                    </div>
                  </div>
                  {type === "pi" && (
                    <div>
                      <Label htmlFor="custAttn">Attention (Contact Person)</Label>
                      <Input 
                        id="custAttn" 
                        value={customerAttention} 
                        onChange={e => setCustomerAttention(e.target.value)} 
                        placeholder="e.g. Mr. Paresh Thakkar" 
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Consignee (only for Invoice) */}
            {type === "invoice" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Consignee (Shipped to)</CardTitle>
                    <button
                      type="button"
                      onClick={() => setConsigneeSameAsBuyer(!consigneeSameAsBuyer)}
                      className="text-xs text-blue-600 font-semibold flex items-center gap-1"
                    >
                      {consigneeSameAsBuyer ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                      Same as Buyer
                    </button>
                  </div>
                </CardHeader>
                {!consigneeSameAsBuyer && (
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="conName">Consignee Name</Label>
                      <Input 
                        id="conName" 
                        value={consigneeName} 
                        onChange={e => setConsigneeName(e.target.value)} 
                        placeholder="Consignee Company Name" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="conAddr1">Address Line 1</Label>
                      <Input 
                        id="conAddr1" 
                        value={consigneeAddress1} 
                        onChange={e => setConsigneeAddress1(e.target.value)} 
                      />
                    </div>
                    <div>
                      <Label htmlFor="conAddr2">Address Line 2</Label>
                      <Input 
                        id="conAddr2" 
                        value={consigneeAddress2} 
                        onChange={e => setConsigneeAddress2(e.target.value)} 
                      />
                    </div>
                    <div>
                      <Label htmlFor="conAddr3">Address Line 3</Label>
                      <Input 
                        id="conAddr3" 
                        value={consigneeAddress3} 
                        onChange={e => setConsigneeAddress3(e.target.value)} 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="conGstin">GSTIN</Label>
                        <Input 
                          id="conGstin" 
                          value={consigneeGstin} 
                          onChange={e => setConsigneeGstin(e.target.value)} 
                        />
                      </div>
                      <div>
                        <Label htmlFor="conState">State Name</Label>
                        <Input 
                          id="conState" 
                          value={consigneeStateName} 
                          onChange={e => setConsigneeStateName(e.target.value)} 
                          placeholder="Gujarat" 
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="conStateCode">State Code</Label>
                      <Input 
                        id="conStateCode" 
                        value={consigneeStateCode} 
                        onChange={e => setConsigneeStateCode(e.target.value)} 
                        placeholder="24" 
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-sm font-semibold flex items-center justify-center gap-2"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4" /> {type === "pi" ? "Save PI Excel & Preview" : "Save Excel & Preview"}
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Templates Management Tab */}
      {mode === "edit" && activeTab === "templates" && (
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Manage Templates</CardTitle>
            <CardDescription>Upload your reference Invoice (`.xlsx`) and PI (`.xlsm`) templates to the server.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Invoice template uploader */}
            <div className="border p-4 rounded-lg bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-sm">Invoice Template (`invoice_template.xlsx`)</h3>
                <p className="text-xs text-gray-500 mt-1">Upload the reference Tax Invoice file.</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={e => setInvoiceTemplateFile(e.target.files ? e.target.files[0] : null)}
                  className="text-xs max-w-[200px]"
                />
                <Button
                  size="sm"
                  onClick={() => handleUploadTemplate("invoice")}
                  disabled={!invoiceTemplateFile || isUploadingInvoice}
                  className="flex items-center gap-1"
                >
                  {isUploadingInvoice ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  Upload Invoice
                </Button>
              </div>
            </div>

            {/* PI template uploader */}
            <div className="border p-4 rounded-lg bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-sm">PI Template (`pi_template.xlsm`)</h3>
                <p className="text-xs text-gray-500 mt-1">Upload the reference macro-enabled Proforma Invoice file.</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept=".xlsm,.xlsx"
                  onChange={e => setPiTemplateFile(e.target.files ? e.target.files[0] : null)}
                  className="text-xs max-w-[200px]"
                />
                <Button
                  size="sm"
                  onClick={() => handleUploadTemplate("pi")}
                  disabled={!piTemplateFile || isUploadingPi}
                  className="flex items-center gap-1"
                >
                  {isUploadingPi ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  Upload PI
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview and Refine Screen */}
      {mode === "preview" && generatedData && (
        <div className="space-y-6">
          {/* Actions top bar (hidden on print) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border p-4 bg-white rounded-lg shadow-sm print:hidden">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" /> Excel Sheet Generated Successfully!
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Saved at: <code className="bg-gray-100 p-1 px-1.5 rounded font-mono text-[10px] text-gray-700">{generatedData.filePath}</code>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setMode("edit")} className="flex items-center gap-1.5">
                <Edit2 className="h-3.5 w-3.5" /> Edit Details (Refine)
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadFile} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                <Download className="h-3.5 w-3.5" /> Download Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPdf} className="flex items-center gap-1.5 bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
                <Download className="h-3.5 w-3.5" /> Download PDF (Excel-Perfect)
              </Button>
              <Button size="sm" onClick={handlePrint} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700">
                <Printer className="h-3.5 w-3.5" /> Print Invoice (Browser)
              </Button>
            </div>
          </div>

          {/* Main layout: Excel Grid Preview and Printable View side-by-side */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left: Excel Grid view (hidden on print) */}
            <Card className="print:hidden h-[750px] flex flex-col">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-1.5 text-blue-900">
                    <FileSpreadsheet className="h-5 w-5" /> Excel Spreadsheet View
                  </CardTitle>
                  <CardDescription>A live grid representation of your saved excel sheet.</CardDescription>
                </div>
                <div className="flex gap-1.5">
                  {Object.keys(generatedData.preview).map(sheetName => (
                    <button
                      key={sheetName}
                      onClick={() => setPreviewSheet(sheetName)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${previewSheet === sheetName ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                    >
                      {sheetName}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-4 bg-gray-50/50">
                <div className="border rounded bg-white shadow-inner overflow-auto h-full max-h-[640px]">
                  <table className="min-w-full text-[10px] font-mono border-collapse select-none">
                    <tbody>
                      {generatedData.preview[previewSheet]?.map((row: any[], rIdx: number) => (
                        <tr key={rIdx} className="border-b border-gray-100 hover:bg-gray-50/50">
                          {/* Row Indicator */}
                          <td className="bg-gray-100 border-r border-gray-200 text-center text-[9px] text-gray-400 p-1 w-8 font-sans font-medium">
                            {rIdx + 1}
                          </td>
                          {row.map((cell: any, cIdx: number) => (
                            <td 
                              key={cIdx} 
                              className={`p-1 px-2 border-r border-gray-100 whitespace-pre min-w-[60px] truncate max-w-[200px] ${String(cell).trim() ? "text-gray-900" : "text-gray-300"}`}
                              title={String(cell)}
                            >
                              {String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Right: Printable HTML view (the actual page content printed to PDF) */}
            <Card className="h-[750px] flex flex-col overflow-auto print:border-none print:shadow-none print:h-auto print:overflow-visible">
              <CardHeader className="pb-3 border-b print:hidden">
                <CardTitle className="text-base flex items-center gap-1.5 text-blue-900">
                  <Printer className="h-5 w-5" /> PDF Page Layout Preview
                </CardTitle>
                <CardDescription>This is the final vector layout exported when you print to PDF.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto bg-gray-100/50 p-4 print:p-0 print:bg-white print:overflow-visible">
                <div id="invoice-print-area" className="print:block">
                  <InvoicePrintView
                    type={type}
                    invoiceNo={invoiceNo}
                    date={date}
                    bookNo={bookNo}
                    buyerOrderNo={buyerOrderNo}
                    buyerOrderDate={buyerOrderDate}
                    deliveryNote={deliveryNote}
                    paymentTerms={paymentTerms}
                    despatchedThrough={despatchedThrough}
                    destination={destination}
                    vehicleNo={vehicleNo}
                    customer={{
                      name: customerName,
                      addressLine1: customerAddress1,
                      addressLine2: customerAddress2,
                      addressLine3: customerAddress3,
                      phone: customerPhone,
                      gstin: customerGstin,
                      stateName: customerStateName,
                      stateCode: customerStateCode,
                      attention: customerAttention,
                    }}
                    consignee={consigneeSameAsBuyer ? undefined : {
                      name: consigneeName,
                      addressLine1: consigneeAddress1,
                      addressLine2: consigneeAddress2,
                      addressLine3: consigneeAddress3,
                      gstin: consigneeGstin,
                      stateName: consigneeStateName,
                      stateCode: consigneeStateCode,
                    }}
                    items={items.map(item => ({
                      name: item.name,
                      description: item.description,
                      serialNumbers: item.serialNumbers,
                      hsn: item.hsn,
                      per: item.per,
                      qty: Number(item.qty) || 0,
                      rate: Number(item.rate) || 0,
                      gstRate: Number(item.gstRate) || 0.18,
                    }))}
                    totals={generatedData.totals}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
