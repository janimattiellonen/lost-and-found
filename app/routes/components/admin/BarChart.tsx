import { useState } from 'react';

import styled from '@emotion/styled';

import H3 from '../H3';

const Outer = styled.div`
  display: flex;
  flex-direction: column;
`;

const Wrapper = styled.div`
  width: 100%;
  height: 200px;
  display: flex;
  align-items: self-end;
  gap: 1rem;
`;

const Legend = styled.div`
  display: flex;
  gap: 1rem;
  width: 100%;
  max-width: 1200px;

  & > div {
    width: 75px;
    text-align: center;
  }
`;

type BarProps = {
  height: number;
  colour: string;
};

const VerticalBar = styled.div<BarProps>`
  position: relative;
  width: 75px;
  background: pink;
  ${(props) => {
    return {
      background: `${props.colour}`,
      height: `${props.height}%`,
    };
  }}

  &:hover {
    background: blue;
  }
`;

const BarValue = styled.div`
  top: -25px;
  color: black;
  position: absolute;
  margin: 0 auto;
  width: 100%;

  & > div {
    text-align: center;
  }
`;

export type BarValueType = {
  label: string;
  value: number;
  date?: Date;
};

type BarChartProps = {
  className?: string;
  data: BarValueType[];
  legendItems: string[];
  onBarClick?: (e: any) => void;
  title: string;
};

export default function BarChart({ className, data, legendItems, onBarClick, title }: BarChartProps): JSX.Element {
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  let highest = 0;

  data.map((item: BarValueType) => {
    if (item.value > highest) {
      highest = item.value;
    }
  });

  return (
    <Outer className={className}>
      <H3>{title}</H3>
      <Wrapper>
        {data.map((item: BarValueType, index: number) => {
          const height = Math.round((item.value / (highest + 30)) * 100);
          return (
            <VerticalBar
              key={index}
              height={height}
              colour={index === selectedBar ? 'blue' : 'red'}
              onClick={(e) => {
                if (onBarClick) {
                  setSelectedBar(index);
                  onBarClick(item.date);
                }
              }}
            >
              <BarValue>
                <div>{item.value}</div>
              </BarValue>
            </VerticalBar>
          );
        })}
      </Wrapper>
      <Legend>
        {legendItems.map((item) => {
          return <div>{item}</div>;
        })}
      </Legend>
    </Outer>
  );
}
