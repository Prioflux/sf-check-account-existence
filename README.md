# Silverfin Account Checker

This utility script allows you to check for the existence of a specific account number across all companies in your Silverfin firm. It retrieves all companies, checks if they have the specified account number, and generates a CSV report with the results.

## Features

- Retrieves all companies from Silverfin with pagination
- Processes companies in batches to avoid overwhelming the API
- Checks for the existence of a specific account number across all companies
- Handles account pagination to ensure thorough checking
- Generates a CSV report with the results in Dutch

## Prerequisites

- Node.js
- pnpm
- Access to Silverfin API with proper permissions

## Setup

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Create a `.env` file in the root directory and add your Silverfin API credentials:

```bash
SILVERFIN_FIRM_ID=your_firm_id
SF_CLIENT_ID=your_client_id
SF_SECRET=your_secret
SF_SCOPE=your_scope
SF_AUTHORIZATION_CODE=your_authorazation_code_from_the_url
SILVERFIN_TOKEN=your_access_token_generated_from_the_endpoint
```

4. Modify the `accountNumberToCheck` variable in the script to target the specific account you're interested in:

```typescript
const accountNumberToCheck = "699999"; // Replace with the account number you want to check
```

5. Run the script:

```bash
npx tsx src/index.ts
```

## How It Works

1. The script fetches all companies using pagination
2. Companies are processed in batches of 20 to control concurrency
3. For each company, it checks all pages of accounts to see if the specified account number exists
4. It generates a CSV file with the following columns (in Dutch):
   - Dossiernaam (Company Name)
   - Dossiernummer (File Code)
   - Rekening aanwezig? (Account Present? - "Ja" or "Nee")

## Output

The script creates a CSV file named `company_accounts_check_YYYY-MM-DD.csv` in the project root directory, containing the results of the account check for all companies.

## Troubleshooting

If the script isn't working as expected:
- Check if your API token has the necessary permissions
- Verify that the account number you're looking for is formatted correctly
- Increase batch size or decrease it if you're experiencing rate limits
