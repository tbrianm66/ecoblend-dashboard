import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  FileText,
  FlaskConical,
  Gauge,
  Leaf,
  Library,
  ShieldAlert,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useRole } from "./context/RoleContext";
import { roles } from "./mock/data";
import type { RoleKey } from "./mock/types";

const nav = [
  { path: "/v2", label: "Command Centre", icon: Gauge },
  { path: "/v2/evidence", label: "Evidence Library", icon: Library },
  { path: "/v2/agents", label: "Agent Activity", icon: Activity },
  { path: "/v2/risks", label: "Risk & Blockers", icon: ShieldAlert },
  { path: "/v2/gates", label: "Stage-Gate Board", icon: FlaskConical },
  { path: "/v2/reports", label: "Reports & Data Room", icon: FileText },
];

export function V2Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { role, setRole } = useRole();

  return (
    <div className="flex min-h-screen w-full bg-muted/30 text-foreground">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-background md:flex">
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Leaf className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">ECOBLEND OS</p>
            <p className="text-[11px] text-muted-foreground">Validation Platform v2</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const active = location === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← Back to legacy platform
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <Leaf className="h-5 w-5 text-primary" />
            <span className="font-semibold">ECOBLEND v2</span>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
              Prototype · mock data
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">Viewing as</span>
            <Select value={role.key} onValueChange={(v) => setRole(v as RoleKey)}>
              <SelectTrigger className="w-[230px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.key} value={r.key}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="flex gap-1 overflow-x-auto border-b bg-background px-2 py-2 md:hidden">
          {nav.map((item) => {
            const active = location === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs ${
                  active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
