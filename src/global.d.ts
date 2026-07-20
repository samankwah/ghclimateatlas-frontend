declare const __APP_VERSION__: string;
declare const __APP_RELEASE_DATE__: string;

type AtlasMathMLProps = React.HTMLAttributes<HTMLElement> & {
  accent?: boolean | string;
  display?: "block" | "inline";
  mathvariant?: string;
  width?: string;
};

declare namespace React.JSX {
  interface IntrinsicElements {
    math: AtlasMathMLProps;
    mfrac: AtlasMathMLProps;
    mi: AtlasMathMLProps;
    mn: AtlasMathMLProps;
    mo: AtlasMathMLProps;
    mover: AtlasMathMLProps;
    mrow: AtlasMathMLProps;
    mspace: AtlasMathMLProps;
    msub: AtlasMathMLProps;
    msubsup: AtlasMathMLProps;
    mtext: AtlasMathMLProps;
    munder: AtlasMathMLProps;
    munderover: AtlasMathMLProps;
  }
}
