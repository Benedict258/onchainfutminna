"use client";

import { useEffect } from "react";

interface GlobalLoaderProps {
  show?: boolean;
  /** full-screen overlay (default). When false, renders only the spinner inline. */
  inline?: boolean;
}

let stylesInjected = false;

// Primary brand colour (matches the "Apply Now" button)
const PRIMARY = "#7c3aed";

export function GlobalLoader({ show = true, inline = false }: GlobalLoaderProps) {
  useEffect(() => {
    if (stylesInjected) return;
    stylesInjected = true;
    const style = document.createElement("style");
    style.textContent = `
      :root {
        --loader-border: ${PRIMARY};
        --loader-bg: ${PRIMARY}33;   /* 20% opacity */
        --loader-wrapper-bg: rgba(255,255,255,0.6);
      }
      .dark {
        --loader-border: ${PRIMARY};
        --loader-bg: ${PRIMARY}33;
        --loader-wrapper-bg: rgba(15,15,15,0.6);
      }
      .global-loader-wrapper {
        position: fixed;
        inset: 0;
        background: var(--loader-wrapper-bg);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }
      .spinner {
        width: 44px;
        height: 44px;
        animation: spinner-y0fdc1 2s infinite ease;
        transform-style: preserve-3d;
      }
      .spinner > div {
        background-color: var(--loader-bg);
        height: 100%;
        position: absolute;
        width: 100%;
        border: 2px solid var(--loader-border);
      }
      .spinner div:nth-of-type(1) { transform: translateZ(-22px) rotateY(180deg); }
      .spinner div:nth-of-type(2) { transform: rotateY(-270deg) translateX(50%); transform-origin: top right; }
      .spinner div:nth-of-type(3) { transform: rotateY(270deg) translateX(-50%); transform-origin: center left; }
      .spinner div:nth-of-type(4) { transform: rotateX(90deg) translateY(-50%); transform-origin: top center; }
      .spinner div:nth-of-type(5) { transform: rotateX(-90deg) translateY(50%); transform-origin: bottom center; }
      .spinner div:nth-of-type(6) { transform: translateZ(22px); }
      @keyframes spinner-y0fdc1 {
        0% { transform: rotate(45deg) rotateX(-25deg) rotateY(25deg); }
        50% { transform: rotate(45deg) rotateX(-385deg) rotateY(25deg); }
        100% { transform: rotate(45deg) rotateX(-385deg) rotateY(385deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      // keep styles for other loaders
    };
  }, []);

  if (!show) return null;

  const spinner = (
    <div className="spinner" aria-busy="true" aria-label="Loading">
      <div /><div /><div /><div /><div /><div />
    </div>
  );

  if (inline) return spinner;

  return (
    <div className="global-loader-wrapper">
      {spinner}
    </div>
  );
}