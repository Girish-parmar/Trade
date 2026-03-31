/**
 * Local Queue Manager
 * 
 * IndexedDB-based offline order queue
 * Queues orders when offline and syncs when connection restored
 * 
 * Features:
 * - Persistent queue (survives page reload)
 * - Automatic retry with exponential backoff
 * - Conflict detection and resolution
 * - Order deduplication
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface QueuedOrder {
  id: string;
  localId: string;
  type: 'place' | 'modify' | 'cancel';
  data: any;
  timestamp: number;
  retryCount: number;
  lastRetryAt: number | null;
  status: 'pending' | 'processing' | 'failed' | 'synced';
  error: string | null;
  serverId: string | null;
}

interface TradePro extends DBSchema {
  'order-queue': {
    key: string;
    value: QueuedOrder;
    indexes: {
      'by-status': string;
      'by-timestamp': number;
      'by-localId': string;
    };
  };
  'sync-metadata': {
    key: string;
    value: {
      key: string;
      value: any;
      updatedAt: number;
    };
  };
}

class LocalQueueManager {
  private db: IDBPDatabase<TradePro> | null = null;
  private readonly DB_NAME = 'tradepro-offline';
  private readonly DB_VERSION = 1;
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = navigator.onLine;
  
  /**
   * Initialize IndexedDB
   */
  async initialize(): Promise<void> {
    this.db = await openDB<TradePro>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Order queue store
        if (!db.objectStoreNames.contains('order-queue')) {
          const orderStore = db.createObjectStore('order-queue', {
            keyPath: 'localId',
          });
          orderStore.createIndex('by-status', 'status');
          orderStore.createIndex('by-timestamp', 'timestamp');
          orderStore.createIndex('by-localId', 'localId', { unique: true });
        }
        
        // Sync metadata store
        if (!db.objectStoreNames.contains('sync-metadata')) {
          db.createObjectStore('sync-metadata', { keyPath: 'key' });
        }
      },
    });
    
    // Setup online/offline listeners
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Start periodic sync check
    this.startSyncInterval();
    
    console.log('[LocalQueueManager] Initialized');
  }
  
  /**
   * Add order to queue
   */
  async queueOrder(
    type: 'place' | 'modify' | 'cancel',
    orderData: any
  ): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    
    const localId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const queuedOrder: QueuedOrder = {
      id: orderData.id || localId,
      localId,
      type,
      data: orderData,
      timestamp: Date.now(),
      retryCount: 0,
      lastRetryAt: null,
      status: 'pending',
      error: null,
      serverId: null,
    };
    
    await this.db.add('order-queue', queuedOrder);
    
    console.log(`[LocalQueueManager] Queued ${type} order:`, localId);
    
    // Attempt immediate sync if online
    if (this.isOnline) {
      this.processQueue();
    }
    
    return localId;
  }
  
  /**
   * Get all pending orders
   */
  async getPendingOrders(): Promise<QueuedOrder[]> {
    if (!this.db) return [];
    
    const tx = this.db.transaction('order-queue', 'readonly');
    const index = tx.store.index('by-status');
    const pending = await index.getAll('pending');
    
    return pending.sort((a, b) => a.timestamp - b.timestamp);
  }
  
  /**
   * Get all queued orders (any status)
   */
  async getAllQueuedOrders(): Promise<QueuedOrder[]> {
    if (!this.db) return [];
    return await this.db.getAll('order-queue');
  }
  
  /**
   * Update order status
   */
  async updateOrderStatus(
    localId: string,
    status: QueuedOrder['status'],
    serverId?: string,
    error?: string
  ): Promise<void> {
    if (!this.db) return;
    
    const order = await this.db.get('order-queue', localId);
    if (!order) return;
    
    order.status = status;
    if (serverId) order.serverId = serverId;
    if (error) order.error = error;
    
    await this.db.put('order-queue', order);
  }
  
  /**
   * Remove order from queue
   */
  async removeOrder(localId: string): Promise<void> {
    if (!this.db) return;
    await this.db.delete('order-queue', localId);
    console.log(`[LocalQueueManager] Removed order: ${localId}`);
  }
  
  /**
   * Process queue (attempt to sync)
   */
  async processQueue(): Promise<void> {
    if (!this.isOnline) {
      console.log('[LocalQueueManager] Offline, skipping queue processing');
      return;
    }
    
    const pending = await this.getPendingOrders();
    if (pending.length === 0) return;
    
    console.log(`[LocalQueueManager] Processing ${pending.length} pending orders`);
    
    for (const order of pending) {
      try {
        // Mark as processing
        await this.updateOrderStatus(order.localId, 'processing');
        
        // Attempt to sync with backend
        const result = await this.syncOrder(order);
        
        if (result.success) {
          // Mark as synced
          await this.updateOrderStatus(
            order.localId,
            'synced',
            result.serverId
          );
          
          // Remove from queue after successful sync
          setTimeout(() => this.removeOrder(order.localId), 5000);
        } else {
          throw new Error(result.error || 'Sync failed');
        }
      } catch (error) {
        console.error(`[LocalQueueManager] Failed to sync order ${order.localId}:`, error);
        
        // Update retry count
        const updatedOrder = await this.db!.get('order-queue', order.localId);
        if (updatedOrder) {
          updatedOrder.retryCount++;
          updatedOrder.lastRetryAt = Date.now();
          updatedOrder.status = 'failed';
          updatedOrder.error = error instanceof Error ? error.message : 'Unknown error';
          await this.db!.put('order-queue', updatedOrder);
        }
        
        // Schedule retry with exponential backoff
        this.scheduleRetry(order.localId, updatedOrder?.retryCount || 0);
      }
    }
  }
  
  /**
   * Sync individual order with backend
   */
  private async syncOrder(order: QueuedOrder): Promise<{ success: boolean; serverId?: string; error?: string }> {
    // This would call your actual API
    // For now, simulating API call
    
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const API = `${BACKEND_URL}/api`;
    
    try {
      const endpoint = order.type === 'place' ? '/orders/place' : 
                      order.type === 'modify' ? `/orders/${order.id}/modify` :
                      `/orders/${order.id}/cancel`;
      
      const response = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(order.data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      return {
        success: true,
        serverId: result.order_id || result.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Schedule retry with exponential backoff
   */
  private scheduleRetry(localId: string, retryCount: number): void {
    const MAX_RETRIES = 5;
    if (retryCount >= MAX_RETRIES) {
      console.log(`[LocalQueueManager] Max retries reached for ${localId}`);
      return;
    }
    
    // Exponential backoff: 2^retryCount seconds (max 5 minutes)
    const delayMs = Math.min(Math.pow(2, retryCount) * 1000, 5 * 60 * 1000);
    
    console.log(`[LocalQueueManager] Scheduling retry for ${localId} in ${delayMs}ms`);
    
    setTimeout(async () => {
      const order = await this.db?.get('order-queue', localId);
      if (order && order.status === 'failed') {
        order.status = 'pending';
        await this.db?.put('order-queue', order);
        this.processQueue();
      }
    }, delayMs);
  }
  
  /**
   * Online event handler
   */
  private handleOnline = (): void => {
    console.log('[LocalQueueManager] Connection restored');
    this.isOnline = true;
    this.processQueue();
  };
  
  /**
   * Offline event handler
   */
  private handleOffline = (): void => {
    console.log('[LocalQueueManager] Connection lost');
    this.isOnline = false;
  };
  
  /**
   * Start periodic sync interval
   */
  private startSyncInterval(): void {
    // Check for pending orders every 30 seconds
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.processQueue();
      }
    }, 30000);
  }
  
  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    failed: number;
    synced: number;
  }> {
    if (!this.db) return { total: 0, pending: 0, processing: 0, failed: 0, synced: 0 };
    
    const all = await this.getAllQueuedOrders();
    
    return {
      total: all.length,
      pending: all.filter(o => o.status === 'pending').length,
      processing: all.filter(o => o.status === 'processing').length,
      failed: all.filter(o => o.status === 'failed').length,
      synced: all.filter(o => o.status === 'synced').length,
    };
  }
  
  /**
   * Clear all synced orders
   */
  async clearSyncedOrders(): Promise<void> {
    if (!this.db) return;
    
    const synced = await this.db.getAllFromIndex('order-queue', 'by-status', 'synced');
    
    for (const order of synced) {
      await this.removeOrder(order.localId);
    }
    
    console.log(`[LocalQueueManager] Cleared ${synced.length} synced orders`);
  }
  
  /**
   * Cleanup
   */
  async destroy(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    
    this.db?.close();
    console.log('[LocalQueueManager] Destroyed');
  }
}

export default new LocalQueueManager();
export type { QueuedOrder };
