"use client";

import { Dock, DockItem } from "./dock";
import { Home, Settings, User, Mail, Bell } from "lucide-react";

export default function DockDemo() {
  return (
    <div className="relative flex min-h-[400px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-background/50">
      <div className="absolute bottom-8">
        <Dock>
          <DockItem label="Home" href="#">
            <Home className="size-5" />
          </DockItem>
          <DockItem label="Profile" href="#">
            <User className="size-5" />
          </DockItem>
          <DockItem label="Notifications" href="#">
            <Bell className="size-5" />
          </DockItem>
          <DockItem label="Messages" href="#">
            <Mail className="size-5" />
          </DockItem>
          <DockItem label="Settings" href="#">
            <Settings className="size-5" />
          </DockItem>
        </Dock>
      </div>
    </div>
  );
}
