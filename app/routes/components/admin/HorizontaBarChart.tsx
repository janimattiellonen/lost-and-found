import { BarValueType } from '~/routes/components/admin/BarChart';
import styled from '@emotion/styled';

type Stat = {
  label: string;
  value: number;
};

type HorizontalBarChartProps = {
  data: Stat[];
};

type BarProps = {
  width: number;
  colour: string;
};

const HorizontalBar = styled.div<BarProps>`
  position: relative;
  height: 25px;
  background: pink;
  ${(props) => {
    return {
      background: `${props.colour}`,
      width: `${props.width}%`,
    };
  }}

  margin-bottom: 0.5rem;
`;

const BarValue = styled.div`
  right: -25px;
  color: black;
  position: absolute;

  & > div {
    text-align: center;
  }
`;

const Wrapper = styled.div`
  display: flex;
  justify-content: flex-start;
`;

const Label = styled.div`
  width: 10rem;
  margin-right: 1rem;
`;
export default function HorizontalBarChart({ data }: HorizontalBarChartProps): JSX.Element {
  let highest: number = 0;

  data.map((item: Stat) => {
    if (item.value > highest) {
      highest = item.value;
    }
  });

  return (
    <div>
      {data.map((item: Stat, index: number) => {
        const width = Math.round((item.value / (highest + 30)) * 100);

        return (
          <Wrapper key={index}>
            <Label>{item.label}</Label>
            <HorizontalBar width={width} colour={'red'} key={index}>
              <BarValue>{item.value}</BarValue>
            </HorizontalBar>
          </Wrapper>
        );
      })}
    </div>
  );
}
