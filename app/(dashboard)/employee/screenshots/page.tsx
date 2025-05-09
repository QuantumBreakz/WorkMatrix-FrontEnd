"use client"

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Screenshot {
  id: string;
  filename: string;
  timestamp: string;
  size: number;
  url: string;
}

export default function ScreenshotsPage() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchScreenshots();
  }, [date]);

  const fetchScreenshots = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('screenshots')
        .select('*')
        .eq('user_id', user.id)
        .gte('timestamp', `${date}T00:00:00`)
        .lte('timestamp', `${date}T23:59:59`)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Get signed URLs for each screenshot
      const screenshotsWithUrls = await Promise.all(
        (data || []).map(async (screenshot) => {
          const { data: { signedUrl } } = await supabase
            .storage
            .from('screenshots')
            .createSignedUrl(screenshot.filename, 3600);

          return {
            ...screenshot,
            url: signedUrl
          };
        })
      );

      setScreenshots(screenshotsWithUrls);
    } catch (error) {
      console.error('Error fetching screenshots:', error);
      toast.error('Failed to load screenshots');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>My Screenshots</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {screenshots.map((screenshot) => (
              <Card key={screenshot.id}>
                <CardContent className="p-4">
                  <img
                    src={screenshot.url}
                    alt={`Screenshot from ${new Date(screenshot.timestamp).toLocaleString()}`}
                    className="w-full h-48 object-cover rounded-lg mb-2"
                  />
                  <div className="text-sm text-gray-500">
                    {new Date(screenshot.timestamp).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatFileSize(screenshot.size)}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => window.open(screenshot.url, '_blank')}
                  >
                    View Full Size
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {screenshots.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No screenshots found for this date
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 