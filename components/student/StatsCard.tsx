// Student stats card shown on dashboard
interface StatsCardProps {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
}

export default function StatsCard({ label, value, icon, trend }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
          {trend && (
            <p className="text-xs text-emerald-600 mt-1 font-medium">{trend}</p>
          )}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
