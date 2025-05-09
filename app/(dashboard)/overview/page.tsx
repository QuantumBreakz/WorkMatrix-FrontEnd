'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface DashboardStats {
  total_hours: number;
  idle_hours: number;
  break_hours: number;
  productive_hours: number;
  screenshot_count: number;
  storage_used: number;
  api_calls: number;
}

export default function OverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get today's date
      const today = new Date().toISOString().split('T')[0];

      // Fetch daily hours
      const { data: hoursData, error: hoursError } = await supabase
        .from('daily_hours')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (hoursError) throw hoursError;

      // Fetch screenshot count
      const { count: screenshotCount, error: screenshotError } = await supabase
        .from('screenshots')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`);

      if (screenshotError) throw screenshotError;

      // Calculate storage used
      const { data: storageData, error: storageError } = await supabase
        .from('screenshots')
        .select('size')
        .eq('user_id', user.id);

      if (storageError) throw storageError;

      const storageUsed = storageData?.reduce((acc, curr) => acc + (curr.size || 0), 0) || 0;

      // Get API calls from local storage
      const apiCalls = parseInt(localStorage.getItem('api_calls') || '0');

      setStats({
        total_hours: hoursData?.total_hours || 0,
        idle_hours: hoursData?.idle_hours || 0,
        break_hours: hoursData?.break_hours || 0,
        productive_hours: hoursData?.productive_hours || 0,
        screenshot_count: screenshotCount || 0,
        storage_used: storageUsed,
        api_calls: apiCalls
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!stats) {
    return <div>No data available</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Productive Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productive_hours.toFixed(1)}h</div>
            <Progress value={(stats.productive_hours / 8) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Idle Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.idle_hours.toFixed(1)}h</div>
            <Progress value={(stats.idle_hours / 8) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Break Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.break_hours.toFixed(1)}h</div>
            <Progress value={(stats.break_hours / 8) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Screenshots Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.screenshot_count}</div>
            <div className="text-sm text-gray-500 mt-2">
              Storage: {formatBytes(stats.storage_used)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>API Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.api_calls}</div>
          <Progress value={(stats.api_calls / 50000) * 100} className="mt-2" />
          <div className="text-sm text-gray-500 mt-2">
            {stats.api_calls > 40000 ? (
              <span className="text-red-500">Warning: Approaching API limit</span>
            ) : (
              <span>Monthly limit: 50,000 calls</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 