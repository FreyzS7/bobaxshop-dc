import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatIDR } from "@bobaxshop/shared"
import type { Order } from "@bobaxshop/database"
import Link from "next/link"

const statusConfig: Record<string, { label: string; className: string }> = {
  waiting_payment: { label: 'Waiting', className: 'bg-muted text-muted-foreground' },
  paid:            { label: 'Paid',    className: 'bg-blue-500/10 text-blue-400' },
  processing:      { label: 'Processing', className: 'bg-yellow-500/10 text-yellow-400' },
  completed:       { label: 'Completed',  className: 'bg-green-500/10 text-green-400' },
  cancelled:       { label: 'Cancelled',  className: 'bg-destructive/10 text-destructive' },
}

export default function RecentOrders({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return <p className="text-muted-foreground text-sm">Belum ada order.</p>
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-muted-foreground">Order #</TableHead>
            <TableHead className="text-muted-foreground">Buyer</TableHead>
            <TableHead className="text-muted-foreground">Robux</TableHead>
            <TableHead className="text-muted-foreground">Total</TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const status = statusConfig[order.orderStatus] ?? statusConfig.waiting_payment
            return (
              <TableRow key={order.id}>
                <TableCell>
                  <Link href={`/orders/${order.id}`} className="text-primary hover:underline text-sm">
                    {order.orderNumber}
                  </Link>
                </TableCell>
                <TableCell className="text-foreground text-sm">{order.buyerUsername}</TableCell>
                <TableCell className="text-foreground text-sm">{order.robuxAmount.toLocaleString("id-ID")}</TableCell>
                <TableCell className="text-foreground text-sm">{formatIDR(order.priceIdr)}</TableCell>
                <TableCell>
                  <Badge className={cn("px-2 py-0.5 rounded-full", status.className)}>
                    {status.label}
                  </Badge>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
