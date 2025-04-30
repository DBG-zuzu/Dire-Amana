import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Settings,
  SendHorizontal,
  LogIn,
  LogOut,
  ShoppingBag,
  ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { NavigationLink } from "./NavigationLink";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";

interface MobileNavigationProps {
  isOpen: boolean;
  onLinkClick: () => void;
  onLogout: () => void;
}

export const MobileNavigation = ({
  isOpen,
  onLinkClick,
  onLogout
}: MobileNavigationProps) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { totalItems } = useStore?.() || { totalItems: 0 };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="md:hidden">
      <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-800">
        <NavigationLink
          to="/"
          icon={ShoppingBag}
          isActive={location.pathname === '/' && location.pathname.indexOf('/dashboard') === -1}
          onClick={onLinkClick}
        >
          Shop
        </NavigationLink>
        
        <NavigationLink
          to="/dashboard"
          icon={LayoutDashboard}
          isActive={location.pathname === '/dashboard'}
          onClick={onLinkClick}
        >
          Dashboard
        </NavigationLink>
        
        <NavigationLink
          to="/customers"
          icon={Users}
          isActive={location.pathname === '/customers'}
          onClick={onLinkClick}
        >
          Customers
        </NavigationLink>
        
        <NavigationLink
          to="/send-cash"
          icon={SendHorizontal}
          isActive={location.pathname === '/send-cash'}
          onClick={onLinkClick}
        >
          Send Cash
        </NavigationLink>
        
        <NavigationLink
          to="/settings"
          icon={Settings}
          isActive={location.pathname === '/settings'}
          onClick={onLinkClick}
        >
          Settings
        </NavigationLink>
        
        <NavigationLink
          to="/cart"
          icon={ShoppingCart}
          isActive={location.pathname === '/cart'}
          onClick={onLinkClick}
        >
          Cart {totalItems > 0 && `(${totalItems})`}
        </NavigationLink>
        
        {/* Auth Button (Mobile) */}
        {isAuthenticated ? (
          <Button
            variant="outline"
            className="w-full justify-start border-red-500 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-gray-700"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        ) : (
          <Button
            variant="outline"
            asChild
            className={`w-full justify-start border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-gray-700 ${location.pathname === '/login' ? 'bg-blue-50 dark:bg-gray-700' : ''}`}
          >
            <Link to="/login" className="flex items-center gap-2" onClick={onLinkClick}>
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};