"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TeamImageProps {
  teamNumber: string;
  yearLabel?: string;
}

export function TeamImage({ teamNumber, yearLabel }: TeamImageProps) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    async function fetchTeamImages() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch team images from API (this would need to be created or use existing TBA integration)
        const response = await fetch(`/api/tba/team/${teamNumber}/media`);
        if (response.ok) {
          const imageUrls = await response.json();
          setImages(imageUrls);
          setCurrentImageIndex(0);
        } else {
          setImages([]);
        }
      } catch (err) {
        console.error('Error fetching team images:', err);
        setError('Failed to load images');
        setImages([]);
      } finally {
        setLoading(false);
      }
    }

    if (teamNumber) {
      fetchTeamImages();
    }
  }, [teamNumber]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-video w-full bg-muted/30 group rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ImageIcon className="h-16 w-16 mb-4 opacity-50 animate-pulse" />
              <p className="text-sm font-medium">Loading images...</p>
              <p className="text-xs">Team {teamNumber}</p>
            </div>
          ) : images.length > 0 ? (
            <>
              <div className="relative h-full w-full group/image">
                <Image
                  src={images[currentImageIndex]}
                  alt={`Team ${teamNumber}'s robot image ${currentImageIndex + 1}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover/image:scale-105"
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw,
                        (max-width: 1024px) 50vw,
                        33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300" />
                
                {yearLabel && (
                  <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                    {yearLabel}
                  </div>
                )}
                
                {images.length > 1 && (
                  <>
                    {/* Navigation buttons */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-black/70 h-8 w-8"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-black/70 h-8 w-8"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    
                    {/* Image counter */}
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                    
                    {/* Image indicators */}
                    <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                          onClick={() => setCurrentImageIndex(index)}
                          aria-label={`View image ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="relative h-full w-full">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-background/80">
                <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-sm font-medium">No robot image available</p>
                <p className="text-xs">Team {teamNumber}</p>
                {yearLabel && <p className="text-xs mt-1">{yearLabel}</p>}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default TeamImage;
