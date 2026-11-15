import Image from "next/image";

type PhotoProps = {
  src: string;
  alt: string;
  objectPosition: string;
  sizes: string;
  priority?: boolean;
};

/** Event photos load immediately, matching the static page. */
export function Photo({
  src,
  alt,
  objectPosition,
  sizes,
  priority = false,
}: PhotoProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      unoptimized
      style={{ objectPosition }}
      {...(priority ? { priority: true } : { loading: "eager" as const })}
    />
  );
}
