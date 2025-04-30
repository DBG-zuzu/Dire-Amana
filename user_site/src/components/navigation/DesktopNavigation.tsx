import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Settings,
  SendHorizontal,
  LogIn,
  LogOut,
  ShoppingBag,
  Home,
  ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { NavigationLink } from "./NavigationLink";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";

interface DesktopNavigationProps {
  onLogout: () => void;
}

export const DesktopNavigation = ({ onLogout }: DesktopNavigationProps) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { totalItems } = useStore?.() || { totalItems: 0 };

  return (
    <div className="hidden md:flex items-center space-x-4">
      <NavigationLink
        to="/"
        icon={ShoppingBag}
        isActive={location.pathname === '/' && location.pathname.indexOf('/dashboard') === -1}
      >
        Shop
      </NavigationLink>
      
      <NavigationLink
        to="/dashboard"
        icon={LayoutDashboard}
        isActive={location.pathname === '/dashboard'}
      >
        Dashboard
      </NavigationLink>
      
      <NavigationLink
        to="/customers"
        icon={Users}
        isActive={location.pathname === '/customers'}
      >
        Customers
      </NavigationLink>
      
      <NavigationLink
        to="/send-cash"
        icon={SendHorizontal}
        isActive={location.pathname === '/send-cash'}
      >
        Send Cash
      </NavigationLink>
      
      <NavigationLink
        to="/settings"
        icon={Settings}
        isActive={location.pathname === '/settings'}
      >
        Settings
      </NavigationLink>
      
      <NavigationLink
        to="/cart"
        icon={ShoppingCart}
        isActive={location.pathname === '/cart'}
      >
        Cart {totalItems > 0 && `(${totalItems})`}
      </NavigationLink>
      
      <div className="ml-4">
        {isAuthenticated ? (
          <Button
            variant="outline"
            className="flex items-center gap-2 border-red-500 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-gray-700"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        ) : (
          <Button
            variant="outline"
            asChild
            className={`flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-gray-700 ${location.pathname === '/login' ? 'bg-blue-50 dark:bg-gray-700' : ''}`}
          >
            <Link to="/login">
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};