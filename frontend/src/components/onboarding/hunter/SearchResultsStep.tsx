'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UilInfoCircle,
  UilUsersAlt,
  UilPhone,
  UilCloudDownload,
  UilFileAlt
} from '@tooni/iconscout-unicons-react';
import { StepProps } from './types';
import { useAction } from 'convex/react';
import { api } from '@convex/_generated/api';

type LeadRecord = {
  leadId: string;
  name?: string;
  email?: string;
  phone?: string;
  linkedInUrl?: string;
  websiteUrl?: string;
  companyName?: string;
  companySize?: string;
  industry?: string;
  location?: string;
  jobTitle?: string;
  department?: string;
  seniority?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  confidence: number;
  dataSource: string;
};

export function SearchResultsStep({
  searchResults,
  currentSearchId,
  userUsageStats
}: StepProps) {
  const getSearchResults = useAction(api.hunterActions.getSearchResults);
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportProgress, setExportProgress] = React.useState(0);

  const fetchAllLeads = async (searchId: string): Promise<LeadRecord[]> => {
    const pageSize = 500;
    let offset = 0;
    let all: LeadRecord[] = [];
    let total = Infinity;
    while (all.length < total) {
      const resp: any = await getSearchResults({
        searchId,
        limit: pageSize,
        offset,
      });
      // resp.results is the object returned by query; it contains { results: LeadRecord[], total, hasMore }
      const page = resp?.results?.results ?? [];
      const pageTotal = resp?.results?.total ?? resp?.total ?? page.length;
      total = Number.isFinite(pageTotal) ? pageTotal : pageTotal || page.length;
      all = all.concat(page as LeadRecord[]);
      offset += pageSize;
      setExportProgress(Math.min(99, Math.round((all.length / Math.max(1, total)) * 100)));
      if (!resp?.results?.hasMore && all.length >= total) break;
      // Safety break if backend doesn't provide totals
      if (page.length === 0) break;
    }
    return all;
  };

  const toCsv = (rows: any[], headers: string[]) => {
    const escape = (val: any) => {
      if (val === null || val === undefined) return '';
      const s = String(val);
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    const headerLine = headers.join(',');
    const lines = rows.map(r => headers.map(h => escape(r[h])).join(','));
    return [headerLine, ...lines].join('\n');
  };

  const downloadBlob = (data: BlobPart, filename: string, type: string) => {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: 'json' | 'csv' | 'xlsx') => {
    if (!currentSearchId) return;
    try {
      setIsExporting(true);
      setExportProgress(5);
      const leads = await fetchAllLeads(currentSearchId);
      setExportProgress(100);

      const headers = [
        'name','companyName','email','phone','linkedInUrl','websiteUrl','jobTitle','industry','location','companySize','department','seniority','emailVerified','phoneVerified','confidence','dataSource'
      ];

      if (format === 'json') {
        downloadBlob(JSON.stringify(leads, null, 2), `leads-${currentSearchId}.json`, 'application/json');
        return;
      }

      if (format === 'csv') {
        const rows = leads.map(l => ({
          name: l.name || '',
          companyName: l.companyName || '',
          email: l.email || '',
          phone: l.phone || '',
          linkedInUrl: (l as any).linkedInUrl || '',
          websiteUrl: l.websiteUrl || '',
          jobTitle: l.jobTitle || '',
          industry: l.industry || '',
          location: l.location || '',
          companySize: l.companySize || '',
          department: l.department || '',
          seniority: l.seniority || '',
          emailVerified: l.emailVerified ? 'true' : 'false',
          phoneVerified: l.phoneVerified ? 'true' : 'false',
          confidence: l.confidence,
          dataSource: l.dataSource || ''
        }));
        const csv = toCsv(rows, headers);
        downloadBlob(csv, `leads-${currentSearchId}.csv`, 'text/csv;charset=utf-8');
        return;
      }

      if (format === 'xlsx') {
        try {
          const XLSX: any = await import('xlsx/xlsx.mjs');
          const rows = leads.map(l => ({
            name: l.name || '',
            companyName: l.companyName || '',
            email: l.email || '',
            phone: l.phone || '',
            linkedInUrl: (l as any).linkedInUrl || '',
            websiteUrl: l.websiteUrl || '',
            jobTitle: l.jobTitle || '',
            industry: l.industry || '',
            location: l.location || '',
            companySize: l.companySize || '',
            department: l.department || '',
            seniority: l.seniority || '',
            emailVerified: l.emailVerified,
            phoneVerified: l.phoneVerified,
            confidence: l.confidence,
            dataSource: l.dataSource || ''
          }));
          const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
          const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          downloadBlob(wbout, `leads-${currentSearchId}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        } catch (e) {
          console.error('XLSX export failed. Is "xlsx" installed?', e);
          // Fallback to CSV
          const fallbackHeaders = headers;
          const rows = leads.map(l => ({
            name: l.name || '',
            companyName: l.companyName || '',
            email: l.email || '',
            phone: l.phone || '',
            linkedInUrl: (l as any).linkedInUrl || '',
            websiteUrl: l.websiteUrl || '',
            jobTitle: l.jobTitle || '',
            industry: l.industry || '',
            location: l.location || '',
            companySize: l.companySize || '',
            department: l.department || '',
            seniority: l.seniority || '',
            emailVerified: l.emailVerified ? 'true' : 'false',
            phoneVerified: l.phoneVerified ? 'true' : 'false',
            confidence: l.confidence,
            dataSource: l.dataSource || ''
          }));
          const csv = toCsv(rows, fallbackHeaders);
          downloadBlob(csv, `leads-${currentSearchId}.csv`, 'text/csv;charset=utf-8');
        }
        return;
      }
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };
  return (
    <Card className="transform rotate-1 relative overflow-hidden">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
            HUNT COMPLETE!
          </h1>
        </div>
        <div className="space-y-6">
          <p className="text-xl text-center text-gray-700">
            Your lead list is ready! We found high-quality prospects matching your criteria.
          </p>
          
          {userUsageStats?.subscription?.tier === 'free' && (
            <Card className="bg-yellow-50 border-2 border-black">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Button size="sm" variant="neutral" className="bg-yellow-200 flex-shrink-0">
                    <UilInfoCircle className="h-4 w-4" />
                  </Button>
                  <div>
                    <p className="text-sm font-bold">FREE TIER NOTICE</p>
                    <p className="text-sm text-gray-700 mt-1">
                      Your search results will be available for 7 days. Upgrade to Premium to keep your data permanently.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {searchResults && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="bg-violet-50 border-2 border-black transform -rotate-1">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-bold uppercase text-gray-600">Total Leads</p>
                  <p className="text-3xl font-black">{searchResults.totalLeads}</p>
                </CardContent>
              </Card>
              <Card className="bg-violet-50 border-2 border-black transform rotate-1">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-bold uppercase text-gray-600">Verified Emails</p>
                  <p className="text-3xl font-black">{searchResults.verifiedEmails}</p>
                </CardContent>
              </Card>
              <Card className="bg-violet-50 border-2 border-black transform -rotate-1">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-bold uppercase text-gray-600">Phone Numbers</p>
                  <p className="text-3xl font-black">{searchResults.verifiedPhones}</p>
                </CardContent>
              </Card>
              <Card className="bg-violet-50 border-2 border-black transform rotate-1">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-bold uppercase text-gray-600">Websites</p>
                  <p className="text-3xl font-black">{searchResults.businessWebsites}</p>
                </CardContent>
              </Card>
              <Card className="bg-violet-50 border-2 border-black transform -rotate-1">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-bold uppercase text-gray-600">Response Rate</p>
                  <p className="text-3xl font-black">{searchResults.avgResponseRate}</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-2 border-black transform rotate-1">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-bold uppercase text-gray-600">Search Time</p>
                  <p className="text-3xl font-black">{searchResults.searchTime}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                className="flex-1 h-14 text-lg font-black uppercase bg-violet-400 hover:bg-violet-400/90 text-black border-2 border-black"
                disabled={!currentSearchId || isExporting}
                onClick={() => handleExport('csv')}
              >
                EXPORT CSV
                <UilCloudDownload className="ml-2 h-6 w-6" />
              </Button>
              <Button
                className="flex-1 h-14 text-lg font-black uppercase bg-green-400 hover:bg-green-400/90 text-black border-2 border-black"
                disabled={!currentSearchId || isExporting}
                onClick={() => handleExport('json')}
              >
                EXPORT JSON
                <UilFileAlt className="ml-2 h-6 w-6" />
              </Button>
              <Button
                className="flex-1 h-14 text-lg font-black uppercase bg-blue-500 hover:bg-blue-600 text-white border-2 border-black"
                disabled={!currentSearchId || isExporting}
                onClick={() => handleExport('xlsx')}
              >
                EXPORT XLSX
                <UilCloudDownload className="ml-2 h-6 w-6" />
              </Button>
            </div>
            {isExporting && (
              <div className="w-full bg-gray-200 rounded-full h-3 border-2 border-black">
                <div
                  className="bg-black h-full rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}