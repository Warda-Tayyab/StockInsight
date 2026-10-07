const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-28 bg-slate-200 rounded-xl" />
      ))}
    </div>
    <div className="h-80 bg-slate-200 rounded-xl" />
    <div className="h-48 bg-slate-200 rounded-xl" />
  </div>
);

export default LoadingSkeleton;
