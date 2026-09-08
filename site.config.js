// single source of truth for company facts and site-wide values
export const siteConfig = {
  siteUrl: 'https://concision.io',
  siteName: 'Concision',
  contactEmail: 'hello@concision.io',
  company: {
    legalName: 'Concision Ltd',
    tradingName: 'Concision',
    number: '14129925',
    foundingDate: '2022-05-25',
    foundingYear: '2022',
    registeredIn: 'England and Wales',
    baseCity: 'Leeds',
    registeredOffice: {
      line1: '71-75 Shelton Street',
      line2: 'Covent Garden',
      city: 'London',
      postcode: 'WC2H 9JQ',
      country: 'United Kingdom',
    },
  },
  products: {
    nudge: {
      name: 'Nudge',
      url: 'https://nudgesupport.com',
    },
    spends: {
      name: 'Spends',
    },
  },
};
