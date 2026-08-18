// Auth form wrapper component
interface AuthFormProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function AuthForm({ title, subtitle, children, onSubmit }: AuthFormProps) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-3">
          <span className="text-4xl">⚛️</span>
        </div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-slate-300 mt-1 text-sm">{subtitle}</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-5">
        {children}
      </form>
    </div>
  );
}
