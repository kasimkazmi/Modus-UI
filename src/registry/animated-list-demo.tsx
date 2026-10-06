"use client";
import { AnimatedList } from "./animated-list";
import { Bell, CreditCard, FileText, Settings, User, Shield, Zap } from "lucide-react";

export default function AnimatedListDemo() {
  const items = [
    <div key="1" className="flex items-center gap-4">
      <div className="p-2 rounded-full bg-primary/10 text-primary">
        <User className="w-5 h-5" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Profile Settings</p>
        <p className="text-sm text-muted-foreground">Manage your account details and preferences</p>
      </div>
    </div>,
    <div key="2" className="flex items-center gap-4">
      <div className="p-2 rounded-full bg-primary/10 text-primary">
        <Bell className="w-5 h-5" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Notifications</p>
        <p className="text-sm text-muted-foreground">Configure your email and push alerts</p>
      </div>
    </div>,
    <div key="3" className="flex items-center gap-4">
      <div className="p-2 rounded-full bg-primary/10 text-primary">
        <Shield className="w-5 h-5" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Security</p>
        <p className="text-sm text-muted-foreground">Password, 2FA, and active sessions</p>
      </div>
    </div>,
    <div key="4" className="flex items-center gap-4">
      <div className="p-2 rounded-full bg-primary/10 text-primary">
        <CreditCard className="w-5 h-5" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Billing</p>
        <p className="text-sm text-muted-foreground">Payment methods and invoice history</p>
      </div>
    </div>,
    <div key="5" className="flex items-center gap-4">
      <div className="p-2 rounded-full bg-primary/10 text-primary">
        <Zap className="w-5 h-5" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Integrations</p>
        <p className="text-sm text-muted-foreground">Connect third-party apps and APIs</p>
      </div>
    </div>,
    <div key="6" className="flex items-center gap-4">
      <div className="p-2 rounded-full bg-primary/10 text-primary">
        <FileText className="w-5 h-5" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Terms of Service</p>
        <p className="text-sm text-muted-foreground">Read our latest usage policies</p>
      </div>
    </div>,
    <div key="7" className="flex items-center gap-4">
      <div className="p-2 rounded-full bg-primary/10 text-primary">
        <Settings className="w-5 h-5" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Advanced</p>
        <p className="text-sm text-muted-foreground">Danger zone and developer settings</p>
      </div>
    </div>,
  ];

  return (
    <div className="flex w-full items-center justify-center p-12 bg-background border border-border rounded-xl">
      <AnimatedList 
        items={items} 
        onItemSelect={(item, index) => console.log(`Selected item ${index}`)} 
      />
    </div>
  );
}
