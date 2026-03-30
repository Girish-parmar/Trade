import React, { useState, useEffect } from 'react';
import apiClient, { formatApiError } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Gear, Plus, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';

const SettingsPage = () => {
  const [brokers, setBrokers] = useState([]);
  const [showAddBroker, setShowAddBroker] = useState(false);
  const [brokerForm, setBrokerForm] = useState({
    broker_name: 'zerodha',
    api_key: '',
    api_secret: '',
  });

  useEffect(() => {
    fetchBrokers();
  }, []);

  const fetchBrokers = async () => {
    try {
      const { data } = await apiClient.get('/brokers');
      setBrokers(data);
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };

  const addBroker = async () => {
    try {
      await apiClient.post('/brokers', brokerForm);
      toast.success('Broker connected successfully!');
      setBrokerForm({ broker_name: 'zerodha', api_key: '', api_secret: '' });
      setShowAddBroker(false);
      fetchBrokers();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };

  const removeBroker = async (id) => {
    try {
      await apiClient.delete(`/brokers/${id}`);
      toast.success('Broker disconnected');
      fetchBrokers();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };

  return (
    <div className="space-y-6" data-testid="settings-page">
      {/* Header */}
      <div className="border-b-2 border-border pb-4">
        <h1 className="text-4xl font-heading font-bold tracking-tighter">Settings</h1>
        <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider mt-1">
          Manage your account and broker connections
        </p>
      </div>

      {/* Broker Connections */}
      <Card className="border-2 border-border rounded-none shadow-none">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-heading tracking-tight flex items-center">
              <Gear className="h-5 w-5 mr-2" />
              Broker Connections
            </CardTitle>
            <Button
              className="rounded-none font-mono text-xs uppercase tracking-wider"
              onClick={() => setShowAddBroker(!showAddBroker)}
              data-testid="add-broker-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Broker
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {showAddBroker && (
            <div className="mb-6 p-4 border-2 border-border bg-secondary/20 space-y-4">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider">Connect New Broker</h3>
              
              <div>
                <Label className="text-xs font-mono uppercase tracking-wider">Broker</Label>
                <Select
                  value={brokerForm.broker_name}
                  onValueChange={(value) => setBrokerForm({ ...brokerForm, broker_name: value })}
                >
                  <SelectTrigger className="rounded-none border-2 font-mono" data-testid="broker-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zerodha">Zerodha</SelectItem>
                    <SelectItem value="upstox">Upstox</SelectItem>
                    <SelectItem value="binance">Binance</SelectItem>
                    <SelectItem value="interactive_brokers">Interactive Brokers</SelectItem>
                    <SelectItem value="alpaca">Alpaca</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-mono uppercase tracking-wider">API Key</Label>
                <Input
                  value={brokerForm.api_key}
                  onChange={(e) => setBrokerForm({ ...brokerForm, api_key: e.target.value })}
                  className="rounded-none border-2 font-mono"
                  data-testid="broker-api-key-input"
                  placeholder="Enter your API key"
                />
              </div>

              <div>
                <Label className="text-xs font-mono uppercase tracking-wider">API Secret</Label>
                <Input
                  type="password"
                  value={brokerForm.api_secret}
                  onChange={(e) => setBrokerForm({ ...brokerForm, api_secret: e.target.value })}
                  className="rounded-none border-2 font-mono"
                  data-testid="broker-api-secret-input"
                  placeholder="Enter your API secret"
                />
              </div>

              <Button
                className="w-full rounded-none font-mono text-xs uppercase tracking-wider"
                onClick={addBroker}
                data-testid="connect-broker-button"
              >
                Connect Broker
              </Button>
            </div>
          )}

          {brokers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm font-mono text-muted-foreground">No brokers connected</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">Add a broker to start trading</p>
            </div>
          ) : (
            <div className="space-y-3">
              {brokers.map((broker) => (
                <div
                  key={broker.id}
                  className="flex items-center justify-between p-4 border-2 border-border"
                  data-testid={`broker-item-${broker.id}`}
                >
                  <div>
                    <p className="font-mono text-sm font-semibold">{broker.broker_name}</p>
                    <p className="text-xs font-mono text-muted-foreground">
                      Connected on {new Date(broker.connected_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-none border-2 hover:border-destructive hover:text-destructive"
                    onClick={() => removeBroker(broker.id)}
                    data-testid={`remove-broker-${broker.id}`}
                  >
                    <Trash className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;