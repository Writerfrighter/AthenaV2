"use client";

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { ImageIcon } from 'lucide-react';

interface TeamImageProps {
  teamNumber: string;
  yearLabel?: string;
}

export function TeamImage({ teamNumber, yearLabel }: TeamImageProps) {
  return (
    <Card>
        <CardContent className="p-0">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted/30">
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-sm font-medium">No robot image available</p>
                    <p className="text-xs">Team {teamNumber}</p>
                </div>
            </div>
        </CardContent>
    </Card>
  );
}

export default TeamImage;
