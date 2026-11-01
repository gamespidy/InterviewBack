const axios = require('axios');
const Company = require('../models/Company');

// Enriched verified directory of popular tech companies for instant accurate auto-fill
const PRESET_COMPANIES = [
  {
    name: 'Google',
    domain: 'google.com',
    website: 'https://google.com',
    logo: 'https://logo.clearbit.com/google.com',
    industry: 'Technology & Internet',
    location: 'Mountain View, California, USA / Bengaluru, India',
    linkedinUrl: 'https://linkedin.com/company/google',
    description: 'Leading multinational technology company specializing in search engine technology, cloud computing, software, and hardware.'
  },
  {
    name: 'Microsoft',
    domain: 'microsoft.com',
    website: 'https://microsoft.com',
    logo: 'https://logo.clearbit.com/microsoft.com',
    industry: 'Software & Cloud',
    location: 'Redmond, Washington, USA / Hyderabad, India',
    linkedinUrl: 'https://linkedin.com/company/microsoft',
    description: 'Global tech titan developing computer software, consumer electronics, personal computers, and cloud services (Azure).'
  },
  {
    name: 'Amazon',
    domain: 'amazon.com',
    website: 'https://amazon.com',
    logo: 'https://logo.clearbit.com/amazon.com',
    industry: 'E-commerce & Cloud Computing',
    location: 'Seattle, Washington, USA / Hyderabad, India',
    linkedinUrl: 'https://linkedin.com/company/amazon',
    description: 'Multinational technology company focusing on e-commerce, cloud computing (AWS), online streaming, and artificial intelligence.'
  },
  {
    name: 'Meta',
    domain: 'meta.com',
    website: 'https://meta.com',
    logo: 'https://logo.clearbit.com/meta.com',
    industry: 'Social Media & Virtual Reality',
    location: 'Menlo Park, California, USA',
    linkedinUrl: 'https://linkedin.com/company/meta',
    description: 'Builds technologies that help people connect, find communities, and grow businesses across Facebook, Instagram, and WhatsApp.'
  },
  {
    name: 'Apple',
    domain: 'apple.com',
    website: 'https://apple.com',
    logo: 'https://logo.clearbit.com/apple.com',
    industry: 'Consumer Electronics & Software',
    location: 'Cupertino, California, USA / Hyderabad, India',
    linkedinUrl: 'https://linkedin.com/company/apple',
    description: 'Designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories.'
  },
  {
    name: 'Netflix',
    domain: 'netflix.com',
    website: 'https://netflix.com',
    logo: 'https://logo.clearbit.com/netflix.com',
    industry: 'Entertainment & Streaming Media',
    location: 'Los Gatos, California, USA / Mumbai, India',
    linkedinUrl: 'https://linkedin.com/company/netflix',
    description: 'World leading streaming entertainment service with paid memberships in over 190 countries.'
  },
  {
    name: 'Zoho',
    domain: 'zoho.com',
    website: 'https://zoho.com',
    logo: 'https://logo.clearbit.com/zoho.com',
    industry: 'Enterprise Software & SaaS',
    location: 'Chennai, Tamil Nadu, India / Austin, Texas',
    linkedinUrl: 'https://linkedin.com/company/zoho',
    description: 'Indian multinational technology company that makes computer software and web-based business tools (Zoho Suite).'
  },
  {
    name: 'Freshworks',
    domain: 'freshworks.com',
    website: 'https://freshworks.com',
    logo: 'https://logo.clearbit.com/freshworks.com',
    industry: 'SaaS & Customer Engagement',
    location: 'San Mateo, California, USA / Chennai, India',
    linkedinUrl: 'https://linkedin.com/company/freshworks-inc',
    description: 'Creates innovative business software helping companies delight their customers and employees.'
  },
  {
    name: 'TCS (Tata Consultancy Services)',
    domain: 'tcs.com',
    website: 'https://tcs.com',
    logo: 'https://logo.clearbit.com/tcs.com',
    industry: 'IT Services & Consulting',
    location: 'Mumbai, Maharashtra, India',
    linkedinUrl: 'https://linkedin.com/company/tata-consultancy-services',
    description: 'Global leader in IT services, consulting & business solutions partnering with world largest businesses.'
  },
  {
    name: 'Infosys',
    domain: 'infosys.com',
    website: 'https://infosys.com',
    logo: 'https://logo.clearbit.com/infosys.com',
    industry: 'IT Services & Digital Transformation',
    location: 'Bengaluru, Karnataka, India',
    linkedinUrl: 'https://linkedin.com/company/infosys',
    description: 'Global leader in next-generation digital services and consulting helping clients navigate digital transformation.'
  },
  {
    name: 'Swiggy',
    domain: 'swiggy.com',
    website: 'https://swiggy.com',
    logo: 'https://logo.clearbit.com/swiggy.com',
    industry: 'Food Delivery & Quick Commerce',
    location: 'Bengaluru, Karnataka, India',
    linkedinUrl: 'https://linkedin.com/company/swiggy-in',
    description: 'Leading on-demand food ordering and delivery convenience platform in India.'
  },
  {
    name: 'Zomato',
    domain: 'zomato.com',
    website: 'https://zomato.com',
    logo: 'https://logo.clearbit.com/zomato.com',
    industry: 'Food Tech & Quick Commerce',
    location: 'Gurugram, Haryana, India',
    linkedinUrl: 'https://linkedin.com/company/zomato',
    description: 'Indian multinational restaurant aggregator and food delivery company.'
  },
  {
    name: 'Razorpay',
    domain: 'razorpay.com',
    website: 'https://razorpay.com',
    logo: 'https://logo.clearbit.com/razorpay.com',
    industry: 'FinTech & Payments',
    location: 'Bengaluru, Karnataka, India',
    linkedinUrl: 'https://linkedin.com/company/razorpay',
    description: 'Payments platform powering businesses to accept, process and disburse payments seamlessly.'
  },
  {
    name: 'Flipkart',
    domain: 'flipkart.com',
    website: 'https://flipkart.com',
    logo: 'https://logo.clearbit.com/flipkart.com',
    industry: 'E-commerce',
    location: 'Bengaluru, Karnataka, India',
    linkedinUrl: 'https://linkedin.com/company/flipkart',
    description: 'One of India leading e-commerce marketplaces offering millions of products.'
  },
  {
    name: 'Stripe',
    domain: 'stripe.com',
    website: 'https://stripe.com',
    logo: 'https://logo.clearbit.com/stripe.com',
    industry: 'Financial Infrastructure & Software',
    location: 'San Francisco, California, USA',
    linkedinUrl: 'https://linkedin.com/company/stripe',
    description: 'Financial infrastructure platform for the internet used by millions of businesses.'
  },
  {
    name: 'OpenAI',
    domain: 'openai.com',
    website: 'https://openai.com',
    logo: 'https://logo.clearbit.com/openai.com',
    industry: 'Artificial Intelligence & Research',
    location: 'San Francisco, California, USA',
    linkedinUrl: 'https://linkedin.com/company/openai',
    description: 'AI research and deployment company behind ChatGPT and state-of-the-art AI systems.'
  },
  {
    name: 'Uber',
    domain: 'uber.com',
    website: 'https://uber.com',
    logo: 'https://logo.clearbit.com/uber.com',
    industry: 'Transportation & Mobility',
    location: 'San Francisco, California, USA / Hyderabad, India',
    linkedinUrl: 'https://linkedin.com/company/uber-com',
    description: 'Global mobility platform connecting riders, drivers, couriers, and restaurants.'
  },
  {
    name: 'Atlassian',
    domain: 'atlassian.com',
    website: 'https://atlassian.com',
    logo: 'https://logo.clearbit.com/atlassian.com',
    industry: 'Collaboration Software',
    location: 'Sydney, Australia / Bengaluru, India',
    linkedinUrl: 'https://linkedin.com/company/atlassian',
    description: 'Provider of collaboration, development, and issue tracking software for teams (Jira, Confluence, Trello).'
  },
  {
    name: 'Adobe',
    domain: 'adobe.com',
    website: 'https://adobe.com',
    logo: 'https://logo.clearbit.com/adobe.com',
    industry: 'Computer Software & Creative Tech',
    location: 'San Jose, California, USA / Noida, India',
    linkedinUrl: 'https://linkedin.com/company/adobe',
    description: 'Leader in digital media and digital marketing solutions (Photoshop, Acrobat, Creative Cloud).'
  },
  {
    name: 'Salesforce',
    domain: 'salesforce.com',
    website: 'https://salesforce.com',
    logo: 'https://logo.clearbit.com/salesforce',
    industry: 'CRM & Cloud Enterprise Software',
    location: 'San Francisco, California, USA / Hyderabad, India',
    linkedinUrl: 'https://linkedin.com/company/salesforce',
    description: 'Global leader in customer relationship management (CRM) software and enterprise cloud solutions.'
  }
];

class CompanyService {
  /**
   * Search companies with local DB cache first, then free public autocomplete, and save new hits.
   */
  static async searchCompany(query) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const cleanQuery = query.trim();
    const regex = new RegExp(cleanQuery, 'i');

    // 1. Search cached DB companies
    let cached = await Company.find({
      $or: [{ name: regex }, { domain: regex }, { industry: regex }]
    }).limit(10).lean();

    // 2. Search preset list to enrich DB if not found
    const presetMatches = PRESET_COMPANIES.filter(
      p => p.name.toLowerCase().includes(cleanQuery.toLowerCase()) ||
           p.domain.toLowerCase().includes(cleanQuery.toLowerCase())
    );

    for (const match of presetMatches) {
      const exists = cached.find(c => c.name.toLowerCase() === match.name.toLowerCase());
      if (!exists) {
        // Save to DB cache
        try {
          const saved = await Company.create({
            ...match,
            source: 'verified-catalog'
          });
          cached.push(saved.toObject());
        } catch (e) {
          cached.push(match);
        }
      }
    }

    // 3. If still less than 3 results, query free Clearbit Autocomplete API
    if (cached.length < 3) {
      try {
        const response = await axios.get(
          `https://autocomplete.clearbit.com/v1/companies?query=${encodeURIComponent(cleanQuery)}`,
          { timeout: 3000 }
        );

        if (Array.isArray(response.data)) {
          for (const item of response.data.slice(0, 5)) {
            const alreadyInCached = cached.some(
              c => c.name.toLowerCase() === item.name.toLowerCase() ||
                   c.domain.toLowerCase() === item.domain.toLowerCase()
            );

            if (!alreadyInCached && item.name) {
              const cleanDomain = item.domain || `${cleanQuery.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
              const newCompanyData = {
                name: item.name,
                domain: cleanDomain,
                website: `https://${cleanDomain}`,
                logo: item.logo || `https://logo.clearbit.com/${cleanDomain}`,
                industry: 'Technology',
                location: 'Global',
                linkedinUrl: `https://linkedin.com/company/${cleanDomain.split('.')[0]}`,
                description: `${item.name} is a global company.`,
                source: 'clearbit-autocomplete'
              };

              try {
                const created = await Company.create(newCompanyData);
                cached.push(created.toObject());
              } catch (dbErr) {
                cached.push(newCompanyData);
              }
            }
          }
        }
      } catch (apiErr) {
        // Clearbit unavailable or offline - proceed with whatever matches we have
        console.log('[CompanyService] Clearbit API unavailable, continuing with local results.');
      }
    }

    // Deduplicate by normalized name
    const uniqueMap = new Map();
    cached.forEach(c => {
      const key = c.name.toLowerCase();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, c);
      }
    });

    return Array.from(uniqueMap.values());
  }

  /**
   * Seed preset companies into MongoDB
   */
  static async seedPresetCompanies() {
    try {
      const count = await Company.countDocuments();
      if (count === 0) {
        await Company.insertMany(PRESET_COMPANIES.map(c => ({ ...c, source: 'seed' })));
        console.log(`[CompanyService] Successfully seeded ${PRESET_COMPANIES.length} verified companies.`);
      }
    } catch (err) {
      console.error('[CompanyService] Error seeding preset companies:', err.message);
    }
  }
}

module.exports = CompanyService;
