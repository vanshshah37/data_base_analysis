import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      companyName,
      customerName,
      email,
      phone,
      address,
      city,
      country,
      state,
      gstin,
      stateCode,
      notes,
    } = body;

    if (!companyName || companyName.trim() === "") {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    // Check if customer already exists by companyName (case-insensitive check if possible)
    const existing = await db.customer.findFirst({
      where: {
        companyName: {
          equals: companyName.trim(),
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "A customer with this company name already exists" }, { status: 400 });
    }

    // Create the customer
    const newCustomer = await db.customer.create({
      data: {
        companyName: companyName.trim(),
        customerName: customerName ? customerName.trim() : "",
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : "",
        address: address ? address.trim() : "",
        city: city ? city.trim() : "",
        country: country ? country.trim() : "",
        state: state ? state.trim() : "Gujarat",
        gstin: gstin ? gstin.trim() : "",
        stateCode: stateCode ? stateCode.trim() : "24",
        notes: notes ? notes.trim() : "",
        status: "Active",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Customer created successfully!",
      customer: newCustomer,
    });

  } catch (error: any) {
    console.error("Error creating customer:", error);
    let errorMsg = error.message || "Failed to create customer";
    if (error.code === "P2002" && error.meta?.target?.includes("email")) {
      errorMsg = "A customer with this email address already exists";
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
