import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export default function BrandLogo({
  className = "",
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      src="/eyecap-logo.png"
      alt="EYECAP Premium Eyewear"
      width={1024}
      height={1024}
      className={className}
      priority={priority}
    />
  );
}
