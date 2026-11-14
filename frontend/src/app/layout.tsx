// src/app/layout.tsx
import type { Metadata } from "next";
import { Montserrat, Poppins } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@contexts/AppProviders";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"]
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"]
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kochigurupizza.com"),
  title: "Kochi Guru Pizza - Authentic Italian & Wood-Fired Pizza",
  description:
    "Authentic Italian style wood-fired pizza, burgers, pasta, hotdogs, and fresh fruit juices at Kochi Guru Pizza, Walasmulla. Located at Cargills Food City Building (Basement). Best Italian taste in town! Call: 077 077 6848.",
  keywords: [
    "Kochi Guru Pizza",
    "Italian style pizza Sri Lanka",
    "Wood-fired pizza Walasmulla",
    "Authentic Italian Pizza",
    "Pasta Walasmulla",
    "Burgers Walasmulla",
    "Hotdogs Walasmulla",
    "Fresh Fruit Juice",
    "Cargills Food City Walasmulla",
    "0770776848"
  ],
  icons: {
    icon: "/logo.svg"
  },
  openGraph: {
    title: "Kochi Guru Pizza - Authentic Italian & Wood-Fired Pizza",
    description:
      "Savor the best Italian style wood-fired pizza, pasta, and burgers in Walasmulla. A perfect place for families and celebrations.",
    url: "https://kochigurupizza.com",
    siteName: "Kochi Guru Pizza",
    images: [
      {
        url: "/logo.svg",
        width: 800,
        height: 600
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Kochi Guru Pizza - Authentic Italian & Wood-Fired Pizza",
    description:
      "Authentic Italian style wood-fired pizza, burgers, pasta, and more in Walasmulla, Sri Lanka.",
    images: ["/logo.svg"]
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "PizzaRestaurant",
  name: "Kochi Guru Pizza",
  image: "https://kochigurupizza.com/logo.svg",
  "@id": "https://kochigurupizza.com",
  url: "https://kochigurupizza.com",
  telephone: "0770776848",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Basement Floor, Cargills Food City Building, Beliatta Road",
    addressLocality: "Walasmulla",
    postalCode: "82220",
    addressCountry: "LK"
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 6.1504,
    longitude: 80.6947
  },
  hasMap: "https://maps.app.goo.gl/mf1ubUr2vemCjisDA",
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ],
    opens: "10:00",
    closes: "22:00"
  },
  servesCuisine: "Italian",
  priceRange: "$$",
  menu: "https://kochigurupizza.com/menu"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${montserrat.variable} ${poppins.variable} antialiased`}
      >
        <AppProviders>
          <main className="min-h-screen">{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
