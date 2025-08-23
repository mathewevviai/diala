"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { CallStatus } from "@/types";

interface CallStatusIndicatorProps {
  status: CallStatus;
}

export function CallStatusIndicator({ status }: CallStatusIndicatorProps) {
  React.useEffect(() => {
    console.log('[GUI] CallStatusIndicator rendered with status:', status);
  }, [status]);

  const getStatusConfig = () => {
    switch (status) {
      case 'IDLE':
        return { variant: 'outline' as const, text: 'Ready', bgColor: 'bg-gray-200' };
      case 'DIALING':
        return { variant: 'secondary' as const, text: 'Dialing...', bgColor: 'bg-yellow-300' };
      case 'CONNECTED':
        return { variant: 'default' as const, text: 'Connected', bgColor: 'bg-green-400' };
      case 'DISCONNECTED':
        return { variant: 'outline' as const, text: 'Disconnected', bgColor: 'bg-gray-400' };
      case 'ERROR':
        return { variant: 'destructive' as const, text: 'Error', bgColor: 'bg-red-500' };
      default:
        return { variant: 'outline' as const, text: 'Unknown', bgColor: 'bg-gray-200' };
    }
  };

  const { variant, text, bgColor } = getStatusConfig();

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 ${bgColor} border-2 border-black animate-pulse`} />
      <Badge variant={variant} className="tracking-wider">
        {text}
      </Badge>
    </div>
  );
}