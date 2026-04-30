import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Box, Clock, Activity } from 'lucide-react';
import api from '@/lib/api';

const Dashboard = () => {
  const { data: filaments } = useQuery({
    queryKey: ['filaments'],
    queryFn: () => api.get('/api/filaments').then(res => res.data)
  });

  const { data: pendingJobs } = useQuery({
    queryKey: ['pending-jobs'],
    queryFn: () => api.get('/api/printjobs', { params: { status: 'pending' } }).then(res => res.data)
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Stock</CardTitle>
            <Box className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filaments?.length || 0} Items</div>
            <p className="text-xs text-muted-foreground">In inventory</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingJobs?.length || 0} Jobs</div>
            <p className="text-xs text-muted-foreground">Waiting for confirmation</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Printer Status</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Connected</div>
            <p className="text-xs text-muted-foreground">Bambu Lab P2S</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      </div>
    </div>
  );
};

export default Dashboard;
