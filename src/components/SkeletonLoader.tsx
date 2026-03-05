"use client";

import { Card } from "@/components/ui/card";

interface SkeletonProps {
  className?: string;
}

export const TextSkeleton = ({ className = "" }: SkeletonProps) => (
  <div className={`h-4 bg-gray-200 rounded animate-pulse ${className}`} />
);

export const CircleSkeleton = ({ className = "" }: SkeletonProps) => (
  <div className={`rounded-full bg-gray-200 animate-pulse ${className}`} />
);

export const ButtonSkeleton = ({ className = "" }: SkeletonProps) => (
  <div className={`h-10 bg-gray-200 rounded-lg animate-pulse ${className}`} />
);

export const CardSkeleton = ({ className = "" }: SkeletonProps) => (
  <Card className={`p-4 ${className}`}>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
      <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
    </div>
  </Card>
);

export const TableRowSkeleton = () => (
  <div className="p-4 border-b border-gray-100">
    <div className="flex items-center justify-between">
      <div className="space-y-2 flex-1">
        <TextSkeleton className="w-48" />
        <TextSkeleton className="w-32" />
      </div>
      <TextSkeleton className="w-16" />
    </div>
  </div>
);
