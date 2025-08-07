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
import { useState } from "react";

export default function TeamCarousel({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div className="relative group">
      <Carousel
        opts={{
          loop: true
        }}
        plugins={[
          Autoplay({
            delay: 8000,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent>
          {images.map((url, index) => (
            <CarouselItem key={url}>
              <div className="relative h-48 w-full overflow-hidden rounded-lg group/image">
                <Image
                  src={url}
                  alt={`Robot Image ${index + 1}`}
                  fill 
                  className="object-cover transition-transform duration-500 group-hover/image:scale-105"
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw,
                        (max-width: 1024px) 50vw,
                        (max-width: 1280px) 33vw,
                        25vw"
                />
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300" />
                
                {/* Image counter */}
                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {index + 1} / {images.length}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Enhanced navigation buttons */}
        <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-black/70" />
        <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-black/70" />
        
        {/* Image indicators */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {images.map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full bg-white/50 backdrop-blur-sm transition-all duration-300 hover:bg-white/80"
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
}
