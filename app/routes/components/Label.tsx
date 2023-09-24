import styled from '@emotion/styled';
import InputLabel from '@mui/material/InputLabel';
import type { InputLabelProps } from '@mui/material/InputLabel';

const StyledLabel = styled(InputLabel)`
  font-weight: 700;
  --tw-text-opacity: 1;
  color: rgb(55 65 81 / var(--tw-text-opacity));
`;

interface FooProps extends InputLabelProps<'label'> {
  children: JSX.Element | string;
}

export default function Label({ children, ...rest }: FooProps): JSX.Element {
  return <StyledLabel {...rest}>{children}</StyledLabel>;
}
