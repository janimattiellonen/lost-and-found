import styled from '@emotion/styled';
import { className } from 'postcss-selector-parser';

const Heading2 = styled.h2`
  font-weight: bold;

  font-size: 1rem;

  @media (min-width: 600px) {
    font-size: 1.5rem;
  }
`;

type H3Props = {
  children: JSX.Element | string;
  className?: string;
};

export default function H3({ children, className }: H3Props): JSX.Element {
  return <Heading2 className={className}>{children}</Heading2>;
}
