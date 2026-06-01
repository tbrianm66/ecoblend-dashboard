import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { roles, ventures, type RoleConfig } from "../mock/data";
import type { RoleKey } from "../mock/types";

interface RoleContextValue {
  role: RoleConfig;
  setRole: (key: RoleKey) => void;
  ventureId: string;
  setVentureId: (id: string) => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [roleKey, setRoleKey] = useState<RoleKey>("founder");
  const [ventureId, setVentureId] = useState<string>(ventures[0].id);

  const value = useMemo<RoleContextValue>(() => {
    const role = roles.find((r) => r.key === roleKey) ?? roles[0];
    return { role, setRole: setRoleKey, ventureId, setVentureId };
  }, [roleKey, ventureId]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
