"use client";

import { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STATUS_CONFIG, PAGE_SIZE } from "./dashboard.constants";
import { formatDate, formatRupiah } from "./dashboard.utils";
import type { Transaksi, StatusTransaksi } from "@/types/dashboard";

interface TransaksiTableProps {
  data: Transaksi[];
}

export function TransaksiTable({ data }: TransaksiTableProps) {
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [page, setPage]               = useState(1);

// filter
  const filtered = useMemo(() => {
    return data.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        r.anggota.toLowerCase().includes(q) ||
        r.buku.toLowerCase().includes(q);
      const matchStatus =
        filterStatus === "all" || r.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [search, filterStatus, data]);

// pagination
  const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage  = Math.min(page, totalPages);
  const pageData     = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const startItem    = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem      = Math.min(currentPage * PAGE_SIZE, filtered.length);

  const handleFilterChange = (val: string | null) => {
  if (val) {
    setFilterStatus(val);
    setPage(1);
  }
};

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // Compute page numbers with ellipsis
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
    .reduce<(number | "...")[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

  return (
    <Card className="shadow-sm border-border">
      {/* Header */}
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-sm font-medium">Transaksi Terbaru</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={filterStatus} onValueChange={handleFilterChange}>
              <SelectTrigger className="h-8 w-full text-xs sm:w-[150px] border-border">
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="dipinjam">Dipinjam</SelectItem>
                <SelectItem value="terlambat">Terlambat</SelectItem>
                <SelectItem value="kembali">Kembali</SelectItem>
                <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari anggota / buku..."
                value={search}
                onChange={handleSearchChange}
                className="h-8 w-full pl-8 text-xs sm:w-[200px] border-border"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-muted/20 border-b border-border/50">
              {["#", "Anggota", "Buku", "Tgl Pinjam", "Tgl Kembali", "Status", "Denda", "Aksi"].map(
                (h, i) => (
                  <TableHead
                    key={h}
                    className={`text-xs font-bold uppercase text-muted-foreground ${i === 0 ? "w-10 pl-6" : ""} ${i === 7 ? "pr-6 text-right" : ""}`}
                  >
                    {h}
                  </TableHead>
                )
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {pageData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-12 text-center text-sm font-medium text-muted-foreground"
                >
                  Tidak ada data transaksi ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              pageData.map((row, i) => {
                const cfg =
                  STATUS_CONFIG[row.status as StatusTransaksi] ?? {
                    label: row.status,
                    variant: "outline" as const,
                    className: "bg-muted",
                  };

                return (
                  <TableRow key={row.id} className="border-b border-border/40">
                    <TableCell className="pl-6 text-xs text-muted-foreground">
                      {(currentPage - 1) * PAGE_SIZE + i + 1}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-sm leading-tight text-foreground">
                        {row.anggota}
                      </div>
                      <div className="text-xs font-medium text-muted-foreground mt-0.5">
                        {row.kelas}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{row.buku}</TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">
                      {formatDate(row.tgl_pinjam)}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">
                      {formatDate(row.tgl_kembali)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={cfg.variant}
                        className={`text-[10px] tracking-wide font-bold uppercase border ${cfg.className}`}
                      >
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {row.denda > 0 ? (
                        <span className="text-xs font-bold text-destructive">
                          {formatRupiah(row.denda)}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary hover:bg-primary/10"
                      >
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/10">
          <p className="text-xs font-medium text-muted-foreground">
            {filtered.length === 0
              ? "Tidak ada data"
              : `Menampilkan ${startItem}–${endItem} dari ${filtered.length} transaksi`}
          </p>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-border"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {pageNumbers.map((item, idx) =>
              item === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground">
                  …
                </span>
              ) : (
                <Button
                  key={item}
                  variant={currentPage === item ? "default" : "outline"}
                  size="icon"
                  className={`h-8 w-8 text-xs font-bold ${currentPage !== item ? "border-border" : ""}`}
                  onClick={() => setPage(item as number)}
                >
                  {item}
                </Button>
              )
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-border"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}