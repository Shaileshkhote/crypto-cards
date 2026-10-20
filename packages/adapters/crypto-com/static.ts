import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "crypto-com",
      id: "crypto-com-united-states-prepaid",
      name: "Crypto.com Prepaid — United States",
      network: "visa",
      cardTypes: {
        physical: true,
        virtual: true,
      },
      issuer: {
        id: "community-federal-savings-bank",
        name: "Community Federal Savings Bank",
        country: "US",
      },
    },
    {
      defillamaSlug: "crypto-com",
      id: "crypto-com-eea-prepaid",
      name: "Crypto.com Prepaid — EEA",
      network: "visa",
      cardTypes: {
        physical: true,
        virtual: true,
      },
      issuer: {
        id: "foris-mt-limited",
        name: "Foris MT Limited",
        country: "MT",
      },
    },
    {
      defillamaSlug: "crypto-com",
      id: "crypto-com-united-kingdom-prepaid",
      name: "Crypto.com Prepaid — United Kingdom",
      network: "visa",
      cardTypes: {
        physical: true,
        virtual: true,
      },
      issuer: {
        id: "forisgfs-uk-limited",
        name: "ForisGFS UK Limited",
        country: "GB",
      },
    },
    {
      defillamaSlug: "crypto-com",
      id: "crypto-com-canada-prepaid",
      name: "Crypto.com Prepaid — Canada",
      network: "visa",
      cardTypes: {
        physical: true,
        virtual: true,
      },
      issuer: {
        id: "digital-commerce-bank",
        name: "Digital Commerce Bank",
        country: "CA",
      },
    },
    {
      defillamaSlug: "crypto-com",
      id: "crypto-com-australia-prepaid",
      name: "Crypto.com Prepaid — Australia-issued",
      network: "visa",
      cardTypes: {
        physical: true,
        virtual: true,
      },
      issuer: {
        id: "foris-gfs-australia",
        name: "Foris GFS Australia Pty Ltd",
        country: "AU",
      },
    },
    {
      defillamaSlug: "crypto-com",
      id: "crypto-com-singapore-prepaid",
      name: "Crypto.com Prepaid — Singapore",
      network: "visa",
      cardTypes: {
        physical: true,
        virtual: true,
      },
      issuer: {
        id: "foris-asia-pte-ltd",
        name: "Foris Asia Pte. Ltd.",
        country: "SG",
      },
    },
    {
      defillamaSlug: "crypto-com",
      id: "crypto-com-latin-america-prepaid",
      name: "Crypto.com Prepaid — Latin America",
      network: "visa",
      cardTypes: {
        physical: true,
        virtual: true,
      },
      issuer: {
        id: "foris-mt-limited",
        name: "Foris MT Limited",
        country: "MT",
      },
    },
    {
      defillamaSlug: "crypto-com",
      id: "crypto-com-gulf-cooperation-council-prepaid",
      name: "Crypto.com Prepaid — Bahrain / selected GCC markets",
      network: "visa",
      cardTypes: {
        physical: true,
        virtual: true,
      },
    },
    {
      id: "crypto-com-united-states-credit",
      name: "Crypto.com Credit — United States",
      network: "visa",
      issuer: {
        id: "comenity-capital-bank",
        name: "Comenity Capital Bank",
        country: "US",
      },
    },
  ],
} satisfies CardStaticData;
