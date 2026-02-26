import logoSrc from "@/assets/mocmate-logo.png";

interface MocMateLogoProps {
    height?: number;
    className?: string;
}

const MocMateLogo = ({ height = 36, className = "" }: MocMateLogoProps) => (
    <img
        src={logoSrc}
        alt="MocMate AI"
        draggable={false}
        className={`shrink-0 ${className}`}
        style={{ height, width: "auto", display: "block" }}
    />
);

export default MocMateLogo;
