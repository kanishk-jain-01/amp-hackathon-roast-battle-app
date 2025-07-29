import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>RoastBot - AI vs Human Roast Battle</title>
        <meta name="description" content="Interactive 3-round roast battle game between humans and AI with live audience voting" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="RoastBot - AI vs Human Roast Battle" />
        <meta property="og:description" content="Vote in the epic battle of wits between humans and AI!" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Component {...pageProps} />
    </>
  )
} 