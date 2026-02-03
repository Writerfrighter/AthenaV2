'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Construction, Hammer, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UnderDevelopmentProps {
  title?: string;
  description?: string;
  featureName?: string;
}

export function UnderDevelopment({ 
  title = "Under Development",
  description = "This feature is currently being built and will be available soon.",
  featureName
}: UnderDevelopmentProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          {featureName && (
            <h1 className="text-3xl font-bold tracking-tight">{featureName}</h1>
          )}
          <Badge variant="outline" className="text-amber-600 border-amber-600 dark:text-amber-500 dark:border-amber-500">
            <Construction className="h-3 w-3 mr-1" />
            Under Development
          </Badge>
        </div>
        {!featureName && (
          <h1 className="text-3xl font-bold tracking-tight mt-2">{title}</h1>
        )}
      </div>

      {/* Main Card */}
      <Card className="border-amber-200 dark:border-amber-900/50">
        <CardContent className="py-16">
          <div className="text-center space-y-6 max-w-2xl mx-auto">
            {/* Icon */}
            <div className="relative inline-block">
              <Construction className="h-24 w-24 text-amber-500 dark:text-amber-600" />
              <Hammer className="h-10 w-10 text-amber-600 dark:text-amber-500 absolute -bottom-1 -right-1 animate-pulse" />
            </div>

            {/* Text Content */}
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">
                We're Building Something Great!
              </h2>
              <p className="text-muted-foreground text-lg">
                {description}
              </p>
            </div>

            {/* Status Banner */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4 mt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-left space-y-1">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                    Development in Progress
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Our team is actively working on this feature. Check back soon for updates!
                  </p>
                </div>
              </div>
            </div>

            {/* Features Coming Soon (Optional) */}
            <div className="pt-6 border-t border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                What to Expect
              </h3>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="secondary">Enhanced UI</Badge>
                <Badge variant="secondary">Advanced Features</Badge>
                <Badge variant="secondary">Improved Performance</Badge>
                <Badge variant="secondary">Better User Experience</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
