import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DesktopNavigation } from '@/components/navigation/DesktopNavigation';
import { MobileNavigation } from '@/components/navigation/MobileNavigation';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { StoreProvider } from '@/contexts/StoreContext';
import { AdminProvider } from '@/contexts/AdminContext';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

function AppContent() {
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const handleMobileMenuClose = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={handleMobileMenuToggle}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <DesktopNavigation onLogout={logout} />
        </div>
        <MobileNavigation
          isOpen={isMobileMenuOpen}
          onLinkClick={handleMobileMenuClose}
          onLogout={logout}
        />
      </header>
      <main className="container py-6">
        <Routes>
          <Route path="/" element={<div>Shop Page</div>} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          <Route path="/customers" element={<div>Customers Page</div>} />
          <Route path="/send-cash" element={<div>Send Cash Page</div>} />
          <Route path="/settings" element={<div>Settings Page</div>} />
          <Route path="/cart" element={<div>Cart Page</div>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <StoreProvider>
          <AdminProvider>
            <AppContent />
          </AdminProvider>
        </StoreProvider>
      </AuthProvider>
    </Router>
  );
}