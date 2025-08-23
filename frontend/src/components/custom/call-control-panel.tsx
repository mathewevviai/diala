"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CallStatus } from "@/types";
import { startCall } from "@/lib/api";
import { CallStatusIndicator } from "./call-status-indicator";

export function CallControlPanel() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [initialMessage, setInitialMessage] = useState("Hello, I am a voice agent.");
  const [status, setStatus] = useState<CallStatus>('IDLE');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.info('[GUI] CallControlPanel mounted and ready.');
  }, []);

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log(`[GUI] User is typing in phone number field. New value: "${value}"`);
    setPhoneNumber(value);
  };

  const handleInitialMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    console.log(`[GUI] User is typing in initial message field. New value: "${value}"`);
    setInitialMessage(value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('[GUI] User clicked "Initiate Call". Form submission initiated.');

    if (!phoneNumber || !initialMessage) {
        console.warn('[GUI] Submission halted: Phone number or message is empty.');
        setError('Both phone number and message are required.');
        setStatus('ERROR');
        return;
    }

    console.info(`[GUI] Setting call status to 'DIALING'.`);
    setStatus('DIALING');
    setError(null);

    const callDetails = {
      phone_number: phoneNumber,
      initial_message: initialMessage,
    };

    console.log('[GUI] Attempting to call backend API with details:', callDetails);

    try {
      const response = await startCall(callDetails);
      console.info('[GUI] API call successful. Response:', response);
      
      console.info(`[GUI] Setting call status to 'CONNECTED'.`);
      setStatus('CONNECTED');

    } catch (err: any) {
      console.error('[GUI] API call failed.', {
        errorMessage: err.message,
        originalError: err,
      });
      setError(err.message);
      
      console.info(`[GUI] Setting call status to 'ERROR'.`);
      setStatus('ERROR');
    }
  };

  const isCalling = status === 'DIALING' || status === 'CONNECTED';

  return (
    <Card className="w-full max-w-md border-4 border-border shadow-[8px_8px_0px_0px_var(--color-border)] hover:shadow-[12px_12px_0px_0px_var(--color-border)] transition-all duration-200">
      <CardHeader className="border-b-4 border-border">
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-black uppercase">Voice Agent Control</CardTitle>
          <CallStatusIndicator status={status} />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="phone" className="text-sm font-black block mb-2 uppercase tracking-wider">Phone Number</label>
            <Input
              id="phone"
              type="tel"
              placeholder="e.g., +15551234567"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              disabled={isCalling}
              required
              className="border-4 rounded-[3px]"
            />
          </div>
          <div>
            <label htmlFor="message" className="text-sm font-black block mb-2 uppercase tracking-wider">Initial Message</label>
            <Textarea
              id="message"
              placeholder="Enter the first sentence for the agent to say..."
              value={initialMessage}
              onChange={handleInitialMessageChange}
              disabled={isCalling}
              required
              className="border-4 rounded-[3px] min-h-[100px]"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full text-lg font-black uppercase tracking-wider" 
            size="lg"
            disabled={isCalling}
          >
            {isCalling ? 'Calling...' : 'Initiate Call'}
          </Button>
          {error && (
            <div className="border-4 border-border bg-red-500 text-white p-3 shadow-[4px_4px_0px_0px_var(--color-border)]">
              <p className="text-sm font-black uppercase tracking-wider">{error}</p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}