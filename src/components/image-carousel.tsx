import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import Image from "next/image";

export default function TeamCarousel({ images }: { images: string[] }) {
  if (!images.length) return <div>No images</div>;

  return (
    <Carousel>
      <CarouselContent>
        {images.map((url) => (
          <CarouselItem key={url}>
            <Image
              src={url}
              alt=""
              width={300}
              height={180}
              placeholder="blur"
              // blurDataURL="/placeholder.png"
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
