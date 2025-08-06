'use client'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay"

export default function TeamCarousel({ images }: { images: string[] }) {
  return (
    <Carousel
      opts={{
        loop: true
      }}
      plugins={[
        Autoplay({
          delay: 7000,
        }),
      ]}
    >
      <CarouselContent>
        {images.map((url) => (
          <CarouselItem key={url}>
            <div
              style={{
                position: 'relative',
                height: '150px',
                width: 'auto',
                maxWidth: '100%',    // optional: don't overflow parent
              }}
            >
              <Image
                src={url}
                alt="Robot Image"
                fill 
                className="object-contain rounded-md"
                loading="lazy"
                sizes="(max-width: 640px) 100vw,
                      (max-width: 1024px) 50vw,
                      (max-width: 1280px) 33vw,
                      25vw"
              />
            </div>
          </CarouselItem>
          
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10" />
      <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10" />
    </Carousel>
  );
}
