import React from "react";
import logoImage from "../img/progroup.jpg";

interface ProfessorLogoProps {
  className?: string;
  variant?: "full" | "logo-text" | "icon" | "academic-icon";
  light?: boolean;
}

export default function ProfessorLogo({
  className = "h-12",
}: ProfessorLogoProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img
        src={logoImage}
        alt="Pro Group Logo"
        className="w-full h-full object-contain select-none"
        draggable={false}
      />
    </div>
  );
}