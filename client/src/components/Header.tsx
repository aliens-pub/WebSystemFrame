import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Box, Lock, UserRoundCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const menuItems = [
    { name: "메뉴1", path: "/menu1" },
    { name: "메뉴2", path: "/menu2" },
    { name: "메뉴3", path: "/menu3" },
    { name: "메뉴4", path: "/menu4", requiresManager: true },
  ];

  const isActive = (path: string) => location === path;
  const canAccessMenu4 = user?.role === "MANAGER";

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Box className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="ml-2 text-xl font-semibold text-gray-900">
                  BizSystem
                </span>
              </div>
            </Link>

            {/* Navigation Menu */}
            <nav className="hidden md:flex space-x-1">
              {menuItems.map((item) => {
                if (item.requiresManager && !canAccessMenu4) {
                  return (
                    <div
                      key={item.name}
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-400 cursor-not-allowed flex items-center"
                    >
                      {item.name}
                      <Lock className="ml-1 h-3 w-3" />
                    </div>
                  );
                }

                return (
                  <Link key={item.name} href={item.path}>
                    <div
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                        isActive(item.path)
                          ? "bg-primary/10 text-primary"
                          : "text-gray-700 hover:text-primary hover:bg-primary/5"
                      }`}
                    >
                      {item.name}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">
            {/* User Role Badge */}
            <div className="hidden sm:flex items-center">
              <Badge variant="secondary" className="flex items-center">
                <UserRoundCheck className="mr-1 h-3 w-3" />
                {user?.role}
              </Badge>
            </div>

            {/* User Greeting */}
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{user?.username}</span>님 안녕하세요!
              </div>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10">
                  <UserRoundCheck className="h-4 w-4 text-primary" />
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-slate-200 px-4 py-2">
          <div className="flex space-x-1">
            {menuItems.map((item) => {
              if (item.requiresManager && !canAccessMenu4) {
                return (
                  <div
                    key={item.name}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-400 cursor-not-allowed flex items-center"
                  >
                    {item.name}
                    <Lock className="ml-1 h-3 w-3" />
                  </div>
                );
              }

              return (
                <Link key={item.name} href={item.path}>
                  <div
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                      isActive(item.path)
                        ? "bg-primary/10 text-primary"
                        : "text-gray-700 hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
