# Silverfin Bulk PDF Export

This utility script allows you to generate and download PDF exports in bulk from your Silverfin firm. It retrieves all companies and generates a specified PDF export for the most recent and previous fiscal year end periods.

## Features

- Retrieves all companies from Silverfin with pagination
- Processes companies in batches to avoid overwhelming the API
- Checks if a company has a specific account
- Generates the list of companies with a column that indicates if they have the account or not in a CSV file

## Prerequisites

- Node.js
- pnpm
- Access to Silverfin API with proper permissions
- Export Style ID from Silverfin

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

4. Run the script:

```bash
npx ts-node src/index.ts
```

## How It Works

1. The script fetches all companies using pagination
2. Companies are processed in batches to control concurrency
3. For each company, it finds:
   - The accounts of the company and checks if a specific account is present
4. It generates a CSV file with the list of companies and a column that indicates if they have the account or not

## Output

The script creates a CSV file with the list of companies and a column that indicates if they have the account or not


## Troubleshooting

If the CSV file isn't generating:
- Check if your export template ID is correct
- Verify your API token has the necessary permissions
