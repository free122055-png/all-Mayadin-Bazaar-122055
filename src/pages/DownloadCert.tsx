import React, { useState } from "react";
import { Download, Check, Copy, FileText, ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

// Exact Base64 of the original 2758-byte release.keystore file for offline instant browser download
const KEYSTORE_BASE64 = "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";

const CERT_TEXT = `-----BEGIN CERTIFICATE-----
MIIDrDCCApSgAwIBAgIUbgYcPFUN2XsLeghtCPsqIYtBzaswDQYJKoZIhvcNAQEL
BQAwZzEXMBUGA1UEAwwOQWxNYXlhZGluQmF6YXIxCzAJBgNVBAsMAklUMRIwEAYD
VQQKDAlBbE1heWFkaW4xDjAMBgNVBAcMBURoYWthMQ4wDAYDVQQIDAVEaGFrYTEL
MAkGA1UEBhMCQkQwIBcNMjYwOTA1MDExOTAzWhgPMjA1NDAxMjEwMTE5MDNaMGcx
FzAVBgNVBAMMDkFsTWF5YWRpbkJhemFyMQswCQYDVQQLDAJJVDESMBAGA1UECgwJ
QWxNYXlhZGluMQ4wDAYDVQQHDAVEaGFrYTEOMAwGA1UECAwFRGhha2ExCzAJBgNV
BAYTAkJEMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAviP68ivjAo6v
Unlbn3mQ+TALPmrpIXU+fgieWShnnY87pvmTYPLQoR0JTSL+fG9HQ4gm2knzCMXO
+d3hTfVdKtbd0kFy6o5xMemhIyav97OM0N1zvAHVhjlSKur6I2+zQFoagE+n0uU7
KrY6bYOxIMFugWW/G2Hf7PAO9V91LwODU/hW5yzEz5Ff1YhX1olOQVWdHdFQMBop
3jTdibo8r1oYzmrH/ZU8EgAtNJQ5PSNVUXp55BHQTz7Zs73T7mtCRtxd5+wUhALj
/6MeXbWQbSf+4RfamabJwh4Dhya1l4pfNhunchvvyTktpGcASdv9wvwLsTbY3QtL
EowJ4tzE0wIDAQABo04wTDAJBgNVHRMEAjAAMAsGA1UdDwQEAwIFoDATBgNVHSUE
DDAKBggrBgEFBQcDAzAdBgNVHQ4EFgQUR3TGcUW3FpVJrprtIRzP+bow3TkwDQYJ
KoZIhvcNAQELBQADggEBAHFAsHyB0XkYk6fOT4mmqp8ZwvtBlUJOnyGbKH7hLm+O
LChwZ/51lGpvv5XHvBqtbE9PCDX9eon6BDXrC0qHRte/F25MjmrcL6oSfAfXiskf
y0yoJ5bfrBqZPdcEljdgBVtM6ubKTuzBzFS794EZ/VeTDOcWWiWeduXuMnJjNLOF
3w5cEKghRo7PUeAatg+fT7TyAgujs0lvYB8W1esvs0dwEWxWh/CEcIv5z0McCXmG
OVKwXvSuAXa961yvmxhloAvVNj3PHewurSsi+j//+6+EtA9G5LJmj+1BBhxglwOk
55HxX8zghz4QKZeBFB07kjohqwXoqPOkqwPoBTpCOEo=
-----END CERTIFICATE-----`;

export function DownloadCertificatePage() {
  const [copiedCert, setCopiedCert] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedAlias, setCopiedAlias] = useState(false);

  const handleDownloadKeystore = (e?: React.MouseEvent) => {
    try {
      const byteCharacters = atob(KEYSTORE_BASE64);
      const byteNumbers = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteNumbers], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "release.keystore";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.warn("Client blob download fallback:", err);
    }
  };

  const handleDownloadPem = () => {
    const blob = new Blob([CERT_TEXT], { type: "application/x-pem-file" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "upload_certificate.pem";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyText = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-700 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Android Signing & Keystore</h1>
              <p className="text-xs text-slate-400">Codemagic & Google Play Signing</p>
            </div>
          </div>
          <Link to="/admin" className="p-2 text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        {/* PRIMARY CARD: release.keystore */}
        <div className="bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  release.keystore
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                    আসল সাইনিং কি
                  </span>
                </h2>
                <p className="text-xs text-amber-200/90 mt-0.5">
                  Codemagic-এ AAB সাইন করার জন্য এই আসল ফাইলটি প্রয়োজন
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-700/60">
            <div>
              <span className="text-slate-400 text-[11px] block">Key Alias:</span>
              <div className="flex items-center justify-between mt-0.5">
                <code className="text-amber-300 font-bold font-mono">almayadin</code>
                <button
                  onClick={() => copyText("almayadin", setCopiedAlias)}
                  className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                  title="Copy Alias"
                >
                  {copiedAlias ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Password:</span>
              <div className="flex items-center justify-between mt-0.5">
                <code className="text-amber-300 font-bold font-mono">almayadin123</code>
                <button
                  onClick={() => copyText("almayadin123", setCopiedPass)}
                  className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                  title="Copy Password"
                >
                  {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <a
              href="/api/download-keystore"
              download="release.keystore"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDownloadKeystore}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-98 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2.5 transition cursor-pointer text-center"
            >
              <Download className="w-4 h-4 stroke-[3]" />
              <span>Download release.keystore (সরাসরি ডাউনলোড)</span>
            </a>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-slate-400">
              <span>বিকল্প লিংক:</span>
              <a href="/api/download-keystore" download="release.keystore" className="text-amber-400 underline hover:text-amber-300">
                /api/download-keystore
              </a>
              <span>•</span>
              <a href="/download-keystore.html" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline hover:text-amber-300">
                অটো ডাউনলোড পেজ ↗
              </a>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-[11px] text-amber-200/90 leading-relaxed">
              💡 <strong>টিপ:</strong> প্রিভিউ আইফ্রেমে ডাউনলোড ব্লক হলে উপরে ডানপাশের <strong>↗ (Open in new tab)</strong> আইকনে ক্লিক করে নতুন ট্যাবে এই পেজটি খুলুন, অথবা AI Studio-র <strong>Settings &gt; Export to ZIP</strong> করুন।
            </div>
          </div>
        </div>

        {/* SECONDARY CARD: upload_certificate.pem */}
        <div className="bg-slate-900/60 border border-slate-700/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-slate-300">upload_certificate.pem (Google Play Console)</h3>
            </div>
            <span className="text-[10px] text-slate-400">Play Key Reset</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDownloadPem}
              className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .PEM</span>
            </button>
            <button
              onClick={() => copyText(CERT_TEXT, setCopiedCert)}
              className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              {copiedCert ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCert ? "কপি হয়েছে!" : "কপি"}</span>
            </button>
          </div>
        </div>

        {/* Codemagic Setup Help */}
        <div className="bg-blue-950/30 border border-blue-500/30 rounded-2xl p-4 text-xs text-blue-200 space-y-2">
          <p className="font-bold text-blue-300">💡 Codemagic Signing কনফিগার করার নিয়ম:</p>
          <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
            <li>Codemagic-এ গিয়ে আপনার অ্যাপের <strong>Android code signing</strong> সেকশনে যান।</li>
            <li>উপরে ডাউনলোড করা <code>release.keystore</code> ফাইলটি আপলোড করুন।</li>
            <li><strong>Keystore password:</strong> <code>almayadin123</code> দিন।</li>
            <li><strong>Key alias:</strong> <code>almayadin</code> দিন।</li>
            <li><strong>Key password:</strong> <code>almayadin123</code> দিন।</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export const DownloadCert = DownloadCertificatePage;
export default DownloadCertificatePage;
