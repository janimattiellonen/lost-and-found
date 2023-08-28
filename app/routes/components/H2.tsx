import styled from '@emotion/styled';
import { className } from 'postcss-selector-parser';

const Heading2 = styled.h2`
  font-weight: bold;

  font-size: 1.25rem;

  @media (min-width: 600px) {
    font-size: 1.75rem;
  }
`;

type H2Props = {
  children: JSX.Element | string;
  className?: string;
};

export default function H2({ children, className }: H2Props): JSX.Element {
  return <Heading2 className={className}>{children}</Heading2>;
}
