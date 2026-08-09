import { Box, Button, TextLink } from "@inspector/ds";
import { Link, useNavigate } from "@tanstack/react-router";

import { useInspectorSessionContext } from "@app/providers/inspectorSessionProvider";
import { appRoutes } from "@app/routing/appRoutes";

import { AddConnectionForm } from "./addConnectionForm";
import { getPrefillKey } from "./connectionFormTypes";
import { SchemaSwitcher } from "./schemaSwitcher";
import { useAddConnectionFlow } from "./useAddConnectionFlow";

export function AddConnectionView(): React.ReactElement {
  const { prefill } = useInspectorSessionContext();
  const navigate = useNavigate();
  const prefillKey = getPrefillKey(prefill);

  const closeView = () => {
    void navigate({ to: appRoutes.connections });
  };

  return <AddConnectionViewContent key={prefillKey} onClose={closeView} />;
}

interface AddConnectionViewContentProps {
  onClose: () => void;
}

function AddConnectionViewContent({ onClose }: AddConnectionViewContentProps): React.ReactElement {
  const flow = useAddConnectionFlow();
  const isFormStep = flow.step === "form";

  return (
    <Box width="full" maxWidth="popup-width-l" flexDirection="column" gap="xl">
      <Box justifyContent="end">
        {isFormStep === true ? (
          <TextLink variant="caption" render={<Link to={appRoutes.connections} />}>
            Back
          </TextLink>
        ) : (
          <Button
            type="button"
            variant="link"
            size="s"
            onClick={flow.goBackToForm}
            disabled={flow.isSubmitting === true}
          >
            Back
          </Button>
        )}
      </Box>
      {isFormStep === true ? (
        // TODO: update error message UI and copywriting
        <AddConnectionForm
          error={flow.error}
          formValues={flow.formValues}
          isSubmitting={flow.isSubmitting}
          onCancel={onClose}
          onSubmit={flow.fetchSchemas}
          onUpdateField={flow.updateField}
        />
      ) : (
        <SchemaSwitcher
          appId={flow.formValues.appId}
          error={flow.error}
          isSubmitting={flow.isSubmitting}
          onCancel={onClose}
          onSelectSchema={flow.selectSchema}
          schemaHashes={flow.schemaHashes}
        />
      )}
    </Box>
  );
}
