import React, { useState, useEffect } from 'react';

interface GoogleDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  textToExport: string;
  alternatives: string[];
  onShowToast: (message: string) => void;
}

export const GoogleDocsModal: React.FC<GoogleDocsModalProps> = ({
  isOpen,
  onClose,
  textToExport,
  alternatives,
  onShowToast
}) => {
  const [clientId, setClientId] = useState<string>(() => {
    return localStorage.getItem('hinglish_google_client_id') || '';
  });
  const [showIdSetup, setShowIdSetup] = useState(false);
  const [tempClientId, setTempClientId] = useState('');
  const [accessToken, setAccessToken] = useState<string>(() => {
    return sessionStorage.getItem('hinglish_google_access_token') || '';
  });

  const [exportMode, setExportMode] = useState<'create' | 'append'>('create');
  const [selectedText, setSelectedText] = useState(textToExport);
  const [newDocTitle, setNewDocTitle] = useState('My Hindi Translation');
  const [docUrlOrId, setDocUrlOrId] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Update selected text if textToExport changes
  useEffect(() => {
    setSelectedText(textToExport);
  }, [textToExport]);

  // Handle OAuth redirect token parsing
  useEffect(() => {
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get('access_token');
      if (token) {
        setAccessToken(token);
        sessionStorage.setItem('hinglish_google_access_token', token);
        onShowToast("Connected to Google Docs successfully!");
        
        // Clean URL hash
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  if (!isOpen) return null;

  const currentRedirectUri = window.location.origin;

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = tempClientId.trim();
    if (!cleanId) return;

    setClientId(cleanId);
    localStorage.setItem('hinglish_google_client_id', cleanId);
    setShowIdSetup(false);
    onShowToast("Client ID saved!");
  };

  const handleDisconnect = () => {
    setAccessToken('');
    sessionStorage.removeItem('hinglish_google_access_token');
    onShowToast("Disconnected from Google Docs.");
  };

  const handleClearClientId = () => {
    const confirmClear = window.confirm("Are you sure you want to delete your Google Client ID?");
    if (!confirmClear) return;

    setClientId('');
    localStorage.removeItem('hinglish_google_client_id');
    setAccessToken('');
    sessionStorage.removeItem('hinglish_google_access_token');
    onShowToast("Google credentials cleared.");
  };

  const startOAuthFlow = () => {
    if (!clientId) {
      setTempClientId('');
      setShowIdSetup(true);
      return;
    }

    const scope = 'https://www.googleapis.com/auth/documents';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(currentRedirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}&prompt=consent`;

    // Redirect the user to Google Login
    window.location.href = authUrl;
  };

  const extractDocId = (input: string): string => {
    const cleanInput = input.trim();
    // Regex for document ID extraction from full Google Doc URL
    const match = cleanInput.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : cleanInput;
  };

  const handleExport = async () => {
    if (!selectedText.trim()) {
      onShowToast("No text selected to export.");
      return;
    }

    setIsExporting(true);
    try {
      if (exportMode === 'create') {
        // Step 1: Create empty Google Doc
        const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title: newDocTitle || 'Hinglish Converter Transcript' })
        });

        if (!createRes.ok) {
          const errData = await createRes.json();
          throw new Error(errData.error?.message || 'Failed to create document');
        }

        const docData = await createRes.json();
        const documentId = docData.documentId;

        // Step 2: Append translation to the newly created Doc
        const appendRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requests: [
              {
                insertText: {
                  text: selectedText,
                  endOfSegmentLocation: { segmentId: '' }
                }
              }
            ]
          })
        });

        if (!appendRes.ok) {
          throw new Error('Failed to write Hindi text into document');
        }

        onShowToast("Document created and text imported successfully!");
        window.open(`https://docs.google.com/document/d/${documentId}/edit`, '_blank');
        onClose();
      } else {
        // Export mode is APPEND
        const documentId = extractDocId(docUrlOrId);
        if (!documentId) {
          onShowToast("Please enter a valid Google Doc URL or Document ID.");
          setIsExporting(false);
          return;
        }

        const appendRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requests: [
              {
                insertText: {
                  text: `\n\n${selectedText}`,
                  endOfSegmentLocation: { segmentId: '' }
                }
              }
            ]
          })
        });

        if (!appendRes.ok) {
          const errData = await appendRes.json();
          throw new Error(errData.error?.message || 'Failed to append text. Please check permissions or Doc ID.');
        }

        onShowToast("Text appended to Google Doc successfully!");
        window.open(`https://docs.google.com/document/d/${documentId}/edit`, '_blank');
        onClose();
      }
    } catch (error: any) {
      console.error(error);
      onShowToast(error.message || "Export failed. Please check connection and try again.");
      if (error.message?.includes('auth') || error.message?.includes('expired') || error.message?.includes('Unauthenticated')) {
        setAccessToken('');
        sessionStorage.removeItem('hinglish_google_access_token');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyUri = () => {
    navigator.clipboard.writeText(currentRedirectUri);
    onShowToast("Redirect URI copied!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Import to Google Docs</h2>
              <p className="text-xs text-slate-500">Send translation directly to your Docs</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Section 1: Client ID Setup Instruction Drawer */}
          {showIdSetup ? (
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-250 text-sm flex items-center gap-2">
                <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs">i</span>
                Enable Google Auth: 60-Second Developer Setup
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Connect your workspace using standard client-side OAuth. Create a quick Client Credentials file in Google Cloud:
              </p>
              <ol className="text-xs text-slate-600 dark:text-slate-400 list-decimal pl-4 space-y-2">
                <li>
                  Go to the{' '}
                  <a 
                    href="https://console.cloud.google.com/apis/credentials" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-indigo-600 hover:underline inline-flex items-center font-semibold"
                  >
                    Google Cloud Credentials page
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  . Ensure you have an active project.
                </li>
                <li>
                  Click <strong>+ Create Credentials</strong> &rarr; <strong>OAuth client ID</strong>.
                </li>
                <li>
                  Select <strong>Web application</strong>. In the <strong>Authorized redirect URIs</strong> section, add:
                  <div className="flex items-center space-x-2 mt-1.5">
                    <code className="text-[10.5px] bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 py-1 px-2.5 rounded text-indigo-600 font-mono select-all flex-1 line-clamp-1">
                      {currentRedirectUri}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyUri}
                      className="text-xs bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 py-1 px-2.5 rounded font-bold transition"
                    >
                      Copy
                    </button>
                  </div>
                </li>
                <li>
                  Copy the generated <strong>Client ID</strong> and paste it below.
                </li>
              </ol>

              <form onSubmit={handleSaveClientId} className="space-y-3 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Paste Client ID Here
                  </label>
                  <input
                    type="text"
                    required
                    value={tempClientId}
                    onChange={(e) => setTempClientId(e.target.value)}
                    placeholder="e.g. 12345678-abc.apps.googleusercontent.com"
                    className="w-full text-xs font-mono p-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl focus:border-indigo-500 outline-none text-slate-800 dark:text-white"
                  />
                </div>
                <div className="flex justify-end gap-2 text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setShowIdSetup(false)}
                    className="py-2 px-3 font-semibold text-slate-500 hover:text-slate-800 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Save Client ID
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {/* Connected State / Connection Actions */}
          {!showIdSetup && (
            <div className="bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-100 dark:border-slate-850 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${accessToken ? 'bg-emerald-500 shadow-md shadow-emerald-200' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {accessToken ? 'Connected to Google Docs' : 'Not Connected'}
                  </span>
                </div>
                {clientId && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1">
                    Client ID Active: {clientId.substring(0, 16)}...
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {clientId && !accessToken && (
                  <button
                    type="button"
                    onClick={startOAuthFlow}
                    className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-3 rounded-lg transition"
                  >
                    Authorize Google Account
                  </button>
                )}
                {!clientId && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempClientId(clientId);
                      setShowIdSetup(true);
                    }}
                    className="text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 py-1.5 px-3 rounded-lg transition border border-indigo-100 dark:border-indigo-900/50"
                  >
                    Setup Credentials
                  </button>
                )}
                {accessToken && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 py-1.5 px-3 rounded-lg transition"
                  >
                    Disconnect
                  </button>
                )}
                {clientId && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempClientId(clientId);
                      setShowIdSetup(true);
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100"
                    title="Edit Client ID"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                )}
                {clientId && (
                  <button
                    type="button"
                    onClick={handleClearClientId}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                    title="Clear settings"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Selection of Text to Export */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Select Translation to Export
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-[140px] overflow-y-auto">
              {/* Default word bubble transcript */}
              {textToExport ? (
                <div 
                  onClick={() => setSelectedText(textToExport)}
                  className={`cursor-pointer p-3 rounded-xl border text-sm transition text-left
                    ${selectedText === textToExport 
                      ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/20 text-slate-800 dark:text-orange-100 font-semibold' 
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-900/30'}`}
                >
                  <p className="font-hindi text-base mb-1">{textToExport}</p>
                  <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">Default Sentence</span>
                </div>
              ) : null}

              {/* Variations */}
              {alternatives.map((altText, idx) => (
                <div 
                  key={idx}
                  onClick={() => setSelectedText(altText)}
                  className={`cursor-pointer p-3 rounded-xl border text-sm transition text-left
                    ${selectedText === altText 
                      ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/20 text-slate-800 dark:text-orange-100 font-semibold' 
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-900/30'}`}
                >
                  <p className="font-hindi text-base mb-1">{altText}</p>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Variation {idx + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Export Mode Toggles */}
          <div className="space-y-3 pt-1">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Destination Document Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportMode('create')}
                disabled={!accessToken}
                className={`py-3.5 px-4 rounded-xl font-bold text-sm border flex items-center justify-center space-x-2 transition
                  ${!accessToken ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200 dark:bg-slate-900/30 text-slate-400' : ''}
                  ${exportMode === 'create' && accessToken
                    ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/10 text-indigo-600 dark:text-indigo-400 font-black' 
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create New Doc</span>
              </button>

              <button
                type="button"
                onClick={() => setExportMode('append')}
                disabled={!accessToken}
                className={`py-3.5 px-4 rounded-xl font-bold text-sm border flex items-center justify-center space-x-2 transition
                  ${!accessToken ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200 dark:bg-slate-900/30 text-slate-400' : ''}
                  ${exportMode === 'append' && accessToken
                    ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/10 text-indigo-600 dark:text-indigo-400 font-black' 
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 4a2 2 0 002 2h2a2 2 0 002-2M8 4a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Append to Existing</span>
              </button>
            </div>
          </div>

          {/* Parameters depending on mode */}
          {accessToken && exportMode === 'create' && (
            <div className="space-y-1.5 animate-in fade-in duration-300">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                New Document Title
              </label>
              <input
                type="text"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="Enter new doc title..."
                className="w-full text-sm p-3.5 border-2 border-slate-100 dark:border-slate-800 rounded-xl focus:border-indigo-500 outline-none text-slate-800 dark:text-white dark:bg-slate-950"
              />
            </div>
          )}

          {accessToken && exportMode === 'append' && (
            <div className="space-y-1.5 animate-in fade-in duration-300">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                Google Doc URL or Document ID
              </label>
              <input
                type="text"
                value={docUrlOrId}
                onChange={(e) => setDocUrlOrId(e.target.value)}
                placeholder="Paste the URL of your Google Doc..."
                className="w-full text-sm p-3.5 border-2 border-slate-100 dark:border-slate-800 rounded-xl focus:border-indigo-500 outline-none text-slate-800 dark:text-white dark:bg-slate-950"
              />
              <p className="text-[10px] text-slate-400 ">
                Tip: Paste the Google Doc link from your address bar.
              </p>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3 text-sm">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={accessToken ? handleExport : startOAuthFlow}
            disabled={isExporting}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-white shadow-md transition flex items-center justify-center space-x-2
              ${isExporting 
                ? 'bg-slate-400 cursor-not-allowed shadow-none' 
                : accessToken 
                  ? 'bg-indigo-600 hover:bg-indigo-700' 
                  : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            {isExporting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Exporting...</span>
              </>
            ) : accessToken ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Confirm Import to Doc</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Authorize & Export</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
