import { type ReactElement } from "react";

import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";

import BasicExample from "./basicExample";
import basicSource from "./basicExample.tsx?raw";
import CombinationExample from "./combinationExample";
import combinationSource from "./combinationExample.tsx?raw";
import PlatformExample from "./platformExample";
import platformSource from "./platformExample.tsx?raw";
import { KeyboardInputPlayground } from "./playground";
import { keyboardInputPropNames } from "./props";

const props = getGeneratedProps("keyboardInput", keyboardInputPropNames);

export function KeyboardInputPage(): ReactElement {
  return (
    <KeyboardInputPlayground>
      <Section
        title="Key"
        description="Use a keyboard input to show a single key required by an action."
      >
        <Example source={basicSource}>
          <BasicExample />
        </Example>
      </Section>

      <Section
        title="Combination"
        description="Declare modifiers as a set. The component presents them in the platform-standard order."
      >
        <Example source={combinationSource}>
          <CombinationExample />
        </Example>
      </Section>

      <Section
        title="Platform and density"
        description="Set the platform for the application keymap. The keycap uses the subdued semantic surface; use the small size in dense menus, command bars, and tables."
      >
        <Example source={platformSource}>
          <PlatformExample />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable rows={props} />
      </Section>
    </KeyboardInputPlayground>
  );
}
