import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // "invoice" or "pi"

    if (!file || !type) {
      return NextResponse.json({ error: "Missing file or type" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const templatesDir = path.join(process.cwd(), "public", "templates");
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }

    // Determine target name
    let filename = "";
    if (type === "pi") {
      // Check if it's xlsm or xlsx
      const ext = file.name.endsWith(".xlsm") ? ".xlsm" : ".xlsx";
      filename = `pi_template${ext}`;
    } else {
      filename = "invoice_template.xlsx";
    }

    const filePath = path.join(templatesDir, filename);
    
    // Write the file
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      success: true,
      message: `Template uploaded and saved as ${filename} successfully.`,
      filename,
    });

  } catch (error: any) {
    console.error("Error uploading template:", error);
    return NextResponse.json({ error: error.message || "Failed to upload template" }, { status: 500 });
  }
}
