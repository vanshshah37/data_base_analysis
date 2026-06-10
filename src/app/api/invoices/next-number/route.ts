import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "invoice";

    const subFolder = type === "pi" ? "pi" : "invoices";
    const directoryPath = path.join(process.cwd(), subFolder);
    if (!fs.existsSync(directoryPath)) {
      const defaultVal = type === "pi" ? "126" : "VNT/26-27/009";
      return NextResponse.json({ nextNumber: defaultVal });
    }

    const files = fs.readdirSync(directoryPath);
    const prefix = type === "pi" ? "PI_" : "Invoice_";

    let maxNum = 0;
    let formatPattern = ""; // Keep track of invoice prefix pattern, if detected
    let numLength = 3;

    files.forEach(file => {
      if (file.startsWith(prefix) && (file.endsWith(".xlsx") || file.endsWith(".xlsm"))) {
        // e.g. "Invoice_Searock_International_VNT_26_27_008.xlsx"
        const nameWithoutExt = path.basename(file, path.extname(file));
        const parts = nameWithoutExt.split("_");
        
        // Find last numeric segment
        const lastPart = parts[parts.length - 1];
        if (/^\d+$/.test(lastPart)) {
          const num = parseInt(lastPart, 10);
          if (num > maxNum) {
            maxNum = num;
            numLength = lastPart.length;

            // Detect pattern prefix. 
            // In parts, the last part is the invoice number (e.g. 008)
            // The preceding parts might be VNT, 26, 27
            // If the preceding parts are "VNT", "26", "27"
            // We can check if parts contains VNT, and reconstruct the format.
            const vntIdx = parts.indexOf("VNT");
            if (vntIdx !== -1 && parts.length > vntIdx + 3) {
              formatPattern = `${parts[vntIdx]}/${parts[vntIdx + 1]}-${parts[vntIdx + 2]}/`; // e.g. "VNT/26-27/"
            }
          }
        }
      }
    });

    if (maxNum === 0) {
      const defaultVal = type === "pi" ? "126" : "VNT/26-27/009";
      return NextResponse.json({ nextNumber: defaultVal });
    }

    const nextNum = maxNum + 1;
    const paddedNextNum = String(nextNum).padStart(numLength, "0");

    let nextNumber = "";
    if (type === "pi") {
      nextNumber = paddedNextNum;
    } else {
      const prefixPattern = formatPattern || "VNT/26-27/";
      nextNumber = `${prefixPattern}${paddedNextNum}`;
    }

    return NextResponse.json({ nextNumber });

  } catch (error: any) {
    console.error("Error in next-number endpoint:", error);
    return NextResponse.json({ nextNumber: "" });
  }
}
