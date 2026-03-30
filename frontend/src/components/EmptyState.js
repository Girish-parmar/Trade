import React from 'react';
import { Button } from './ui/button';

const EmptyState = ({ title, description, actionLabel, onAction, icon: Icon }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      {Icon && <Icon className="h-12 w-12 text-muted-foreground mb-4" />}
      <h3 className="text-lg font-heading font-semibold mb-2">{title}</h3>
      <p className="text-sm font-mono text-muted-foreground mb-6 max-w-md">{description}</p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="rounded-none font-mono text-xs uppercase tracking-wider"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;