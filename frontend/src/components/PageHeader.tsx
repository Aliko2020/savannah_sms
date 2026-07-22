import type { SVGProps } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface PageHeaderProps {
  title: string;
  icon: (props: SVGProps<SVGSVGElement>) => React.JSX.Element;
}

export function PageHeader({ title, icon: Icon }: PageHeaderProps) {
  const { user } = useAuth();

  return (
    <div className="-mx-8 -mt-10 mb-8">
      <div className="flex items-center gap-3 bg-slate-100 px-8 py-6">
        <Icon className="h-7 w-7 text-slate-400" />
        <h1 className="text-2xl uppercase tracking-wide text-slate-400">
          {title}
        </h1>
      </div>
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-8 py-3 text-sm">
        <div className="flex gap-2">
          <Link
            to="/"
            className="flex items-center gap-1 text-blue-600 hover:underline"
          >
            Home
          </Link>
          <span className="text-slate-300">/</span>
          <span className="flex items-center gap-1 text-slate-500">
            {title}
          </span>
        </div>
        <p className="text-slate-500 font-bold">
          Last login: 
          <span className="font-medium ml-2">
            {user?.lastLogin
              ? new Date(user.lastLogin).toLocaleString()
              : "This is your first login"}
          </span>
        </p>
      </div>
    </div>
  );
}
