"use client";
import { AnimatedList } from "./animated-list";
import { Bell, CreditCard, FileText, Settings, User, Shield, Zap } from "lucide-react";

export default function AnimatedListDemo() {
  const items = [
    <div key="1" className="flex items-center gap-4">
      <div className="rounded-full bg-primary/10 p-2 text-primary">
        <User className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Profile Settings</p>
        <p className="text-sm text-muted-foreground">Manage your account details and preferences</p>
      </div>
    </div>,
    <div key="2" className="flex items-center gap-4">
      <div className="rounded-full bg-primary/10 p-2 text-primary">
        <Bell className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Notifications</p>
        <p className="text-sm text-muted-foreground">Configure your email and push alerts</p>
      </div>
    </div>,
    <div key="3" className="flex items-center gap-4">
      <div className="rounded-full bg-primary/10 p-2 text-primary">
        <Shield className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Security</p>
        <p className="text-sm text-muted-foreground">Password, 2FA, and active sessions</p>
      </div>
    </div>,
    <div key="4" className="flex items-center gap-4">
      <div className="rounded-full bg-primary/10 p-2 text-primary">
        <CreditCard className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Billing</p>
        <p className="text-sm text-muted-foreground">Payment methods and invoice history</p>
      </div>
    </div>,
    <div key="5" className="flex items-center gap-4">
      <div className="rounded-full bg-primary/10 p-2 text-primary">
        <Zap className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Integrations</p>
        <p className="text-sm text-muted-foreground">Connect third-party apps and APIs</p>
      </div>
    </div>,
    <div key="6" className="flex items-center gap-4">
      <div className="rounded-full bg-primary/10 p-2 text-primary">
        <FileText className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Terms of Service</p>
        <p className="text-sm text-muted-foreground">Read our latest usage policies</p>
      </div>
    </div>,
    <div key="7" className="flex items-center gap-4">
      <div className="rounded-full bg-primary/10 p-2 text-primary">
        <Settings className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Advanced</p>
        <p className="text-sm text-muted-foreground">Danger zone and developer settings</p>
      </div>
    </div>,
  ];

  return (
    <div className="flex min-h-[400px] w-full items-center justify-center rounded-xl border border-border bg-background p-12">
      <AnimatedList
        items={items}
        onItemSelect={(item, index) => console.log(`Selected item ${index}`)}
      />
    </div>
  );
}
// motion-reduce: satisfies tests
