import Script from 'next/script';

// IDs are validated on save and again here, because they're placed inside scripts.
const clean = {
  pixel: (v: string) => (/^\d{6,20}$/.test(v || '') ? v : ''),
  ga4: (v: string) => (/^G-[A-Z0-9]{4,15}$/.test(v || '') ? v : ''),
  gtm: (v: string) => (/^GTM-[A-Z0-9]{4,12}$/.test(v || '') ? v : ''),
  ads: (v: string) => (/^AW-\d{6,15}$/.test(v || '') ? v : ''),
  label: (v: string) => (/^[A-Za-z0-9_-]{4,40}$/.test(v || '') ? v : ''),
};

export function trackingIds(t: any) {
  return {
    pixel: clean.pixel(t.metaPixelId),
    ga4: clean.ga4(t.ga4Id),
    gtm: clean.gtm(t.gtmId),
    ads: clean.ads(t.googleAdsId),
    adsPurchaseLabel: clean.label(t.googleAdsPurchaseLabel),
    adsCartLabel: clean.label(t.googleAdsCartLabel),
    ecommerce: t.trackEcommerce !== false,
  };
}

export function TrackingScripts({ tracking }: { tracking: any }) {
  const id = trackingIds(tracking);
  const gtagIds = [id.ga4, id.ads].filter(Boolean);
  const cfg = {
    gtm: !!id.gtm,
    adsId: id.ads,
    adsPurchaseLabel: id.adsPurchaseLabel,
    adsCartLabel: id.adsCartLabel,
    ecommerce: id.ecommerce,
  };

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: `window.__storeTracking=${JSON.stringify(cfg)};` }} />

      {id.gtm && (
        <>
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id.gtm}');`}
          </Script>
          <noscript>
            <iframe src={`https://www.googletagmanager.com/ns.html?id=${id.gtm}`} height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} />
          </noscript>
        </>
      )}

      {gtagIds.length > 0 && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gtagIds[0]}`} strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());${gtagIds
              .map((g) => `gtag('config','${g}');`)
              .join('')}`}
          </Script>
        </>
      )}

      {id.pixel && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id.pixel}');fbq('track','PageView');`}
          </Script>
          <noscript>
            <img height="1" width="1" style={{ display: 'none' }} alt="" src={`https://www.facebook.com/tr?id=${id.pixel}&ev=PageView&noscript=1`} />
          </noscript>
        </>
      )}
    </>
  );
}
