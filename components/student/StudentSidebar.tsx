// Student sidebar navigation
import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/courses", label: "My Courses", icon: "📖" },
  { href: "/assignments", label: "Assignments", icon: "📝" },
  { href: "/tests", label: "Tests", icon: "✅" },
  { href: "/results", label: "Results", icon: "📊" },
];

export default function StudentSidebar() {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">⚛️</span>
          <span className="font-bold text-slate-800 text-sm leading-tight">
            Sachin Physics <span className="text-blue-600">Classes</span>
          </span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-100">
        <button className="w-full text-sm text-slate-500 hover:text-red-500 transition-colors text-left px-4 py-2">
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
}
