"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

interface UserMenuProps {
  userName?: string | null;
  signOutSlot: React.ReactNode;
}

export function UserMenu({ userName, signOutSlot }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="gap-1.5" />}>
        <User className="h-4 w-4" />
        <span className="hidden sm:inline max-w-[100px] truncate">
          {userName ?? "Account"}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/profile" />}>
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/my-prayers" />}>
          My Prayers
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/saved-churches" />}>
          Saved Churches
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {signOutSlot}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
