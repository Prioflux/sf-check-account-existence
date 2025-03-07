import xior from "xior";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config();

// =======================================
// Configuration
// =======================================
const {
  SF_CLIENT_ID,
  SF_SECRET,
  SF_SCOPE,
  SILVERFIN_FIRM_ID,
  SF_AUTHORIZATION_CODE,
  SILVERFIN_TOKEN,
} = process.env;

// Validate environment variables
if (
  !SF_CLIENT_ID ||
  !SF_SECRET ||
  !SF_SCOPE ||
  !SILVERFIN_FIRM_ID ||
  !SF_AUTHORIZATION_CODE ||
  !SILVERFIN_TOKEN
) {
  const missingVars: string[] = [];
  if (!SF_CLIENT_ID) missingVars.push("SF_CLIENT_ID");
  if (!SF_SECRET) missingVars.push("SF_SECRET");
  if (!SF_SCOPE) missingVars.push("SF_SCOPE");
  if (!SILVERFIN_FIRM_ID) missingVars.push("SILVERFIN_FIRM_ID");
  if (!SF_AUTHORIZATION_CODE) missingVars.push("SF_AUTHORIZATION_CODE");
  if (!SILVERFIN_TOKEN) missingVars.push("SILVERFIN_TOKEN");

  console.error(
    `Missing required environment variables: ${missingVars.join(", ")}`
  );
  throw new Error("Missing required environment variables");
}

// The account number to check for existence
const accountNumberToCheck = "699999"; // Replace with the account number you want to check (e.g. "400000")

// API setup
const baseUrl = "https://live.getsilverfin.com";
const instance = xior.create({
  baseURL: `${baseUrl}/api/v4/f/${SILVERFIN_FIRM_ID}`,
  headers: {
    Authorization: `Bearer ${SILVERFIN_TOKEN}`,
    Accept: "application/json",
  },
});

// Interfaces
interface Company {
  id: string;
  name: string;
  file_code: string;
  hasAccount?: boolean;
}

interface Period {
  id: string;
  end_date: string;
  fiscal_year: {
    end_date: string;
  };
}

// Main function
async function main() {
  // Initialize variables for pagination
  let allCompanies: Company[] = [];
  let currentPage = 1;
  const perPage = 200;
  let hasMorePages = true;

  // Create stats object
  const stats = {
    processedCompanies: 0,
    totalCompanies: 0,
    companiesWithAccount: 0,
  };

  console.log("⏳ Fetching all companies in batches...");

  // Fetch all companies with pagination
  while (hasMorePages) {
    console.log(`⏳ Fetching companies page ${currentPage}...`);

    const companiesResponse = await instance.get("/companies", {
      params: {
        page: currentPage,
        per_page: perPage,
      },
    });

    const pageCompanies = companiesResponse.data;

    if (pageCompanies.length > 0) {
      allCompanies = [...allCompanies, ...pageCompanies];
      console.log(
        `✅ Fetched ${pageCompanies.length} companies from page ${currentPage}`
      );
      currentPage++;
    } else {
      hasMorePages = false;
      console.log("✅ All companies fetched successfully");
    }
  }

  const totalCompanies = allCompanies.length;
  stats.totalCompanies = totalCompanies;
  console.log(`⏳ Processing ${totalCompanies} companies in total...`);

  // Process companies in sequential batches
  const batchSize = 20;

  // Process companies in sequential batches instead of all at once
  for (let i = 0; i < allCompanies.length; i += batchSize) {
    const batch = allCompanies.slice(i, i + batchSize);
    console.log(
      `⏳ Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
        allCompanies.length / batchSize
      )} (companies ${i + 1}-${Math.min(i + batchSize, allCompanies.length)})`
    );

    // Process this batch in parallel
    const batchPromises = batch.map(async (company, batchIndex) => {
      const index = i + batchIndex;
      console.log(
        `⏳ [${index + 1}/${totalCompanies}] Processing company: ${
          company.name
        }`
      );

      try {
        // Initialize account pagination variables
        let hasAccount = false;
        let accountPage = 1;
        let hasMoreAccountPages = true;

        // Fetch all account pages until we find the account or run out of pages
        while (!hasAccount && hasMoreAccountPages) {
          // Check if the company has the account (with pagination)
          const accounts = await instance.get(
            `/companies/${company.id}/accounts`,
            {
              params: {
                page: accountPage,
                per_page: 200, // Fetch maximum allowed per page
              },
            }
          );
          const accountsData = accounts.data;

          // Check if the specific account exists on this page
          hasAccount = accountsData.some(
            (account) => account.number === accountNumberToCheck
          );

          // If we have accounts and didn't find the target account, check if we need to fetch more pages
          if (
            !hasAccount &&
            Array.isArray(accountsData) &&
            accountsData.length > 0
          ) {
            accountPage++;
          } else {
            // Either we found the account or there are no more pages
            hasMoreAccountPages = false;
          }
        }

        company.hasAccount = hasAccount;

        if (hasAccount) {
          stats.companiesWithAccount++;
          console.log(`✅ Company ${company.name} has the account`);
        } else {
          console.log(
            `❌ Company ${company.name} does not have the account (checked ${accountPage} pages)`
          );
        }
      } catch (error) {
        console.error(
          `Error processing company ${company.name}: ${error.message}`
        );
        company.hasAccount = false;
      }

      // Update progress after company is processed
      stats.processedCompanies++;
      console.log(
        `✔️ [${stats.processedCompanies}/${stats.totalCompanies}] Completed company: ${company.name}`
      );
    });

    // Wait for all promises in the batch to resolve
    await Promise.all(batchPromises);
  }

  // Generate CSV output
  generateCsvOutput(allCompanies);

  console.log(
    `✅ All processing complete: ${stats.processedCompanies}/${stats.totalCompanies} companies processed`
  );
  console.log(
    `📊 ${stats.companiesWithAccount} companies have the account ${accountNumberToCheck}`
  );
}

function generateCsvOutput(companies: Company[]) {
  // Create CSV header
  const csvHeader = "Dossiernaam,Dossiernummer,Rekening aanwezig?\n";

  // Create CSV content
  const csvContent = companies
    .map(
      (company) =>
        `"${company.name.replace(/"/g, '""')}",${company.file_code},${
          company.hasAccount ? "Ja" : "Nee"
        }`
    )
    .join("\n");

  // Create the full CSV
  const csv = csvHeader + csvContent;

  // Save to file
  const fileName = `company_accounts_check_${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  fs.writeFileSync(fileName, csv);

  console.log(`✅ CSV file generated: ${fileName}`);
}

// Execute the main function
main().catch((error) => {
  console.error("Error in main execution:", error);
  process.exit(1);
});
