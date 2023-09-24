import styled from '@emotion/styled';

const Div = styled.div`
  width: 100%;
  max-width: 40rem;
  margin-bottom: 1rem;
`;

type WrapperProps = {
  className?: string;
  children: JSX.Element | JSX.Element[] | string;
};
export default function Wrapper({ className, children }: WrapperProps): JSX.Element {
  return <Div className={className}>{children}</Div>;
}
