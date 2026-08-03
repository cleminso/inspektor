import { createContext } from "react";

import type { InputSize } from "../input/input";

export interface InputGroupContextValue {
  disabled: boolean;
  invalid: boolean;
  size: InputSize;
}

export const InputGroupContext = createContext<InputGroupContextValue | null>(null);
