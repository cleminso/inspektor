import { useRef, useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { fetchSchemaHashes } from "jazz-tools";

import { useInspectorSessionContext } from "@app/providers/inspectorSessionProvider";
import { findConnectionByCredentials } from "@app/connections/connectionIdentity";
import { normalizeBranchName, normalizeEnvName } from "@app/connections/connections";
import {
  ConnectionNavigationError,
  EMPTY_SCHEMA_ERROR,
  normalizeConnectionOpenError,
  normalizeSchemaFetchError,
  validateConnectionInput,
  type ConnectionError,
} from "@app/connections/connectionValidation";
import { appRoutes } from "@app/routing/appRoutes";

import {
  createInitialFormValues,
  type AddConnectionFormValues,
  type AddConnectionStep,
} from "./connectionFormTypes";

type FormSubmitHandler = NonNullable<React.ComponentProps<"form">["onSubmit"]>;

interface UseAddConnectionFlowResult {
  error: ConnectionError | null;
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
  const { connections, prefill, saveConnection, setConnectionContext } =
    useInspectorSessionContext();
  const navigate = useNavigate();
  const [step, setStep] = useState<AddConnectionStep>("form");
  const [formValues, setFormValues] = useState<AddConnectionFormValues>(() => createInitialFormValues(prefill));
  const [schemaHashes, setSchemaHashes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ConnectionError | null>(null);
  const isSubmittingRef = useRef(false);

  const canSubmit =
    formValues.serverUrl.trim().length > 0 &&
    formValues.appId.trim().length > 0 &&
    formValues.adminSecret.trim().length > 0;

  const updateField = (field: keyof AddConnectionFormValues, value: string) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
    setError((currentError) => (currentError?.field === field ? null : currentError));
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

    setConnectionContext(connection.id, branch, schemaHash);

    try {
      await navigate({
        to: appRoutes.tables,
        params: {
          connectionId: connection.id,
        },
      });
    } catch {
      throw new ConnectionNavigationError();
    }
  };

  const fetchSchemas: FormSubmitHandler = async (event) => {
    event.preventDefault();

    if (canSubmit === false || isSubmittingRef.current === true) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const validation = validateConnectionInput(formValues);
      if (validation.valid === false) {
        setError(validation.error);
        return;
      }

      setError(null);
      let response: Awaited<ReturnType<typeof fetchSchemaHashes>>;
      try {
        response = await fetchSchemaHashes(validation.value.serverUrl, {
          appId: validation.value.appId,
          adminSecret: validation.value.adminSecret,
        });
      } catch (fetchError) {
        setError(normalizeSchemaFetchError(fetchError));
        return;
      }

      if (response.hashes.length === 0) {
        setError(EMPTY_SCHEMA_ERROR);
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
      setError(normalizeConnectionOpenError(error));
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const selectSchema = async (schemaHash: string) => {
    if (isSubmittingRef.current === true) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      await openResolvedConnection(schemaHash);
    } catch (error) {
      setError(normalizeConnectionOpenError(error));
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const goBackToForm = () => {
    setError(null);
    setStep("form");
  };

  return {
    error,
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
