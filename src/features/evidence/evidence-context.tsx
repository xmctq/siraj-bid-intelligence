"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { EvidenceSheet } from "./evidence-sheet";

type EvidenceTarget = { page: number; quote?: string };

type EvidenceContextValue = {
  tenderId: string;
  pageCount: number;
  openEvidence: (page: number, quote?: string) => void;
};

const EvidenceContext = createContext<EvidenceContextValue | null>(null);

export function EvidenceProvider({
  tenderId,
  pageCount,
  children,
}: {
  tenderId: string;
  pageCount: number;
  children: ReactNode;
}) {
  const [target, setTarget] = useState<EvidenceTarget | null>(null);
  const openEvidence = useCallback((page: number, quote?: string) => setTarget({ page, quote }), []);
  const value = useMemo(() => ({ tenderId, pageCount, openEvidence }), [tenderId, pageCount, openEvidence]);

  return (
    <EvidenceContext.Provider value={value}>
      {children}
      <EvidenceSheet
        tenderId={tenderId}
        pageCount={pageCount}
        target={target}
        onNavigate={(page) => setTarget({ page })}
        onClose={() => setTarget(null)}
      />
    </EvidenceContext.Provider>
  );
}

export function useEvidence(): EvidenceContextValue | null {
  return useContext(EvidenceContext);
}
