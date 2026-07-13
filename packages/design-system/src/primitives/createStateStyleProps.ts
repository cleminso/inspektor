import * as stylex from "@stylexjs/stylex";

type StyleXProp = stylex.StyleXStyles | false | null | undefined;

export function createStateStyleProps<State>(
  selectStyles: (state: State) => readonly StyleXProp[],
) {
  const resolve = (state: State) => stylex.props(...selectStyles(state));

  return {
    className: (state: State) => resolve(state).className,
    style: (state: State) => resolve(state).style,
  };
}
