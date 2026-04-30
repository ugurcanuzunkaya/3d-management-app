import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, Copy, Search, Loader2 } from 'lucide-react';
import api from '@/lib/api';

const ModelLibrary = () => {
  const [url, setUrl] = useState('');
  const queryClient = useQueryClient();

  const { data: models, isLoading } = useQuery({
    queryKey: ['models'],
    queryFn: () => api.get('/api/models').then(res => res.data)
  });

  const extractMutation = useMutation({
    mutationFn: (extractUrl: string) => api.post('/api/models/extract', null, { params: { url: extractUrl } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      setUrl('');
    }
  });

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    // Add toast notification later
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Model Library</h1>
          <p className="text-muted-foreground">Manage your 3D models and extract technical specs from web links.</p>
        </div>
        <div className="flex w-full md:w-auto gap-2">
          <Input 
            placeholder="Makerworld / Printables URL" 
            value={url}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
            className="md:w-64"
          />
          <Button 
            onClick={() => extractMutation.mutate(url)}
            disabled={!url || extractMutation.isPending}
          >
            {extractMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-1" />}
            Extract
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models?.map((model: any) => (
          <Card key={model.id}>
            <CardHeader>
              <CardTitle className="text-lg truncate">{model.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Estimated:</div>
                <div className="font-medium text-right">{model.estimated_weight_g}g</div>
                <div className="text-muted-foreground">Filament:</div>
                <div className="font-medium text-right">{model.tech_details?.filament_type || 'N/A'}</div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Local Path</label>
                <div className="flex gap-1">
                  <Input 
                    readOnly 
                    value={model.local_path || '/Users/ugurcan/Downloads/' + model.name} 
                    className="h-8 text-xs bg-muted"
                  />
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleCopyPath(model.local_path)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              {model.source_url && (
                <a 
                  href={model.source_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'w-full text-primary' })}
                >
                  <ExternalLink className="w-4 h-4 mr-1" /> View Source
                </a>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ModelLibrary;
