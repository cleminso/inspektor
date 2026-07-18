import { createContext } from "react";

export interface FieldContextValue {
  disabled: boolean;
}

export const FieldContext = createContext<FieldContextValue | null>(null);
