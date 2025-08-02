import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* <script src="../../../public/theme-init.js" /> */}
        {/* Use Next.js Script component for loading scripts */}
        <Script src="/theme-init.js" strategy="beforeInteractive" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
