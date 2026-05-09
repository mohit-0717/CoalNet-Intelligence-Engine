import { NavLink } from "react-router-dom";
import { Home, LayoutDashboard, FileInput, Brain, Route, Map, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";
import { Bell, RefreshCw } from "lucide-react";

const Navbar = () => {
  const { currentUser, logout } = useAuth();

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Input", path: "/input", icon: FileInput },
    { name: "Forecast", path: "/visualization", icon: Brain },
    { name: "Pathways", path: "/pathways", icon: Route },
    { name: "AI Strategic Roadmap", path: "/roadmap", icon: Map },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Successfully logged out!');
    } catch (error) {
      console.error('Failed to log out:', error);
      toast.error('Failed to log out');
    }
  };

  const getInitials = (displayName: string | null) => {
    if (!displayName) return 'U';
    return displayName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const [briefings, setBriefings] = useState<any[]>([]);
  const [loadingBriefings, setLoadingBriefings] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const fetchBriefings = async () => {
    setLoadingBriefings(true);
    try {
      const data = await api.getBriefings();
      setBriefings(data || []);
      if (data && data.length > 0) {
        setHasUnread(true);
      }
    } catch (error) {
      console.error("Failed to fetch briefings", error);
    } finally {
      setLoadingBriefings(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchBriefings();
    }
  }, [currentUser]);

  const handleTriggerBriefing = async () => {
    try {
      toast.info("Generating AI Briefing... (Takes ~15 seconds)");
      await api.triggerBriefing();
      // Increase timeout to 20 seconds because LLM generation + email + WhatsApp is slow
      setTimeout(fetchBriefings, 20000); 
    } catch (e) {
      toast.error("Failed to trigger briefing");
    }
  };

  return (
    <nav className="fixed top-3 left-2 right-2 sm:top-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 animate-fade-in">
      <div className="glass-effect px-2 sm:px-6 py-2 sm:py-3 rounded-full border border-white/20 backdrop-blur-xl shadow-2xl max-w-full overflow-x-auto">
        <ul className="flex items-center gap-1 min-w-max sm:min-w-0">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg scale-105"
                      : "text-foreground/80 hover:text-foreground hover:bg-accent/50"
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline whitespace-nowrap">{item.name}</span>
              </NavLink>
            </li>
          ))}
          
          {/* Notification Inbox */}
          {currentUser && (
            <li className="ml-1 sm:ml-2">
              <Popover onOpenChange={(open) => open && setHasUnread(false)}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-full text-foreground/80 hover:text-foreground hover:bg-accent/50">
                    <Bell className="w-5 h-5" />
                    {hasUnread && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0 glass-effect border-white/20">
                  <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h4 className="font-semibold text-sm">AI Daily Briefings</h4>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={handleTriggerBriefing}>
                      <RefreshCw className="w-3 h-3 mr-1" /> Fresh Report
                    </Button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto p-2">
                    {loadingBriefings ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">Loading...</div>
                    ) : briefings.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">No briefings found.</div>
                    ) : (
                      briefings.map((b) => (
                        <div key={b._id} className="p-3 mb-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5 cursor-pointer">
                          <p className="text-xs font-semibold mb-1 truncate">{b.subject}</p>
                          <p className="text-[10px] text-muted-foreground mb-2">
                            {new Date(b.date).toLocaleString()}
                          </p>
                          <div className="text-xs line-clamp-2 text-foreground/80 prose prose-invert max-w-none prose-p:my-0">
                            {/* Strip style blocks and HTML tags for preview since it's now full Apple-style HTML */}
                            {b.markdownBody.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().slice(0, 100)}...
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </li>
          )}

          {/* User Menu */}
          <li className="ml-1 sm:ml-2">
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 text-foreground/80 hover:text-foreground hover:bg-accent/50"
                  >
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {getInitials(currentUser.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden sm:inline">
                      {currentUser.displayName || 'User'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <NavLink to="/user" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <NavLink
                to="/auth"
                className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 text-foreground/80 hover:text-foreground hover:bg-accent/50"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Login</span>
              </NavLink>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
