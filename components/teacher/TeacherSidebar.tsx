// Teacher sidebar navigation
import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/students", label: "Students", icon: "👨‍🎓" },
  { href: "/courses", label: "Courses", icon: "📚" },
  { href: "/assignments", label: "Assignments", icon: "📋" },
  { href: "/tests", label: "Tests", icon: "📝" },
  { href: "/announcements", label: "Announcements", icon: "📣" },
];

export default function TeacherSidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">⚛️</span>
          <span className="font-bold text-slate-800 text-sm leading-tight">
            Sachin Physics <span className="text-indigo-600">Classes</span>
          </span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <button className="w-full text-sm text-gray-500 hover:text-red-500 transition-colors text-left px-4 py-2">
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
}
