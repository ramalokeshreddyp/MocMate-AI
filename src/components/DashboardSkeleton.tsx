import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardSkeleton = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-card border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-3 w-32" />
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-card border border-border">
          <Skeleton className="h-6 w-40 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="p-6 rounded-2xl bg-card border border-border">
          <Skeleton className="h-6 w-40 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="p-6 rounded-2xl bg-card border border-border"
          >
            <Skeleton className="h-12 w-12 rounded-full mb-4" />
            <Skeleton className="h-5 w-28 mb-2" />
            <Skeleton className="h-3 w-full" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DashboardSkeleton;
