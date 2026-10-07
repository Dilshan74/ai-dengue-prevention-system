/**
 * DengueGuard AI Brand Logo
 * Combines a medical blood droplet silhouette with an integrated Aedes mosquito vector mark.
 */
export default function BrandLogo({ className = "h-6 w-6", variant = "default" }) {
  if (variant === "mosquito") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Mosquito Logo"
      >
        {/* Piercing proboscis */}
        <path d="M12 17L12 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        {/* Antennae */}
        <path d="M10.8 14.2L9 12.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M13.2 14.2L15 12.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        {/* Compound Eyes / Head */}
        <circle cx="12" cy="15.2" r="1.4" fill="currentColor" />
        {/* Thorax */}
        <ellipse cx="12" cy="12.5" rx="1.8" ry="1.4" fill="currentColor" />
        {/* Tapered Banded Abdomen */}
        <path
          d="M12 11.2C10.6 8.5 10.6 5.5 12 3C13.4 5.5 13.4 8.5 12 11.2Z"
          fill="currentColor"
        />
        {/* Wings */}
        <path
          d="M11 12.5C8 9.5 5 10 4.5 11.5C4 13 8 14.2 11 13"
          fill="currentColor"
          fillOpacity="0.35"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <path
          d="M13 12.5C16 9.5 19 10 19.5 11.5C20 13 16 14.2 13 13"
          fill="currentColor"
          fillOpacity="0.35"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        {/* 6 Articulated Legs */}
        <path d="M10.5 13L7 12L5 15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.5 13L17 12L19 15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.5 12L6.5 10L4 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.5 12L17.5 10L20 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 13.5L8.5 16.5L6.5 20.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 13.5L15.5 16.5L17.5 20.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Default: Blood Droplet with embedded Aedes mosquito vector
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="DengueGuard Blood & Mosquito Logo"
    >
      {/* Outer Blood Droplet with soft inner fill */}
      <path
        d="M12 2.2C12 2.2 4.8 11.2 4.8 16C4.8 19.98 8.02 23.2 12 23.2C15.98 23.2 19.2 19.98 19.2 16C19.2 11.2 12 2.2 12 2.2Z"
        fill="currentColor"
        fillOpacity="0.22"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Central Mosquito Proboscis Needle */}
      <path d="M12 18V21.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Mosquito Head */}
      <circle cx="12" cy="16.6" r="1.2" fill="currentColor" />
      {/* Mosquito Thorax & Abdomen */}
      <path d="M12 11.2V15.4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Upper Wings */}
      <path
        d="M12 13.2C9.8 10.5 7.2 10.2 6.8 11.2C6.4 12.2 8.8 14 12 13.8"
        fill="currentColor"
        fillOpacity="0.45"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M12 13.2C14.2 10.5 16.8 10.2 17.2 11.2C17.6 12.2 15.2 14 12 13.8"
        fill="currentColor"
        fillOpacity="0.45"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Front Curved Legs */}
      <path d="M10 13.2L7.6 14.6L6.2 17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 13.2L16.4 14.6L17.8 17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Hind Long Legs */}
      <path d="M10.4 15.2L8 17.6L7 20" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.6 15.2L16 17.6L17 20" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
