import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { items, email } = await request.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 })
    }

    // TODO: When backend is ready, save purchase to database
    const purchaseId = `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Store purchase data temporarily in the response
    // In production, this should be saved to database
    const purchaseData = {
      id: purchaseId,
      email: email || "guest",
      items: items,
      total: items.reduce((sum: number, item: any) => sum + item.price, 0),
      status: "pending",
      createdAt: new Date().toISOString(),
    }

    const paymentLink = process.env.NEXT_PUBLIC_JERPRO_PAYMENT_LINK

    if (!paymentLink) {
      return NextResponse.json({ error: "Payment link not configured" }, { status: 500 })
    }

    // The frontend will redirect to JERPRO's MercadoPago link
    return NextResponse.json({
      purchaseId: purchaseData.id,
      paymentLink: paymentLink,
      purchaseData: purchaseData,
    })
  } catch (error) {
    console.error("Error creating checkout:", error)
    return NextResponse.json({ error: "Error creating checkout" }, { status: 500 })
  }
}
