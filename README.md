# Synthetic Trading Bot Token Marketplace Subgraph

This subgraph dynamically tracks the sale of synthetic trading bot tokens in the bot token marketplace, as part of our [synthetic trading bot protocol](https://github.com/Tradegen/synthetic-trading-bots).

- aggregated data across listings and transactions,
- data on individual listings,
- data on individual transactions,
- data on each user's listings, transactions, sales, and volume,
- historical data on marketplace volume and transaction count

## Running Locally

Make sure to update package.json settings to point to your own graph account.

## Queries

Below are a few ways to show how to query the [synthetic-bot-token-marketplace subgraph](https://thegraph.com/hosted-service/subgraph/tradegen/synthetic-bot-token-marketplace) for data. The queries show most of the information that is queryable, but there are many other filtering options that can be used, just check out the [querying api](https://thegraph.com/docs/graphql-api). These queries can be used locally or in The Graph Explorer playground.

## Key Entity Overviews

#### Marketplace

Contains aggregated data across all listings and sales. This entity tracks the total number of listings, total volume (in USD), total number of tokens sold, and the total number of transactions.

#### Listing

Contains data on a specific marketplace listing. Each listing is linked to a User entity.

#### User

Contains data on a specific user. This entity tracks a user's total number of tokens sold, total trading volume (in USD), associated listings, and associated transactions.

#### Transaction

Tracks a specific transaction's block number, timestamp, associated User entity, and bot token address for the transaction's marketplace listing. Each Transaction entity also contains a reference to exactly one subtype (CreateListing, RemoveListing, UpdatePrice, UpdateQuantity, or Purchase entity).

## Example Queries

### Querying Aggregated Data

This query fetches aggredated data from all marketplace listings, to give a view into how much activity is happening on the marketplace.

```graphql
{
  marketplaces(first: 1) {
    listingCount
    totalVolumeUSD
    totalTokensSold
    txCount
  }
}
```
