declare module 'midtrans-client' {
  interface CoreApiOptions {
    isProduction: boolean
    serverKey: string
    clientKey: string
  }

  interface ChargeResponse {
    status_code: string
    transaction_id: string
    order_id: string
    gross_amount: string
    payment_type: string
    transaction_time: string
    transaction_status: string
    expiry_time: string
    qr_string?: string
    actions?: Array<{ name: string; method: string; url: string }>
    [key: string]: unknown
  }

  class CoreApi {
    constructor(options: CoreApiOptions)
    charge(parameter: Record<string, unknown>): Promise<ChargeResponse>
    capture(parameter: Record<string, unknown>): Promise<ChargeResponse>
    cancelTransaction(orderId: string): Promise<ChargeResponse>
    refundTransaction(orderId: string, parameter?: Record<string, unknown>): Promise<ChargeResponse>
    getTransactionStatus(orderId: string): Promise<ChargeResponse>
  }
}
