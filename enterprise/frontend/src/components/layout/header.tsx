import { Button } from "@/components/ui/button";
import { User, Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  return (
    <div className="flex items-center justify-between w-full h-16 px-6 border-b bg-background">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger could go here */}
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-8 w-8 rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-muted hover:bg-slate-200 transition-colors">
              <User className="h-4 w-4 text-slate-700" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Admin User</p>
                <p className="text-xs leading-none text-muted-foreground">admin@remitwise.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
