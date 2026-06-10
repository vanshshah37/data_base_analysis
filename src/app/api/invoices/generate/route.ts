import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";

const execAsync = promisify(exec);

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

export async function POST(req: NextRequest) {
  let tempJsonPath = "";
  try {
    const body = await req.json();
    const {
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
      items = [],
    } = body;

    if (!type || !invoiceNo || !date) {
      return NextResponse.json({ error: "Missing required fields: type, invoiceNo, date" }, { status: 400 });
    }

    const templateFilename = type === "pi" ? "pi_template.xlsm" : "invoice_template.xlsx";
    const templatePath = path.join(process.cwd(), "public", "templates", templateFilename);

    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: `Template file not found at ${templatePath}` }, { status: 404 });
    }

    // Set up file output paths
    const outputDir = type === "pi" ? path.join(process.cwd(), "pi") : path.join(process.cwd(), "invoices");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const cleanedCustomerName = (customer.name || "Manual").replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
    const cleanedInvoiceNo = String(invoiceNo).replace(/[^a-zA-Z0-9]/g, "_");
    const outputFilename = type === "pi" 
      ? `PI_${cleanedCustomerName}_${cleanedInvoiceNo}.xlsm` 
      : `Invoice_${cleanedCustomerName}_${cleanedInvoiceNo}.xlsx`;
    const outputPdfFilename = type === "pi"
      ? `PI_${cleanedCustomerName}_${cleanedInvoiceNo}.pdf`
      : `Invoice_${cleanedCustomerName}_${cleanedInvoiceNo}.pdf`;
    
    const outputPath = path.join(outputDir, outputFilename);
    const outputPdfPath = path.join(outputDir, outputPdfFilename);

    // Calculate totals first
    let totalGross = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalQty = 0;

    const parsedItems = items.map((item: any) => {
      const qty = Number(item.qty) || 0;
      const rate = Number(item.rate) || 0;
      const gstRate = Number(item.gstRate) || 0.18;
      const gross = qty * rate;
      const cgst = gross * (gstRate / 2);
      const sgst = gross * (gstRate / 2);
      
      totalGross += gross;
      totalCGST += cgst;
      totalSGST += sgst;
      totalQty += qty;

      return {
        ...item,
        qty,
        rate,
        gstRate,
        gross,
        cgst,
        sgst,
      };
    });

    const totalGrand = Math.round(totalGross + totalCGST + totalSGST);
    const amountInWords = numberToWordsIndian(totalGrand);

    // Resolve consignee (default to customer details if null/empty)
    const resolvedConsignee = consignee ? {
      name: consignee.name || customer.name || "",
      addressLine1: consignee.addressLine1 || customer.addressLine1 || "",
      addressLine2: consignee.addressLine2 || customer.addressLine2 || "",
      addressLine3: consignee.addressLine3 || customer.addressLine3 || "",
      gstin: consignee.gstin || customer.gstin || "",
      stateName: consignee.stateName || customer.stateName || "",
      stateCode: consignee.stateCode || customer.stateCode || "",
    } : {
      name: customer.name || "",
      addressLine1: customer.addressLine1 || "",
      addressLine2: customer.addressLine2 || "",
      addressLine3: customer.addressLine3 || "",
      gstin: customer.gstin || "",
      stateName: customer.stateName || "",
      stateCode: customer.stateCode || "",
    };
    // Save/Update customer in the database
    if (customer && customer.name && customer.name.trim() !== "") {
      try {
        const companyName = customer.name.trim();
        const existingCustomer = await db.customer.findFirst({
          where: {
            companyName: {
              equals: companyName
            }
          }
        });

        const customerData = {
          companyName,
          customerName: customer.attention || "",
          address: customer.addressLine1 || "",
          city: customer.addressLine2 || "",
          country: customer.addressLine3 || "",
          phone: customer.phone || "",
          state: customer.stateName || "",
          gstin: customer.gstin || "",
          stateCode: customer.stateCode || "",
          status: "Active",
        };

        if (existingCustomer) {
          await db.customer.update({
            where: { id: existingCustomer.id },
            data: customerData,
          });
          WriteLog(`Updated existing customer in database: ${companyName}`);
        } else {
          await db.customer.create({
            data: customerData,
          });
          WriteLog(`Created new customer in database: ${companyName}`);
        }
      } catch (dbErr) {
        console.error("Failed to save customer to database:", dbErr);
      }
    }
    // Prepare JSON payload for the PowerShell COM script
    const psPayload = {
      type,
      templatePath,
      outputExcelPath: outputPath,
      outputPdfPath,
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
      amountInWords,
      customer: {
        name: customer.name || "",
        addressLine1: customer.addressLine1 || "",
        addressLine2: customer.addressLine2 || "",
        addressLine3: customer.addressLine3 || "",
        phone: customer.phone || "",
        gstin: customer.gstin || "",
        stateName: customer.stateName || "",
        stateCode: customer.stateCode || "",
        attention: customer.attention || "",
      },
      consignee: resolvedConsignee,
      items: parsedItems,
    };

    // Save temporary JSON file for communication
    tempJsonPath = path.join(outputDir, `temp_${Date.now()}.json`);
    fs.writeFileSync(tempJsonPath, JSON.stringify(psPayload, null, 2));

    // Execute PowerShell script in the background to handle COM
    const psScriptPath = path.join(process.cwd(), "src", "lib", "generate_invoice.ps1");
    const psCommand = `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${psScriptPath}" "${tempJsonPath}"`;

    WriteLog(`Executing COM automation: ${psCommand}`);
    const { stdout, stderr } = await execAsync(psCommand);
    WriteLog(`COM script stdout: ${stdout}`);
    if (stderr) {
      console.warn(`COM script stderr: ${stderr}`);
    }

    // Clean up temporary JSON file
    if (fs.existsSync(tempJsonPath)) {
      fs.unlinkSync(tempJsonPath);
      tempJsonPath = "";
    }

    // Double check if generated files exist
    if (!fs.existsSync(outputPath)) {
      throw new Error("PowerShell script ran but generated Excel file was not found.");
    }

    // Read the output Excel file back using SheetJS for the webpage preview (with retries for file locks)
    let workbookPreview;
    let retries = 3;
    let lastError: any = null;
    while (retries > 0) {
      try {
        workbookPreview = XLSX.readFile(outputPath);
        break;
      } catch (err: any) {
        lastError = err;
        retries--;
        if (retries > 0) {
          WriteLog(`File locked, retrying read in 300ms... (${retries} retries left)`);
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    }

    const previewData: Record<string, any[][]> = {};
    if (workbookPreview) {
      try {
        workbookPreview.SheetNames.forEach(sheetName => {
          const sheet = workbookPreview.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];
          previewData[sheetName] = rows;
        });
      } catch (previewErr) {
        console.warn("Failed to parse sheet data for preview:", previewErr);
      }
    } else {
      WriteLog(`Could not read Excel preview due to file lock: ${lastError?.message || lastError}. Skipping preview grid.`);
    }

    return NextResponse.json({
      success: true,
      message: `Excel & PDF generated successfully using Microsoft Excel in the background!`,
      filename: outputFilename,
      pdfFilename: outputPdfFilename,
      filePath: outputPath,
      pdfPath: outputPdfPath,
      preview: previewData,
      totals: {
        qty: totalQty,
        gross: totalGross,
        cgst: totalCGST,
        sgst: totalSGST,
        grand: totalGrand,
      }
    });

  } catch (error: any) {
    console.error("Error in generating invoice:", error);
    
    // Clean up temp JSON on failure
    if (tempJsonPath && fs.existsSync(tempJsonPath)) {
      try { fs.unlinkSync(tempJsonPath); } catch {}
    }

    let errorMessage = error.message || "Failed to generate Excel file";
    if (error.code === "EBUSY" || error.code === "EACCES" || error.message?.includes("busy or locked")) {
      errorMessage = "The Excel file is currently open in Microsoft Excel or another program. Please close Excel and try again.";
    } else if (error.message?.includes("Exception from HRESULT")) {
      errorMessage = `Excel COM Automation Error: ${error.message}. Please check if the Excel template structure matches.`;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

function WriteLog(msg: string) {
  console.log(`[InvoiceAPI] ${msg}`);
}
