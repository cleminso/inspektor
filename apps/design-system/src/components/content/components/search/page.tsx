import { type ReactElement } from "react";

import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/propsTable";
import { Section } from "@/components/docs/section";
import { getGeneratedProps } from "@/lib/propsData";
import { searchItem } from "@/lib/registry";

import BasicExample from "./basicExample";
import basicSource from "./basicExample.tsx?raw";
import { SearchPlayground } from "./playground";
import { searchPropNames } from "./props";
import SizesExample from "./sizesExample";
import sizesSource from "./sizesExample.tsx?raw";

const searchProps = getGeneratedProps(searchItem.componentId, searchPropNames);

export function SearchPage(): ReactElement {
  return (
    <SearchPlayground>
      <Section
        title="Free-form filtering"
        description="Search wraps Input for query text that filters content elsewhere. Use Autocomplete for optional suggestions and Combobox for restricted selection."
      >
        <Example source={basicSource}>
          <BasicExample />
        </Example>
      </Section>

      <Section title="Sizes" description="Search follows the Input control scale.">
        <Example source={sizesSource}>
          <SizesExample />
        </Example>
      </Section>

      <Section title="Props" description="Provide a visible label or an accessible aria-label.">
        <PropsTable rows={searchProps} />
      </Section>
    </SearchPlayground>
  );
}
