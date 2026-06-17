import type { ReactNode, SVGProps, JSX } from 'react';

// Inline Material icons (24x24, currentColor) replacing @mui/icons-material.
// Accept all SVG props (className/style/onClick). Pass `title` for an accessible
// label (renders <title> + role="img"); otherwise the icon is aria-hidden.
type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function SvgIcon({ title, children, ...props }: IconProps & { children: ReactNode }): JSX.Element {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function WarningIcon(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
    </SvgIcon>
  );
}

export function TextsmsIcon(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z" />
    </SvgIcon>
  );
}

export function ArrowUpwardIcon(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <path d="m4 12 1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" />
    </SvgIcon>
  );
}

export function ArrowDownwardIcon(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <path d="m20 12-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z" />
    </SvgIcon>
  );
}
