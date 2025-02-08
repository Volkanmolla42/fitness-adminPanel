"use client"
import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Database } from "@/types/supabase"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type MemberPayment = Database["public"]["Tables"]["member_payments"]["Row"]

interface MemberPaymentColumnProps {
  onEdit: (payment: MemberPayment) => void
  onDelete: (payment: MemberPayment) => void
}

export const columns = ({
  onEdit,
  onDelete,
}: MemberPaymentColumnProps): ColumnDef<MemberPayment>[] => [
  {
    accessorKey: "member_name",
    header: "Üye Adı",
  },
  {
    accessorKey: "created_at",
    header: "Ödeme Tarihi",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return format(date, "PPP", { locale: tr })
    },
  },
  {
    accessorKey: "credit_card_paid",
    header: "Kredi Kartı Ödemesi",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("credit_card_paid"))
      const formatted = new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
      }).format(amount)
      return formatted
    },
  },
  {
    accessorKey: "cash_paid",
    header: "Nakit Ödeme",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("cash_paid"))
      const formatted = new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
      }).format(amount)
      return formatted
    },
  },
  {
    id: "total",
    header: "Toplam Ödeme",
    cell: ({ row }) => {
      const creditCard = parseFloat(row.getValue("credit_card_paid"))
      const cash = parseFloat(row.getValue("cash_paid"))
      const total = creditCard + cash
      const formatted = new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
      }).format(total)
      return formatted
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const payment = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Menüyü aç</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(payment)}>
              <Pencil className="mr-2 h-4 w-4" />
              Düzenle
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(payment)}
              className="text-red-600"
            >
              <Trash className="mr-2 h-4 w-4" />
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
