import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { apiAnalytics } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid } from 'recharts';
import {
  Users,
  Calendar,
  FileText,
  FolderGit2,
  BookOpen,
  Briefcase,
  Handshake,
  TrendingUp,
} from 'lucide-react';

export const Route = createFileRoute('/admin/analytics')({
  component: AdminAnalytics,
});

const memberChartConfig = {
  members: {
    label: 'Members',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

const activityChartConfig = {
  events: {
    label: 'Events',
    color: 'hsl(var(--primary))',
  },
  posts: {
    label: 'Blog Posts',
    color: 'hsl(142, 76%, 36%)',
  },
  projects: {
    label: 'Projects',
    color: 'hsl(262, 83%, 58%)',
  },
} satisfies ChartConfig;

function AdminAnalytics() {
  const { accessToken } = useAuthStore();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => apiAnalytics(),
    enabled: !!accessToken,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-headline-lg">Analytics</h1>
          <p className="text-muted-foreground">Platform analytics and insights</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const memberData = [
    { label: 'Total', value: analytics?.totalMembers || 0 },
    { label: 'Active', value: analytics?.activeMembers || 0 },
    { label: 'Approved', value: analytics?.approvedMembers || 0 },
  ];

  const roleData =
    analytics?.roleDistribution?.map((r: { role: string; _count: number }) => ({
      role: r.role.replace('_', ' '),
      count: r._count,
    })) || [];

  const activityData = [
    { label: 'Events', value: analytics?.totalEvents || 0 },
    { label: 'Blog Posts', value: analytics?.totalBlogPosts || 0 },
    { label: 'Projects', value: analytics?.totalProjects || 0 },
    { label: 'Tracks', value: analytics?.totalTracks || 0 },
    { label: 'Opportunities', value: analytics?.totalOpportunities || 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg">Analytics</h1>
        <p className="text-muted-foreground">Platform analytics and insights</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalMembers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics?.activeMembers || 0} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Events
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalEvents || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics?.upcomingEvents || 0} upcoming
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projects
            </CardTitle>
            <FolderGit2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalProjects || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics?.approvedProjects || 0} approved
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Blog Posts
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalBlogPosts || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics?.publishedBlogPosts || 0} published
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Learning Tracks
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalTracks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics?.totalModules || 0} modules
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Opportunities
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalOpportunities || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics?.openOpportunities || 0} open
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Partners
            </CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalPartners || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active partners</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Member Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Member Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={memberChartConfig} className="h-[300px] w-full">
              <BarChart data={memberData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="members" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={memberChartConfig} className="h-[300px] w-full">
              <BarChart data={roleData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="role" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Activity Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Content Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={activityChartConfig} className="h-[300px] w-full">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recent Members */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.recentMembers && analytics.recentMembers.length > 0 ? (
              <div className="space-y-3">
                {analytics.recentMembers.map(
                  (member: {
                    id: string;
                    email: string;
                    createdAt: Date;
                    profile: { fullName: string; avatarUrl: string | null } | null;
                  }) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                          {member.profile?.fullName
                            ? member.profile.fullName
                                .split(' ')
                                .map((n: string) => n[0])
                                .join('')
                            : '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {member.profile?.fullName || 'New Member'}
                          </p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent registrations
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


