import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface NavigationLinkProps {
  to: string;
  icon: LucideIcon;
  isActive: boolean;
  children: React.ReactNode;
}

export const NavigationLink = ({ to, icon: Icon, isActive, children }: NavigationLinkProps) => {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-primary hover:bg-accent'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </Link>
  );
};