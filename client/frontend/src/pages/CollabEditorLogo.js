import React from "react";

const CollabEditorLogo = ({ style = {}, className = "" }) => (
  <svg
    viewBox="0 0 420 120"
    width="100%"
    height="100%"
    style={style}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* COLLAB - Outlined, multi-line */}
    <g fontFamily="Montserrat, Arial, sans-serif" fontWeight="900" fontSize="56" fill="none" stroke="#fff" strokeWidth="3">
      <text x="10" y="65" letterSpacing="6">C</text>
      <text x="50" y="65" letterSpacing="6">O</text>
      <text x="95" y="65" letterSpacing="6">L</text>
      <text x="130" y="65" letterSpacing="6">L</text>
      <text x="165" y="65" letterSpacing="6">A</text>
      <text x="210" y="65" letterSpacing="6">B</text>
    </g>
    {/* COLLAB - Second outline for multi-line effect */}
    <g fontFamily="Montserrat, Arial, sans-serif" fontWeight="900" fontSize="56" fill="none" stroke="#fff" strokeWidth="1">
      <text x="10" y="65" letterSpacing="6">C</text>
      <text x="50" y="65" letterSpacing="6">O</text>
      <text x="95" y="65" letterSpacing="6">L</text>
      <text x="130" y="65" letterSpacing="6">L</text>
      <text x="165" y="65" letterSpacing="6">A</text>
      <text x="210" y="65" letterSpacing="6">B</text>
    </g>
    {/* EDITOR - Solid, bold */}
    <text x="10" y="110" fontFamily="Montserrat, Arial, sans-serif" fontWeight="900" fontSize="40" fill="#fff" letterSpacing="5">EDITOR</text>
  </svg>
);

export default CollabEditorLogo; 