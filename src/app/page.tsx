"use client";

import { useState, useEffect, useRef } from "react";
import { Shield, ScanLine, Link as LinkIcon, AlertTriangle, CheckCircle, Search, QrCode, Moon, Sun, Activity, HelpCircle, File as FileIcon, SearchCheck, UploadCloud, Users, FileText, Clock, Tag, Database, Hash, Download } from "lucide-react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { useTheme } from "next-themes";

export default function Home() {
  const [url, setUrl] = useState("");
  const [scamText, setScamText] = useState("");
  const [extractedIocs, setExtractedIocs] = useState<{type: string, value: string}[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  
  const [result, setResult] = useState<null | { 
    status: "safe" | "malicious" | "queued"; 
    message: string; 
    error?: string; 
    analysisId?: string;
    targetId?: string;
    stats?: { malicious: number, total: number };
    vendors?: Record<string, { category: string, result: string | null }>;
    details?: any;
  }>(null);
  
  const [activeTab, setActiveTab] = useState<"url" | "file" | "qr" | "scam">("url");
  const [file, setFile] = useState<File | null>(null);
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const pollStatus = async () => {
      if (result?.status === 'queued' && result.analysisId) {
        try {
          const res = await fetch("/api/scan/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ analysisId: result.analysisId, targetId: result.targetId })
          });
          const data = await res.json();
          
          if (data.status === 'queued') {
             timeoutId = setTimeout(pollStatus, 3000);
          } else {
             setResult(data);
             setIsScanning(false);
          }
        } catch (error) {
          setResult({ status: "malicious", message: "Error polling analysis status." });
          setIsScanning(false);
        }
      }
    };

    if (result?.status === 'queued') {
       timeoutId = setTimeout(pollStatus, 3000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [result]);

  const scanTarget = async (payload: string, type: "url" | "qr" | "hash") => {
    setIsScanning(true);
    setResult(null);

    if (type === "url" && /^[a-fA-F0-9]{32,64}$/.test(payload)) {
      type = "hash";
    }

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, payload }),
      });
      const data = await response.json();
      setResult(data);
      if (data.status !== 'queued') setIsScanning(false);
    } catch (error) {
      setResult({ status: "malicious", message: "Error scanning target. Please try again." });
      setIsScanning(false);
    }
  };

  const scanFile = async (selectedFile: File) => {
    setIsScanning(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setResult(data);
      if (data.status !== 'queued') setIsScanning(false);
    } catch (error) {
       setResult({ status: "malicious", message: "Error uploading file. Please try again." });
       setIsScanning(false);
    }
  }

  const handleUrlScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    scanTarget(url, "url");
  };

  const handleFileScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    scanFile(file);
  }

  const handleQrFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const qrFile = e.target.files?.[0];
    if (!qrFile) return;

    setResult(null);
    const jsQR = (await import("jsqr")).default;
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Attempt Both for better detection on low-contrast or inverted QR codes
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });
        
        if (code) {
          setUrl(code.data);
          setActiveTab("url");
          scanTarget(code.data, "qr");
        } else {
          setResult({ 
            status: "malicious", 
            message: "QR Decode Failed",
            error: "Could not decode a valid QR code from this image. Ensure the code is clear and visible." 
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(qrFile);
  };

  const parseScamText = (text: string) => {
    setScamText(text);
    const urls = Array.from(text.matchAll(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi)).map(m => m[0]);
    const ips = Array.from(text.matchAll(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g)).map(m => m[0]);
    const hashes = Array.from(text.matchAll(/\b[a-fA-F0-9]{32,64}\b/g)).map(m => m[0]);
    
    const allIocs = [
      ...urls.map(u => ({ type: 'url', value: u })),
      ...ips.map(i => ({ type: 'url', value: i })),
      ...hashes.map(h => ({ type: 'hash', value: h }))
    ];
    
    const uniqueIocs = Array.from(new Map(allIocs.map(item => [item.value, item])).values());
    setExtractedIocs(uniqueIocs);
  }

  const downloadPdf = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    // Dynamically import html2pdf to prevent Next.js Server-Side Rendering (SSR) crashes
    const html2pdf = (await import('html2pdf.js')).default;

    const opt: any = {
      margin:       10,
      filename:     `AegisDome_Report.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0f172a' }, // Force dark background for canvas so white text is visible
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const handleRedirectClick = () => {
    const isDomainOrUrl = (url.startsWith('http') || url.includes('.')) && !url.includes(' ');
    if (!isDomainOrUrl) return;
    
    const finalUrl = url.startsWith('http') ? url : `http://${url}`;
    
    if (result?.status === 'safe') {
      window.open(finalUrl, '_blank');
    } else {
      setShowRedirectModal(true);
    }
  };

  useEffect(() => {
    if (activeTab === "qr") {
      setResult(null);
      if (!scannerRef.current) {
        const scanner = new Html5QrcodeScanner(
          "qr-reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA] 
          },
          false
        );
        scannerRef.current = scanner;

        scanner.render(
          (decodedText) => {
            scanner.clear();
            setUrl(decodedText);
            setActiveTab("url");
            scanTarget(decodedText, "qr");
          },
          (error) => {}
        );
      }
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [activeTab]);

  return (
    <div className="min-h-screen flex flex-col relative transition-colors duration-300 bg-background print:bg-white text-foreground print:text-black">
      
      <header className="w-full border-b border-[var(--card-border)] bg-[var(--card-bg)] sticky top-0 z-50 transition-colors duration-300 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary-500" />
            <h1 className="text-xl font-bold tracking-tight">
              AEGIS<span className="text-primary-500">DOME</span>
            </h1>
          </div>
          <div className="flex items-center gap-6">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full hover:bg-[var(--card-border)] transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-slate-600" />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* For print only: Add a nice header for the PDF report */}
      <div className="hidden print:flex flex-col border-b-2 border-black pb-4 mb-8 pt-8">
         <div className="flex justify-between items-end">
           <div>
             <h1 className="text-3xl font-bold text-black flex items-center gap-2">
                <Shield className="w-8 h-8" /> AegisDome Intelligence Report
             </h1>
             <p className="text-gray-600 text-sm mt-2 font-mono">Generated: {new Date().toUTCString()}</p>
           </div>
           {result?.status && result.status !== 'queued' && (
             <div className="text-right">
               <h2 className={`text-2xl font-bold uppercase tracking-widest ${result.status === 'safe' ? 'text-green-700' : 'text-red-700'}`}>
                 {result.status === 'safe' ? 'CLEAN' : 'MALICIOUS'}
               </h2>
               <p className="text-gray-600 text-sm font-semibold mt-1">Detection Score: {result.stats?.malicious} / {result.stats?.total}</p>
             </div>
           )}
         </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col gap-8 lg:gap-12 z-10 print:py-0 print:px-0">
        
        {/* Top Section - Input Area */}
        <div className="print:hidden w-full max-w-3xl mx-auto flex flex-col gap-6">
          <div className="space-y-2 text-center flex flex-col items-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              AegisDome
            </h2>
            <p className="text-base text-[var(--text-muted)] max-w-xl">
              Analyze URLs, files, and QR codes for threats. Use Scam Radar to extract hidden IOCs, and generate fully selectable native PDF reports powered by VirusTotal.
            </p>
          </div>

          <div className="glass-panel rounded-xl p-4 sm:p-6">
            <div className="flex flex-wrap gap-2 border-b border-[var(--card-border)] pb-4 mb-6">
              <button onClick={() => setActiveTab("url")} className={`flex items-center gap-2 font-semibold px-3 py-2 rounded-md transition-colors text-sm ${activeTab === "url" ? "text-primary-600 bg-primary-500/10 border-b-2 border-primary-500" : "text-[var(--text-muted)] hover:text-foreground"}`}>
                <LinkIcon className="w-4 h-4" /> URL / Hash
              </button>
              <button onClick={() => setActiveTab("file")} className={`flex items-center gap-2 font-semibold px-3 py-2 rounded-md transition-colors text-sm ${activeTab === "file" ? "text-primary-600 bg-primary-500/10 border-b-2 border-primary-500" : "text-[var(--text-muted)] hover:text-foreground"}`}>
                <FileIcon className="w-4 h-4" /> File
              </button>
              <button onClick={() => setActiveTab("scam")} className={`flex items-center gap-2 font-semibold px-3 py-2 rounded-md transition-colors text-sm ${activeTab === "scam" ? "text-primary-600 bg-primary-500/10 border-b-2 border-primary-500" : "text-[var(--text-muted)] hover:text-foreground"}`}>
                <SearchCheck className="w-4 h-4" /> Scam Radar
              </button>
              <button onClick={() => setActiveTab("qr")} className={`flex items-center gap-2 font-semibold px-3 py-2 rounded-md transition-colors text-sm ${activeTab === "qr" ? "text-primary-600 bg-primary-500/10 border-b-2 border-primary-500" : "text-[var(--text-muted)] hover:text-foreground"}`}>
                <QrCode className="w-4 h-4" /> QR
              </button>
            </div>

            {activeTab === "url" && (
              <form onSubmit={handleUrlScan} className="flex flex-col gap-3 relative">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-[var(--text-muted)]" />
                  </div>
                  <input type="text" placeholder="Search a URL, IP address, domain, or hash..." value={url} onChange={(e) => setUrl(e.target.value)} className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg py-3 pl-12 pr-4 text-foreground placeholder:text-[var(--text-muted)] focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"/>
                </div>
                <button type="submit" disabled={isScanning || !url} className="bg-primary-600 hover:bg-primary-500 text-white font-medium px-6 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full">
                  {isScanning ? <><Activity className="w-5 h-5 animate-spin" /> Scanning</> : "Scan Target"}
                </button>
              </form>
            )}

            {activeTab === "file" && (
               <form onSubmit={handleFileScan} className="flex flex-col gap-3">
                 <div className="border-2 border-dashed border-[var(--card-border)] rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-primary-500 transition-colors bg-[var(--input-bg)] relative">
                   <UploadCloud className="w-10 h-10 text-[var(--text-muted)] mb-3" />
                   <p className="text-sm font-medium mb-1">Drag and drop a file, or click to browse</p>
                   <p className="text-xs text-[var(--text-muted)] mb-4">Max file size: 32MB</p>
                   <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                   {file && <p className="text-sm font-semibold text-primary-500 mt-2">{file.name}</p>}
                 </div>
                 <button type="submit" disabled={isScanning || !file} className="bg-primary-600 hover:bg-primary-500 text-white font-medium px-6 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full">
                  {isScanning ? <><Activity className="w-5 h-5 animate-spin" /> Scanning</> : "Upload & Scan File"}
                </button>
               </form>
            )}

            {activeTab === "scam" && (
               <div className="flex flex-col gap-3">
                 <p className="text-sm text-[var(--text-muted)]">Paste an email, text message, or raw text below. We will automatically extract and identify suspicious URLs, IPs, and hashes for scanning.</p>
                 <textarea value={scamText} onChange={(e) => parseScamText(e.target.value)} placeholder="Paste suspicious text here..." className="w-full h-32 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg p-3 text-sm text-foreground focus:outline-none focus:border-primary-500 resize-none"/>
                 {extractedIocs.length > 0 && (
                   <div className="mt-2 space-y-2">
                     <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Extracted Indicators ({extractedIocs.length})</p>
                     <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2">
                        {extractedIocs.map((ioc, idx) => (
                           <div key={idx} className="flex items-center justify-between bg-[var(--input-bg)] border border-[var(--card-border)] p-2 rounded-md">
                             <span className="text-sm truncate mr-2" title={ioc.value}>{ioc.value}</span>
                             <button onClick={() => scanTarget(ioc.value, ioc.type as "url"|"hash")} disabled={isScanning} className="shrink-0 bg-primary-500/10 hover:bg-primary-500/20 text-primary-600 px-3 py-1 rounded text-xs font-semibold">Scan</button>
                           </div>
                        ))}
                     </div>
                   </div>
                 )}
               </div>
            )}

            {activeTab === "qr" && (
              <div className="flex flex-col gap-6">
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-[var(--text-muted)]"><QrCode className="w-4 h-4"/> Scan via Web Camera</h3>
                  <div className="w-full overflow-hidden rounded-lg border border-[var(--card-border)] bg-black/5">
                    <div id="qr-reader" className="w-full"></div>
                    <style dangerouslySetInnerHTML={{__html: `
                      #qr-reader { border: none !important; }
                      #qr-reader__dashboard_section_csr button { background: #0284c7; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 500; cursor: pointer; transition: background 0.2s; }
                      #qr-reader__dashboard_section_csr button:hover { background: #0369a1; }
                      #qr-reader__dashboard_section_csr span { color: var(--text-muted) !important; font-size: 14px; }
                      #qr-reader__dashboard_section_swaplink { display: none !important; }
                    `}} />
                  </div>
                </div>
                
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 shadow-sm">
                   <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-[var(--text-muted)]"><UploadCloud className="w-4 h-4"/> Upload QR Image</h3>
                   <div className="relative border-2 border-dashed border-primary-500/30 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-primary-500 hover:bg-primary-500/5 transition-all cursor-pointer">
                     <QrCode className="w-10 h-10 text-primary-500 mb-3" />
                     <p className="text-sm font-semibold mb-1">Drag and drop a QR code image</p>
                     <p className="text-xs text-[var(--text-muted)] mb-4">Supported formats: JPG, PNG, GIF</p>
                     <button className="bg-[var(--input-bg)] border border-[var(--card-border)] hover:bg-[var(--card-border)] text-sm font-medium px-4 py-2 rounded-md transition-colors pointer-events-none">
                       Browse Files
                     </button>
                     <input type="file" accept="image/*" onChange={handleQrFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Upload QR Image" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Results Area */}
        <div className="flex-1 w-full print:w-full overflow-visible bg-[var(--background)] text-[var(--foreground)]" id="report-content">
          {/* Changed glass-panel to remove bounded height so it expands naturally */}
          <div className="glass-panel print:border-none print:shadow-none print:bg-transparent rounded-xl flex flex-col transition-all duration-300">
            <div className="p-4 sm:p-6 border-b border-[var(--card-border)] print:hidden flex items-center justify-between">
               <h3 className="font-semibold text-lg">Analysis Report</h3>
               <div className="flex items-center gap-3">
                 {result?.status && result.status !== 'queued' && (
                   <button 
                     onClick={downloadPdf} 
                     className="flex items-center gap-2 text-xs font-semibold bg-slate-500/10 hover:bg-slate-500/20 text-foreground px-3 py-1.5 rounded-full transition-colors"
                   >
                     <Download className="w-4 h-4" />
                     PDF Report
                   </button>
                 )}
                 {result?.stats && (
                   <div className={`px-3 py-1 rounded-full text-sm font-bold ${result.status === 'safe' ? 'bg-safe-500/10 text-safe-600' : 'bg-danger-500/10 text-danger-600'}`}>
                     Score: {result.stats.malicious} / {result.stats.total}
                   </div>
                 )}
               </div>
            </div>
            
            <div className="flex-1 flex flex-col bg-[var(--card-bg)] print:bg-transparent rounded-b-xl overflow-visible">
              {!result ? (
                <div className="h-full min-h-[250px] p-6 flex flex-col items-center justify-center text-center gap-4 text-[var(--text-muted)] print:hidden">
                  <ScanLine className="w-12 h-12 opacity-20" />
                  <p className="text-sm">Submit a target to view the detection scoreboard and detailed report.</p>
                </div>
              ) : result.error ? (
                <div className="flex flex-col items-center justify-center p-6 text-center gap-4 text-danger-500 min-h-[250px]">
                   <AlertTriangle className="w-12 h-12" />
                   <p className="font-medium">{result.error}</p>
                </div>
              ) : (
                <div className="flex flex-col h-full animate-in fade-in pb-12">
                  
                  {/* Results Header (Hidden on print because print has custom header) */}
                  <div className="p-6 pb-0 print:hidden">
                    <div className="flex items-center gap-4 pb-4">
                      <div className={`w-14 h-14 rounded-full flex shrink-0 items-center justify-center ${
                        result.status === 'safe' ? 'bg-safe-500/10 text-safe-600' : 
                        result.status === 'queued' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-danger-500/10 text-danger-600'
                      }`}>
                        {result.status === 'safe' ? <CheckCircle className="w-7 h-7" /> : 
                         result.status === 'queued' ? <Activity className="w-7 h-7 animate-spin" /> : <AlertTriangle className="w-7 h-7" />}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <h3 className={`text-xl font-bold uppercase tracking-wide ${
                          result.status === 'safe' ? 'text-safe-600' : 
                          result.status === 'queued' ? 'text-yellow-600' : 'text-danger-600'
                        }`}>
                          {result.status === 'safe' ? 'Clean' : result.status === 'queued' ? 'Pending' : 'Malicious'}
                        </h3>
                        <p className="text-[var(--text-muted)] text-sm mt-1 truncate font-mono" title={result.details?.meaningful_name || url}>
                          {result.status === 'queued' ? 'Analysis in progress' : (result.details?.meaningful_name || url || 'Target Analysis')}
                        </p>
                      </div>
                      
                      {((url.startsWith('http') || url.includes('.')) && !url.includes(' ')) && result.status !== 'queued' && (
                        <button 
                          onClick={handleRedirectClick}
                          className="shrink-0 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 print:hidden"
                        >
                          Visit Link <LinkIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {/* Tags */}
                    {result.details?.tags && result.details.tags.length > 0 && (
                       <div className="flex flex-wrap gap-2 pb-4">
                         {result.details.tags.map((tag: string, idx: number) => (
                           <span key={idx} className="bg-slate-500/10 text-slate-500 border border-slate-500/20 px-2 py-1 rounded text-xs font-semibold">
                             {tag}
                           </span>
                         ))}
                       </div>
                    )}
                  </div>

                  {/* Print Target Info (Visible only on print) */}
                  <div className="hidden print:block mb-8">
                     <h3 className="text-xl font-bold border-b border-gray-300 pb-2 mb-2 text-black">Target Analysis</h3>
                     <p className="font-mono text-gray-800 break-all">{result.details?.meaningful_name || url || 'Target'}</p>
                  </div>

                  {/* Combined Single-View Content */}
                  {result.status !== 'queued' && (
                    <div className="flex-1 flex flex-col gap-8 bg-[var(--input-bg)] print:bg-transparent print:gap-12">
                      
                      {/* Detection Section */}
                      {result.vendors && (
                        <section className="print:break-inside-avoid">
                          <h4 className="font-semibold text-lg px-6 pt-6 pb-2 border-b border-[var(--card-border)] print:px-0 print:border-gray-300 print:text-black">
                            Security Vendors Detection
                          </h4>
                          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 print:p-0 print:pt-4 print:gap-x-8 print:gap-y-1">
                            {Object.entries(result.vendors).map(([vendorName, details], idx) => {
                              const isMalicious = details.category === 'malicious';
                              const isSuspicious = details.category === 'suspicious';
                              const isUnrated = details.category === 'undetected' || details.category === 'timeout' || details.category === 'type-unsupported';
                              return (
                                <div key={idx} className="bg-[var(--card-bg)] print:bg-transparent print:border-b print:border-gray-200 border border-[var(--card-border)] rounded-md p-3 print:p-1 flex items-center justify-between hover:border-primary-500/30 transition-colors">
                                  <span className="text-sm font-medium truncate pr-2 print:text-black" title={vendorName}>{vendorName}</span>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {isMalicious ? <AlertTriangle className="w-4 h-4 text-danger-500 print:hidden" /> : 
                                     isSuspicious ? <AlertTriangle className="w-4 h-4 text-yellow-500 print:hidden" /> : 
                                     isUnrated ? <HelpCircle className="w-4 h-4 text-[var(--text-muted)] print:hidden" /> : 
                                     <CheckCircle className="w-4 h-4 text-safe-500 print:hidden" />}
                                    <span className={`text-xs font-semibold ${isMalicious ? 'text-danger-500' : isSuspicious ? 'text-yellow-500' : isUnrated ? 'text-[var(--text-muted)] print:text-gray-500' : 'text-safe-500 print:text-green-700'}`}>
                                      {isMalicious ? details.result || 'Malicious' : isSuspicious ? 'Suspicious' : isUnrated ? 'Unrated' : 'Clean'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      )}

                      {/* Details Section */}
                      {result.details && (
                        <section className="px-6 print:px-0 space-y-8">
                          {/* Basic Properties */}
                          <div className="space-y-4 print:break-inside-avoid">
                            <h4 className="font-semibold text-lg flex items-center gap-2 border-b border-[var(--card-border)] print:border-gray-300 pb-2 print:text-black">
                              <Hash className="w-5 h-5 print:hidden"/> Basic properties
                            </h4>
                            <div className="bg-[var(--card-bg)] print:bg-transparent border border-[var(--card-border)] print:border-none rounded-lg divide-y divide-[var(--card-border)] print:divide-gray-200 text-sm">
                              {result.details.md5 && <div className="p-3 print:p-1 flex flex-col sm:flex-row gap-2"><span className="text-[var(--text-muted)] print:text-gray-600 font-medium w-40 shrink-0">MD5</span><span className="font-mono break-all print:text-black">{result.details.md5}</span></div>}
                              {result.details.sha1 && <div className="p-3 print:p-1 flex flex-col sm:flex-row gap-2"><span className="text-[var(--text-muted)] print:text-gray-600 font-medium w-40 shrink-0">SHA-1</span><span className="font-mono break-all print:text-black">{result.details.sha1}</span></div>}
                              {result.details.sha256 && <div className="p-3 print:p-1 flex flex-col sm:flex-row gap-2"><span className="text-[var(--text-muted)] print:text-gray-600 font-medium w-40 shrink-0">SHA-256</span><span className="font-mono break-all print:text-black">{result.details.sha256}</span></div>}
                              {result.details.ssdeep && <div className="p-3 print:p-1 flex flex-col sm:flex-row gap-2"><span className="text-[var(--text-muted)] print:text-gray-600 font-medium w-40 shrink-0">SSDEEP</span><span className="font-mono break-all print:text-black">{result.details.ssdeep}</span></div>}
                              {result.details.tlsh && <div className="p-3 print:p-1 flex flex-col sm:flex-row gap-2"><span className="text-[var(--text-muted)] print:text-gray-600 font-medium w-40 shrink-0">TLSH</span><span className="font-mono break-all print:text-black">{result.details.tlsh}</span></div>}
                              {result.details.type_description && <div className="p-3 print:p-1 flex flex-col sm:flex-row gap-2"><span className="text-[var(--text-muted)] print:text-gray-600 font-medium w-40 shrink-0">File type</span><span className="print:text-black">{result.details.type_description}</span></div>}
                              {result.details.magic && <div className="p-3 print:p-1 flex flex-col sm:flex-row gap-2"><span className="text-[var(--text-muted)] print:text-gray-600 font-medium w-40 shrink-0">Magic</span><span className="print:text-black">{result.details.magic}</span></div>}
                              {result.details.size && <div className="p-3 print:p-1 flex flex-col sm:flex-row gap-2"><span className="text-[var(--text-muted)] print:text-gray-600 font-medium w-40 shrink-0">File size</span><span className="print:text-black">{result.details.size} bytes ({(result.details.size / 1024).toFixed(2)} KB)</span></div>}
                            </div>
                          </div>

                          {/* History */}
                          <div className="space-y-4 print:break-inside-avoid">
                             <h4 className="font-semibold text-lg flex items-center gap-2 border-b border-[var(--card-border)] print:border-gray-300 pb-2 print:text-black">
                               <Clock className="w-5 h-5 print:hidden"/> History
                             </h4>
                             <div className="bg-[var(--card-bg)] print:bg-transparent border border-[var(--card-border)] print:border-none rounded-lg divide-y divide-[var(--card-border)] print:divide-gray-200 text-sm">
                               {result.details.first_seen_itw_date && <div className="p-3 print:p-1 flex flex-col sm:flex-row gap-2"><span className="text-[var(--text-muted)] print:text-gray-600 font-medium w-48 shrink-0">First Seen In The Wild</span><span className="print:text-black">{new Date(result.details.first_seen_itw_date * 1000).toUTCString()}</span></div>}
                               {result.details.first_submission_date && <div className="p-3 print:p-1 flex flex-col sm:flex-row gap-2"><span className="text-[var(--text-muted)] print:text-gray-600 font-medium w-48 shrink-0">First Submission</span><span className="print:text-black">{new Date(result.details.first_submission_date * 1000).toUTCString()}</span></div>}
                               {result.details.last_submission_date && <div className="p-3 print:p-1 flex flex-col sm:flex-row gap-2"><span className="text-[var(--text-muted)] print:text-gray-600 font-medium w-48 shrink-0">Last Submission</span><span className="print:text-black">{new Date(result.details.last_submission_date * 1000).toUTCString()}</span></div>}
                               {result.details.last_analysis_date && <div className="p-3 print:p-1 flex flex-col sm:flex-row gap-2"><span className="text-[var(--text-muted)] print:text-gray-600 font-medium w-48 shrink-0">Last Analysis</span><span className="print:text-black">{new Date(result.details.last_analysis_date * 1000).toUTCString()}</span></div>}
                             </div>
                          </div>

                          {/* Names */}
                          {result.details.names && result.details.names.length > 0 && (
                            <div className="space-y-4 print:break-inside-avoid">
                               <h4 className="font-semibold text-lg flex items-center gap-2 border-b border-[var(--card-border)] print:border-gray-300 pb-2 print:text-black">
                                 <Database className="w-5 h-5 print:hidden"/> Names
                               </h4>
                               <div className="bg-[var(--card-bg)] print:bg-transparent border border-[var(--card-border)] print:border-none rounded-lg p-4 print:p-0">
                                 <ul className="list-disc list-inside text-sm font-mono space-y-1 print:text-black">
                                   {result.details.names.map((name: string, idx: number) => (
                                      <li key={idx} className="break-all">{name}</li>
                                   ))}
                                 </ul>
                               </div>
                            </div>
                          )}
                        </section>
                      )}

                      {/* Community Section */}
                      <section className="px-6 print:px-0 space-y-6 print:break-inside-avoid">
                        <h4 className="font-semibold text-lg flex items-center gap-2 print:text-black print:border-b print:border-gray-300 print:pb-2">
                          <Users className="w-5 h-5 print:hidden"/> Community Insight
                        </h4>
                        <div className="bg-[var(--card-bg)] print:bg-transparent border border-[var(--card-border)] print:border-none rounded-lg p-6 print:p-0">
                           {result.details?.votes ? (
                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                               <div className="p-4 print:p-2 rounded-lg bg-[var(--input-bg)] print:bg-transparent border border-[var(--card-border)] print:border-gray-200">
                                 <p className="text-3xl font-bold text-safe-500 print:text-green-700 mb-1">{result.details.votes.harmless || 0}</p>
                                 <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] print:text-black font-semibold">Harmless</p>
                               </div>
                               <div className="p-4 print:p-2 rounded-lg bg-[var(--input-bg)] print:bg-transparent border border-[var(--card-border)] print:border-gray-200">
                                 <p className="text-3xl font-bold text-danger-500 mb-1">{result.details.votes.malicious || 0}</p>
                                 <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] print:text-black font-semibold">Malicious</p>
                               </div>
                               <div className="p-4 print:p-2 rounded-lg bg-[var(--input-bg)] print:bg-transparent border border-[var(--card-border)] print:border-gray-200">
                                 <p className="text-3xl font-bold text-yellow-500 print:text-orange-600 mb-1">{result.details.votes.suspicious || 0}</p>
                                 <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] print:text-black font-semibold">Suspicious</p>
                               </div>
                               <div className="p-4 print:p-2 rounded-lg bg-[var(--input-bg)] print:bg-transparent border border-[var(--card-border)] print:border-gray-200">
                                 <p className="text-3xl font-bold text-[var(--text-muted)] print:text-gray-500 mb-1">{result.details.votes.undetected || 0}</p>
                                 <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] print:text-black font-semibold">Undetected</p>
                               </div>
                             </div>
                           ) : (
                             <p className="text-center text-[var(--text-muted)] print:text-black py-8">No community votes available for this target yet.</p>
                           )}
                        </div>
                      </section>

                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Warning Modal Overlay */}
        {showRedirectModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-[var(--card-bg)] border border-danger-500/50 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
              <div className="bg-danger-500 text-white p-6 text-center">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-2xl font-bold">SECURITY WARNING</h2>
              </div>
              <div className="p-6">
                <p className="font-semibold text-lg mb-2">Proceed with Extreme Caution!</p>
                <p className="text-[var(--text-muted)] text-sm mb-4">
                  The link you are trying to visit has been flagged as <strong>malicious</strong> by {result?.stats?.malicious} security vendors. Visiting this site could expose you to malware, phishing, or other cyber threats.
                </p>
                <div className="bg-black/20 p-3 rounded-lg border border-[var(--card-border)] mb-6">
                  <p className="font-mono text-xs text-danger-500 break-all">{url}</p>
                </div>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => setShowRedirectModal(false)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:bg-[var(--card-border)] text-foreground font-semibold py-3 rounded-lg transition-colors"
                  >
                    Go Back to Safety
                  </button>
                  <button 
                    onClick={() => {
                      const finalUrl = url.startsWith('http') ? url : `http://${url}`;
                      window.open(finalUrl, '_blank');
                      setShowRedirectModal(false);
                    }}
                    className="w-full text-danger-500 hover:text-danger-400 font-semibold py-2 transition-colors text-sm underline"
                  >
                    I understand the risks, proceed anyway
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
