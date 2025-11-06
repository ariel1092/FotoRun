// MercadoPago server-side configuration and helper functions
// This file should only be imported in server components, route handlers, and server actions

// Server-side only configuration
function getMercadoPagoAccessToken(): string {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured")
  }

  return accessToken
}

export interface PaymentItem {
  id: string
  title: string
  description: string
  quantity: number
  unit_price: number
  currency_id: string
}

export interface PreferenceData {
  items: PaymentItem[]
  back_urls: {
    success: string
    failure: string
    pending: string
  }
  auto_return: "approved" | "all"
  notification_url: string
  metadata?: Record<string, any>
}

// Server-side only - creates payment preference
export async function createPaymentPreference(data: PreferenceData) {
  const accessToken = getMercadoPagoAccessToken()

  // TODO: Use MercadoPago SDK
  // const mercadopago = new MercadoPago(accessToken)
  // return await mercadopago.preferences.create(data)

  // Mock response for development
  return {
    id: "mock-preference-id",
    init_point: "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=mock",
    sandbox_init_point: "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=mock",
  }
}

// Server-side only - gets payment details
export async function getPaymentDetails(paymentId: string) {
  const accessToken = getMercadoPagoAccessToken()

  // TODO: Use MercadoPago SDK
  // const mercadopago = new MercadoPago(accessToken)
  // return await mercadopago.payment.get(paymentId)

  // Mock response for development
  return {
    id: paymentId,
    status: "approved",
    status_detail: "accredited",
    transaction_amount: 1500,
    payer: {
      email: "user@example.com",
    },
  }
}
