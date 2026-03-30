import React, { useState, useEffect } from 'react';
import apiClient, { formatApiError } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Link } from 'react-router-dom';
import { Plus, Play, Pause, Trash, Eye } from '@phosphor-icons/react';
import { toast } from 'sonner';

const StrategiesPage = () => {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      const { data } = await apiClient.get('/strategies');
      setStrategies(data);
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const deleteStrategy = async (id) => {
    if (!window.confirm('Are you sure you want to delete this strategy?')) return;

    try {
      await apiClient.delete(`/strategies/${id}`);
      toast.success('Strategy deleted');
      fetchStrategies();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-success text-white',
      draft: 'bg-muted text-foreground',
      paused: 'bg-warning text-foreground',
      stopped: 'bg-destructive text-white',
    };
    return colors[status] || 'bg-muted text-foreground';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Loading strategies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="strategies-page">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-border pb-4">
        <div>
          <h1 className="text-4xl font-heading font-bold tracking-tighter">Strategies</h1>
          <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider mt-1">
            Manage your trading strategies
          </p>
        </div>
        <Link to="/strategy-builder">
          <Button className="rounded-none font-mono text-xs uppercase tracking-wider" data-testid="new-strategy-button">
            <Plus className="h-4 w-4 mr-2" />
            New Strategy
          </Button>
        </Link>
      </div>

      {/* Strategies Grid */}
      {strategies.length === 0 ? (
        <Card className="border-2 border-border rounded-none shadow-none">
          <CardContent className="p-12 text-center">
            <p className="text-sm font-mono text-muted-foreground mb-4">No strategies yet</p>
            <Link to="/strategy-builder">
              <Button className="rounded-none font-mono text-xs uppercase tracking-wider">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Strategy
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {strategies.map((strategy) => (
            <Card key={strategy.id} className="border-2 border-border rounded-none shadow-none hover:border-primary transition-base" data-testid={`strategy-card-${strategy.id}`}>
              <CardHeader className="border-b border-border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-heading tracking-tight mb-2">
                      {strategy.name}
                    </CardTitle>
                    <Badge className={`${getStatusColor(strategy.status)} rounded-none text-xs font-mono uppercase tracking-wider`}>
                      {strategy.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Description</p>
                    <p className="text-sm font-mono mt-1">{strategy.description || 'No description'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <p className="text-muted-foreground uppercase tracking-wider">Version</p>
                      <p className="font-semibold">v{strategy.version}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground uppercase tracking-wider">Created</p>
                      <p className="font-semibold">{new Date(strategy.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 rounded-none border-2 font-mono text-xs uppercase tracking-wider"
                      data-testid={`view-strategy-${strategy.id}`}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-none border-2 font-mono text-xs"
                      onClick={() => deleteStrategy(strategy.id)}
                      data-testid={`delete-strategy-${strategy.id}`}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StrategiesPage;