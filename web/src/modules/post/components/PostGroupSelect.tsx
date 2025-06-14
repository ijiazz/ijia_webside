import React, { ReactNode } from "react";
import styled from "@emotion/styled";
export type RadioOption<V extends string | number = string | number> = {
  label?: ReactNode;
  value?: V;
};

export type RadioProps<V extends string | number = string | number, T extends RadioOption<V> = RadioOption<V>> = {
  options?: T[];
  onChange?: (value: T["value"]) => void;
  className?: string;
  style?: React.CSSProperties;
  value?: V;
};
export function PRadio<V extends string | number = string | number, T extends RadioOption<V> = RadioOption<V>>(
  props: RadioProps<V, T>,
) {
  const { options, value, onChange, className, style } = props;
  return (
    <StyledWrapper>
      {options?.map((item) => {
        return (
          <StyledRadio key={item.value}>
            <input
              type="radio"
              checked={item.value === value}
              onChange={(e) => {
                const checked = e.currentTarget.checked;
                if (checked) {
                  onChange?.(item.value);
                }
              }}
              onClick={
                item.value === value
                  ? (e) => {
                      onChange?.(undefined);
                    }
                  : undefined
              }
            />
            <span className="name">{item.label}</span>
          </StyledRadio>
        );
      })}
    </StyledWrapper>
  );
}
const StyledRadio = styled.label`
  flex: 1 1 auto;
  text-align: center;

  input {
    display: none;
  }

  .name {
    display: flex;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    border-radius: 0.5rem;
    border: none;
    padding: 0.2rem 0;
    color: rgba(51, 65, 85, 1);
    transition: all 0.15s ease-in-out;
  }

  input:checked + .name {
    background-color: #fff;
    font-weight: 600;
  }

  /* Hover effect */
  :hover .name {
    background-color: rgba(255, 255, 255, 0.5);
  }

  /* Animation */
  input:checked + .name {
    position: relative;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    animation: select 0.3s ease;
  }
  /* Particles */
  input:checked + .name::before,
  input:checked + .name::after {
    content: "";
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #3b82f6;
    opacity: 0;
    animation: particles 0.5s ease forwards;
  }

  input:checked + .name::before {
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
  }

  input:checked + .name::after {
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
  }

  @keyframes particles {
    0% {
      opacity: 0;
      transform: translateX(-50%) translateY(0);
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translateX(-50%) translateY(var(--direction));
    }
  }

  input:checked + .name::before {
    --direction: -10px;
  }

  input:checked + .name::after {
    --direction: 10px;
  }
`;
const StyledWrapper = styled.div`
  position: relative;
  display: flex;
  flex-wrap: wrap;
  border-radius: 0.5rem;
  background-color: #eee;
  box-sizing: border-box;
  box-shadow: 0 0 0px 1px rgba(0, 0, 0, 0.06);
  padding: 0.25rem;

  @keyframes select {
    0% {
      transform: scale(0.95);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }
`;
