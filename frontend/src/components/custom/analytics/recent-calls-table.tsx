'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RecentCall {
  time: string;
  prospect: string;
  outcome: string;
  agent: string;
}

interface RecentCallsTableProps {
  recentCalls: RecentCall[];
}

export default function RecentCallsTable({ recentCalls }: RecentCallsTableProps) {
  return (
    <div className="bg-white p-4 border-2 sm:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]">
      <h3 className="font-black uppercase text-sm mb-4 text-gray-600">RECENT CALL OUTCOMES</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-black bg-gray-50">
              <th className="text-left p-2 font-black uppercase text-xs">TIME</th>
              <th className="text-left p-2 font-black uppercase text-xs">PROSPECT</th>
              <th className="text-center p-2 font-black uppercase text-xs">OUTCOME</th>
              <th className="text-center p-2 font-black uppercase text-xs">AGENT</th>
            </tr>
          </thead>
          <tbody>
            {recentCalls.slice(0, 8).map((call, index) => (
              <tr key={index} className={cn("border-b border-gray-300", index % 2 === 0 ? "bg-white" : "bg-gray-50")}>
                <td className="p-2 font-medium text-xs">{call.time}</td>
                <td className="p-2 font-medium text-xs">{call.prospect}</td>
                <td className="p-2 text-center">
                  <Badge className={cn(
                    "border border-black font-bold uppercase text-xs",
                    call.outcome === 'Demo Scheduled' ? "bg-green-400 text-black" :
                    call.outcome === 'Follow-up Needed' ? "bg-yellow-400 text-black" :
                    "bg-gray-400 text-white"
                  )}>
                    {call.outcome}
                  </Badge>
                </td>
                <td className="p-2 text-center font-medium text-xs">{call.agent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}