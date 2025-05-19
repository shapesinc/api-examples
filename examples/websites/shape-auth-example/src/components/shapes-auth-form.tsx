"use client";
import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { LogIn, KeyRound, AlertTriangle, Smartphone, Cookie, History, SendHorizonal, Loader2, Copy, Settings } from 'lucide-react'; // Import Settings icon

const DEFAULT_APP_ID = "f6263f80-2242-428d-acd4-10e1feec44ee";
const API_BASE_URL = "https://api.shapes.inc/v1";
const SITE_BASE_URL = "https://shapes.inc";
const DEFAULT_MODEL_NAME = "shaperobot"; // Use just the model name part here
const MODEL_PREFIX = "shapesinc/"; // Define the fixed prefix

type AuthStep = 'initial' | 'awaitingCode' | 'tokenReady';

export default function ShapesAuthForm() {
  const [appId, setAppId] = useState(DEFAULT_APP_ID);
  const [oneTimeCode, setOneTimeCode] = useState('');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [messageToSend, setMessageToSend] = useState('');
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [authStep, setAuthStep] = useState<AuthStep>('initial');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelName, setModelName] = useState(DEFAULT_MODEL_NAME); // New state for model name
  const { toast } = useToast();

  useEffect(() => {
    const envAppId = process.env.NEXT_PUBLIC_SHAPESINC_APP_ID;
    if (envAppId) {
      setAppId(envAppId);
    }
  }, []);

  const handleLoginClick = () => {
    setError(null);
    const authorizeUrl = `${SITE_BASE_URL}/authorize?app_id=${appId}`;
    window.open(authorizeUrl, '_blank', 'noopener,noreferrer');
    setAuthStep('awaitingCode');
    toast({
        title: "New Window Opened",
        description: "Please login/authorize in the new window. Then, copy the one-time code and paste it here.",
    });
  };

  const handleCodeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, oneTimeCode }),
      });
      const data = await response.json();

      if (response.ok && data.auth_token) {
        setAuthToken(data.auth_token);
        setAuthStep('tokenReady');
        setOneTimeCode('');
        toast({ title: "Success!", description: "Auth token received." });
      } else {
        setError(data.message || 'Failed to exchange code for token. Ensure the code is correct and not expired.');
        toast({ variant: "destructive", title: "Error", description: data.message || 'Token exchange failed.' });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during token exchange.';
      setError(errorMessage);
      toast({ variant: "destructive", title: "Network Error", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!authToken) {
      setError("Auth token is not available.");
      toast({ variant: "destructive", title: "Error", description: "Auth token is missing." });
      return;
    }
    if (!modelName.trim()) { // Add validation for model name
       setError("Model name cannot be empty.");
       toast({ variant: "destructive", title: "Error", description: "Please specify a model name." });
       return;
    }

    setError(null);
    setApiResponse(null);
    setIsLoading(true);

    const fullModelName = `${MODEL_PREFIX}${modelName.trim()}`; // Construct the full model string

    try {
      const response = await fetch(`${API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-ID': appId,
          'X-User-Auth': authToken,
        },
        body: JSON.stringify({
          model: fullModelName, // Use the constructed model name
          messages: [{ role: 'user', content: messageToSend }],
        }),
      });
      const data = await response.json();
      if (response.ok && data.choices && data.choices.length > 0) {
        setApiResponse(data.choices[0].message.content);
        setMessageToSend('');
        toast({ title: "Message Sent", description: "Response received." });
      } else {
        const errorMsg = data.message || (data.error?.message) || 'Failed to send message or no response content.';
        setError(errorMsg);
        toast({ variant: "destructive", title: "API Error", description: errorMsg });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while sending the message.';
      setError(errorMessage);
      toast({ variant: "destructive", title: "Network Error", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const storeToken = (storageType: 'localStorage' | 'cookie') => {
    if (!authToken) return;
    if (storageType === 'localStorage') {
      localStorage.setItem('shapesAuthToken', authToken);
      toast({ title: "Token Stored", description: "Auth token saved to Local Storage." });
    } else {
      document.cookie = `shapesAuthToken=${authToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax; Secure`; // 7 days
      toast({ title: "Token Stored", description: "Auth token saved as a cookie." });
    }
  };

  const loadToken = () => {
    setError(null);
    let loadedToken = localStorage.getItem('shapesAuthToken');
    let source = "Local Storage";

    if (!loadedToken) {
      loadedToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('shapesAuthToken='))
        ?.split('=')[1] || null;
      source = "Cookie";
    }

    if (loadedToken) {
      setAuthToken(loadedToken);
      setAuthStep('tokenReady');
      toast({ title: "Token Loaded", description: `Auth token loaded from ${source}.` });
    } else {
      toast({ variant: "destructive", title: "Not Found", description: "No token found in Local Storage or Cookies." });
    }
  };

  const resetState = () => {
    setOneTimeCode('');
    setAuthToken(null);
    setMessageToSend('');
    setApiResponse(null);
    setAuthStep('initial');
    setIsLoading(false);
    setError(null);
    setModelName(DEFAULT_MODEL_NAME); // Reset model name on reset
    localStorage.removeItem('shapesAuthToken');
    document.cookie = 'shapesAuthToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure';
    toast({ title: "State Reset", description: "Application state and stored tokens have been cleared."});
  };

  const handleCopyToken = () => {
    if (authToken) {
      navigator.clipboard.writeText(authToken).then(() => {
        toast({ title: "Copied!", description: "Auth token copied to clipboard." });
      }).catch(err => {
        console.error("Failed to copy token: ", err);
        toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy token to clipboard." });
      });
    }
  };


  return (
    <Card className="w-full max-w-lg shadow-2xl">
      <CardHeader className="flex flex-col items-center space-y-4">
        <img
          src="https://crd573fr6fjpt2tz.public.blob.vercel-storage.com/shapesinc/src/assets/images/logo_colored-8Ubm0TWeUp4zjIqC7bv0ki8PVxflUa.png"
          alt="Shapes Inc. Logo"
          className="w-20 h-auto"
        />
        <CardTitle className="text-3xl font-bold text-center">Shapes Inc. Auth</CardTitle>
        <CardDescription className="text-center">Authenticate with Shapes Inc. to use their API.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {authStep === 'initial' && (
          <div className="space-y-4">
            <Button onClick={handleLoginClick} className="w-full transition-transform duration-150 ease-in-out hover:scale-105" disabled={isLoading} aria-label="Login with Shapes Inc.">
              <LogIn className="mr-2 h-5 w-5" /> Login with Shapes Inc.
            </Button>
            <Button onClick={loadToken} variant="outline" className="w-full" disabled={isLoading} aria-label="Load token from storage">
              <History className="mr-2 h-5 w-5" /> Load Token from Storage
            </Button>
          </div>
        )}

        {authStep === 'awaitingCode' && (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="oneTimeCode" className="text-sm font-medium">One-Time Code</label>
              <div className="flex items-center space-x-2">
                <KeyRound className="h-5 w-5 text-muted-foreground" />
                <Input
                  id="oneTimeCode"
                  type="text"
                  placeholder="Paste your one-time code here"
                  value={oneTimeCode}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setOneTimeCode(e.target.value)}
                  required
                  className="flex-grow"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                A new window/tab should have opened for Shapes Inc. authorization. Once you've authorized and received a one-time code there, please copy it and paste it into the field above.
              </p>
            </div>
            <Button type="submit" className="w-full transition-transform duration-150 ease-in-out hover:scale-105" disabled={isLoading || !oneTimeCode}>
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <KeyRound className="mr-2 h-5 w-5" />}
              Submit Code
            </Button>
            <Button onClick={() => setAuthStep('initial')} variant="outline" className="w-full" disabled={isLoading}>
              Cancel
            </Button>
          </form>
        )}

        {authStep === 'tokenReady' && authToken && (
          <div className="space-y-6">
            <Alert variant="default" className="bg-primary/10 border-primary/30">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary">Auth Token Acquired</AlertTitle>
              <AlertDescription className="break-all text-xs font-mono p-2 bg-muted rounded my-2 overflow-x-auto flex items-center justify-between">
                <span className="flex-grow mr-2">{authToken}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyToken}
                  aria-label="Copy token to clipboard"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </AlertDescription>
              <p className="text-xs text-primary/80">
                <strong>Disclaimer:</strong> For demonstration purposes only. Do not display or store auth tokens like this in a production environment. Securely manage tokens (e.g., server-side or HttpOnly cookies).
              </p>
            </Alert>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button onClick={() => storeToken('localStorage')} variant="outline" className="w-full" aria-label="Store token in Local Storage">
                <Smartphone className="mr-2 h-5 w-5" /> Store in Local Storage
              </Button>
              <Button onClick={() => storeToken('cookie')} variant="outline" className="w-full" aria-label="Store token as Cookie">
                <Cookie className="mr-2 h-5 w-5" /> Store as Cookie
              </Button>
            </div>

            {/* Model Input Field */}
            <div className="space-y-2">
              <label htmlFor="modelName" className="text-sm font-medium flex items-center">
                <Settings className="mr-2 h-4 w-4 text-muted-foreground" /> API Model
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">{MODEL_PREFIX}</span>
                <Input
                  id="modelName"
                  type="text"
                  placeholder="e.g., shaperobot"
                  value={modelName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setModelName(e.target.value)}
                  required
                  className="flex-grow"
                />
              </div>
               <p className="text-xs text-muted-foreground">Enter the model name after "{MODEL_PREFIX}".</p>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="messageToSend" className="text-sm font-medium">Send a Message via Shapes API</label>
                <Textarea
                  id="messageToSend"
                  placeholder="Type your message here..."
                  value={messageToSend}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMessageToSend(e.target.value)}
                  required
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full transition-transform duration-150 ease-in-out hover:scale-105" disabled={isLoading || !messageToSend || !modelName.trim()}> {/* Disable if modelName is empty */}
                {isLoading && !apiResponse ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <SendHorizonal className="mr-2 h-5 w-5" />}
                Send Message
              </Button>
            </form>

            {apiResponse && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">API Response:</h3>
                <Card className="bg-muted/50 p-4">
                  <CardContent className="p-0">
                    <p className="text-sm whitespace-pre-wrap">{apiResponse}</p>
                  </CardContent>
                </Card>
              </div>
            )}
             <Button onClick={resetState} variant="destructive" className="w-full mt-4" disabled={isLoading}>
                Reset and Clear Token
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
         <p className="text-xs text-muted-foreground">App ID: {appId}</p>
      </CardFooter>
    </Card>
  );
}