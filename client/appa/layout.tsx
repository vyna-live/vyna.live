import type { Metadata } from "next";
// import { Geist, Geist_Mono, Inter } from "next/font/google";
import StreamVideoProvider from "@/providers/StreamClientProvider";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
// import { ThemeProvider } from "@/components/ui/theme-provider";
import { Inter } from "next/font/google";
import "@stream-io/video-react-sdk/dist/css/styles.css";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Vyna.live",
  description:
    "Experience seamless live streaming and connect with your audience like never before.",
  icons: {},
};
const inter = Inter({
  subsets: ["latin"],
});
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorText: "#ffffff",
          colorPrimary: "#0e78f9",
          colorBackground: "#1c1f2e",
          colorInputBackground: "#252a41",
          colorInputText: "#fff",
        },
        layout: {
          logoPlacement: "inside",
          logoImageUrl: "/spooky.svg",
          // logoAlignment: "left",
          // showSideBar: false,
          // showHeader: false,
        },
      }}
    >
      <html lang="en">
        <body className={`${inter.className} dark1`}>
          {/* <ThemeProvider
            attribute="class"
            forcedTheme="dark"
            storageKey="vyni-theme"
          > */}
          <StreamVideoProvider>{children}</StreamVideoProvider>
          {/* </ThemeProvider> */}
        </body>
      </html>
    </ClerkProvider>
  );
}
