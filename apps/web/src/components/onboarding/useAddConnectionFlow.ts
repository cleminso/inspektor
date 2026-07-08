import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { fetchSchemaHashes } from "jazz-tools";

import { useInspector } from "@/components/providers/inspectorProvider";
import { findConnectionByCredentials } from "@/lib/config/connectionIdentity";
import { normalizeBranchName, normalizeEnvName } from "@/lib/config/connections";
import { appRoutes } from "@/lib/navigation/appRoutes";

import {
  createInitialFormValues,
  type AddConnectionFormValues,
  type AddConnectionStep,
} from "./connectionFormTypes";

type FormSubmitHandler = NonNullable<React.ComponentProps<"form">["onSubmit"]>;

export interface UseAddConnectionFlowResult {
  errorMessage: string | null;
  formValues: AddConnectionFormValues;
  isSubmitting: boolean;
  schemaHashes: string[];
  step: AddConnectionStep;
  fetchSchemas: FormSubmitHandler;
  goBackToForm: () => void;
  selectSchema: (schemaHash: string) => Promise<void>;
  updateField: (field: keyof AddConnectionFormValues, value: string) => void;
}

export function useAddConnectionFlow(): UseAddConnectionFlowResult {
  const { connections, prefill, saveConnection, setActiveConnection } = useInspector();
  const navigate = useNavigate();
  const [step, setStep] = useState<AddConnectionStep>("form");
  const [formValues, setFormValues] = useState<AddConnectionFormValues>(() => createInitialFormValues(prefill));
  const [schemaHashes, setSchemaHashes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit =
    formValues.serverUrl.trim().length > 0 &&
    formValues.appId.trim().length > 0 &&
    formValues.adminSecret.trim().length > 0;

  const updateField = (field: keyof AddConnectionFormValues, value: string) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  };

  const openResolvedConnection = async (schemaHash: string) => {
    const branch = normalizeBranchName(formValues.branch);
    const draft = {
      name: formValues.name,
      serverUrl: formValues.serverUrl,
      appId: formValues.appId,
      adminSecret: formValues.adminSecret,
      env: normalizeEnvName(formValues.env),
    };
    const existingConnection = findConnectionByCredentials(connections, draft);
    const connection = existingConnection ?? saveConnection(draft);

    if (existingConnection !== null) {
      setActiveConnection(connection.id);
    }

    await navigate({
      to: appRoutes.tables,
      params: {
        connectionId: connection.id,
        branch,
        schemaHash,
      },
    });
  };

  const fetchSchemas: FormSubmitHandler = async (event) => {
    event.preventDefault();

    if (canSubmit === false || isSubmitting === true) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetchSchemaHashes(formValues.serverUrl.trim(), {
        appId: formValues.appId.trim(),
        adminSecret: formValues.adminSecret.trim(),
      });

      if (response.hashes.length === 0) {
        setErrorMessage("No stored schemas were found for this server.");
        setSchemaHashes([]);
        setStep("form");
        return;
      }

      if (response.hashes.length === 1) {
        await openResolvedConnection(response.hashes[0]);
        return;
      }

      setSchemaHashes(response.hashes);
      setStep("schema");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectSchema = async (schemaHash: string) => {
    if (isSubmitting === true) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await openResolvedConnection(schemaHash);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setIsSubmitting(false);
    }
  };

  const goBackToForm = () => {
    setErrorMessage(null);
    setStep("form");
  };

  return {
    errorMessage,
    fetchSchemas,
    formValues,
    goBackToForm,
    isSubmitting,
    schemaHashes,
    selectSchema,
    step,
    updateField,
  };
}
