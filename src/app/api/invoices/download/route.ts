import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("file");

    if (!filename) {
      return NextResponse.json({ error: "Missing filename parameter" }, { status: 400 });
    }

    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(filename);
    const subFolder = safeFilename.startsWith("PI_") ? "pi" : "invoices";
    const filePath = path.join(process.cwd(), subFolder, safeFilename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: `File not found at ${filePath}` }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(safeFilename).toLowerCase();
    
    let contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (ext === ".xlsm") {
      contentType = "application/vnd.ms-excel.sheet.macroEnabled.12";
    } else if (ext === ".pdf") {
      contentType = "application/pdf";
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
      },
    });

  } catch (error: any) {
    console.error("Error in download endpoint:", error);
    return NextResponse.json({ error: error.message || "Failed to download file" }, { status: 500 });
  }
}
