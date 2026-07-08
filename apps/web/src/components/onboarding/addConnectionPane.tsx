import { useNavigate } from "@tanstack/react-router";

import { SidePanel } from "@regarde/ui/sheet";

import { useInspector } from "@/components/providers/inspectorProvider";
import { appRoutes } from "@/lib/navigation/appRoutes";

import { AddConnectionForm } from "./addConnectionForm";
import { getPrefillKey } from "./connectionFormTypes";
import { SchemaSwitcher } from "./schemaSwitcher";
import { useAddConnectionFlow } from "./useAddConnectionFlow";

export function AddConnectionPane(): React.ReactElement {
  const { prefill } = useInspector();
  const navigate = useNavigate();
  const prefillKey = getPrefillKey(prefill);

  const closePane = () => {
    void navigate({ to: appRoutes.connections });
  };

  return <AddConnectionPaneContent key={prefillKey} onClose={closePane} />;
}

interface AddConnectionPaneContentProps {
  onClose: () => void;
}

function AddConnectionPaneContent({ onClose }: AddConnectionPaneContentProps): React.ReactElement {
  const flow = useAddConnectionFlow();

  return (
    <SidePanel
      title="Add connection"
      description="Connect to a Jazz app and select a stored schema."
      onClose={onClose}
    >
      {flow.step === "form" ? (
        <AddConnectionForm
          errorMessage={flow.errorMessage}
          formValues={flow.formValues}
          isSubmitting={flow.isSubmitting}
          onCancel={onClose}
          onSubmit={flow.fetchSchemas}
          onUpdateField={flow.updateField}
        />
      ) : (
        <SchemaSwitcher
          appId={flow.formValues.appId}
          errorMessage={flow.errorMessage}
          isSubmitting={flow.isSubmitting}
          onBack={flow.goBackToForm}
          onCancel={onClose}
          onSelectSchema={flow.selectSchema}
          schemaHashes={flow.schemaHashes}
        />
      )}
    </SidePanel>
  );
}
