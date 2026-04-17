"use client";

import { AlertCircle, RotateCcwIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 bg-muted" />
        <Skeleton className="h-4 w-64 bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-xl bg-muted lg:col-span-2" />
        <Skeleton className="h-64 rounded-xl bg-muted" />
      </div>
      <Skeleton className="h-96 w-full rounded-xl bg-muted" />
    </div>
  );
}

interface DashboardErrorProps {
  message: string;
  onRetry: () => void;
}

export function DashboardError({ message, onRetry }: DashboardErrorProps) {
  return (
    <div className="p-6">
      <Alert
        variant="destructive"
        className="border-destructive/30 bg-destructive/10 text-destructive"
      >
        <AlertCircle className="h-5 w-5 text-destructive" />
        <AlertTitle className="font-bold">Gagal memuat data</AlertTitle>
        <AlertDescription className="flex items-center justify-between mt-2">
          <span>{message}</span>
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="h-8 border-destructive/30 text-destructive hover:bg-destructive/20 bg-transparent"
          >
            <RotateCcwIcon className="h-3 w-3 mr-2" />
            Coba Lagi
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}