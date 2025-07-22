import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { RefreshCw } from 'lucide-react';
import { useServiceWorker } from '@/hooks/usePWA';

export function UpdatePrompt() {
  const { updateAvailable, updateApp } = useServiceWorker();

  if (!updateAvailable) {
    return null;
  }

  return (
    <Card className="fixed top-4 left-4 right-4 z-50 border-blue-500/20 bg-card/95 backdrop-blur-sm md:left-auto md:right-4 md:w-80">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 rounded-full bg-blue-500/10 p-2">
            <RefreshCw className="h-4 w-4 text-blue-500" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Update Available</h3>
            <p className="text-xs text-muted-foreground mt-1">
              A new version of SmallEarns is ready to install.
            </p>
            
            <Button 
              size="sm" 
              onClick={updateApp}
              className="mt-3 bg-blue-500 hover:bg-blue-600 text-white"
            >
              Update Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}