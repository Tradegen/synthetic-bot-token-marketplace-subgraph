import { BigInt } from "@graphprotocol/graph-ts";
import {
  CreateListing as CreateListingEvent,
  RemoveListing as RemoveListingEvent,
  UpdatePrice as UpdatePriceEvent,
  UpdateQuantity as UpdateQuantityEvent,
  Purchase as PurchaseEvent,
  User,
  Transaction,
  Listing,
  Marketplace
} from "../types/schema";
import {
  CreatedListing,
  RemovedListing,
  UpdatedPrice,
  UpdatedQuantity,
  Purchased
} from "../types/Marketplace/Marketplace";
import {
  updateMarketplaceDayData,
} from "./dayUpdates";
import {
  fetchPositionID,
  fetchBotTokenAddress,
  MARKETPLACE_ADDRESS,
  ONE_BI,
  ZERO_BD,
  ZERO_BI
} from "./helpers";

export function handleCreateListing(event: CreatedListing): void {
    // update global values
    let marketplace = Marketplace.load(MARKETPLACE_ADDRESS);
    if (marketplace === null) {
      marketplace = new Marketplace(MARKETPLACE_ADDRESS);
      marketplace.listingCount = 0;
      marketplace.totalVolumeUSD = ZERO_BD;
      marketplace.totalTokensSold = ZERO_BI;
      marketplace.txCount = ZERO_BI;
    }
    marketplace.listingCount = marketplace.listingCount + 1;
    marketplace.txCount = marketplace.txCount.plus(ONE_BI);
    marketplace.save();

    // create the user
    let user = User.load(event.params.seller.toHexString());
    if (user === null)
    {
        user = new User(event.params.seller.toHexString());
        user.numberOfTokensSold = ZERO_BI;
        user.tradingVolumeUSD = ZERO_BD;
    }
    user.save();

    // create the listing
    let listing = new Listing(event.params.marketplaceListingIndex.toString());
    listing.exists = true;
    listing.seller = user.id;
    listing.botTokenAddress = event.params.botToken.toHexString();
    listing.positionID = event.params.ID;
    listing.numberOfTokens = event.params.numberOfTokens;
    listing.tokenPrice = event.params.price;
    listing.save();
    
    let transaction = new Transaction(event.transaction.hash.toHexString());
    transaction.blockNumber = event.block.number;
    transaction.timestamp = event.block.timestamp;
    transaction.user = user.id;
    transaction.botTokenAddress = event.params.botToken.toHexString();
    transaction.save();
    
    // update CreateListing event
    let create = new CreateListingEvent(event.transaction.hash.toHexString().concat("-createListing"));
    create.transaction = transaction.id;
    create.timestamp = transaction.timestamp;
    create.seller = event.params.seller.toHexString();
    create.botTokenAddress = event.params.botToken.toHexString();
    create.positionID = event.params.ID;
    create.numberOfTokens = event.params.numberOfTokens;
    create.tokenPrice = event.params.price;
    create.index = event.params.marketplaceListingIndex;
    create.save();
    
    // update the transaction
    transaction.createListing = create.id;
    transaction.save();
    
    // update day entities
    let marketplaceDayData = updateMarketplaceDayData(event);
}

export function handleRemoveListing(event: RemovedListing): void {
     // update global values
     let marketplace = Marketplace.load(MARKETPLACE_ADDRESS);
     if (marketplace === null) {
       marketplace = new Marketplace(MARKETPLACE_ADDRESS);
       marketplace.listingCount = 0;
       marketplace.totalVolumeUSD = ZERO_BD;
       marketplace.totalTokensSold = ZERO_BI;
       marketplace.txCount = ZERO_BI;
     }
     marketplace.listingCount = (marketplace.listingCount == 0) ? 0 : marketplace.listingCount - 1;
     marketplace.txCount = marketplace.txCount.plus(ONE_BI);
     marketplace.save();
 
     // create the user
     let user = User.load(event.params.seller.toHexString());
     if (user === null)
     {
         user = new User(event.params.seller.toHexString());
         user.numberOfTokensSold = ZERO_BI;
         user.tradingVolumeUSD = ZERO_BD;
     }
     user.save();
 
     // update the listing
     let listing = Listing.load(event.params.marketplaceListingIndex.toString());
     if (listing)
     {
      listing.exists = false;
      listing.seller = user.id;
      listing.numberOfTokens = ZERO_BI;
      listing.tokenPrice = ZERO_BI;
      listing.save();
     }
     
     let transaction = new Transaction(event.transaction.hash.toHexString());
     transaction.blockNumber = event.block.number;
     transaction.timestamp = event.block.timestamp;
     transaction.user = user.id;
     transaction.botTokenAddress = fetchBotTokenAddress(event.params.marketplaceListingIndex).toHexString();
     transaction.save();
     
     // update RemoveListing event
     let remove = new RemoveListingEvent(event.transaction.hash.toHexString().concat("-removeListing"));
     remove.transaction = transaction.id;
     remove.timestamp = transaction.timestamp;
     remove.seller = event.params.seller.toHexString();
     remove.botTokenAddress = fetchBotTokenAddress(event.params.marketplaceListingIndex).toHexString();
     remove.index = event.params.marketplaceListingIndex;
     remove.save();
     
     // update the transaction
     transaction.removeListing = remove.id;
     transaction.save();
     
     // update day entities
     let marketplaceDayData = updateMarketplaceDayData(event);
}

export function handleUpdatePrice(event: UpdatedPrice): void {
    // update global values
    let marketplace = Marketplace.load(MARKETPLACE_ADDRESS);
    if (marketplace === null) {
      marketplace = new Marketplace(MARKETPLACE_ADDRESS);
      marketplace.listingCount = 0;
      marketplace.totalVolumeUSD = ZERO_BD;
      marketplace.totalTokensSold = ZERO_BI;
      marketplace.txCount = ZERO_BI;
    }
    marketplace.txCount = marketplace.txCount.plus(ONE_BI);
    marketplace.save();

    // create the user
    let user = User.load(event.params.seller.toHexString());
    if (user === null)
    {
        user = new User(event.params.seller.toHexString());
        user.numberOfTokensSold = ZERO_BI;
        user.tradingVolumeUSD = ZERO_BD;
    }
    user.save();

    // update the listing
    let listing = Listing.load(event.params.marketplaceListingIndex.toString());
    if (listing)
    {
      listing.tokenPrice = event.params.newPrice;
      listing.save();
    }
    
    let transaction = new Transaction(event.transaction.hash.toHexString());
    transaction.blockNumber = event.block.number;
    transaction.timestamp = event.block.timestamp;
    transaction.user = user.id;
    transaction.botTokenAddress = fetchBotTokenAddress(event.params.marketplaceListingIndex).toHexString();
    transaction.save();
    
    // update UpdatePrice event
    let updatePrice = new UpdatePriceEvent(event.transaction.hash.toHexString().concat("-updatePrice"));
    updatePrice.transaction = transaction.id;
    updatePrice.timestamp = transaction.timestamp;
    updatePrice.seller = event.params.seller.toHexString();
    updatePrice.botTokenAddress = fetchBotTokenAddress(event.params.marketplaceListingIndex).toHexString();
    updatePrice.index = event.params.marketplaceListingIndex;
    updatePrice.newTokenPrice = event.params.newPrice;
    updatePrice.save();
    
    // update the transaction
    transaction.updatePrice = updatePrice.id;
    transaction.save();
    
    // update day entities
    let marketplaceDayData = updateMarketplaceDayData(event);
}

export function handleUpdatedQuantity(event: UpdatedQuantity): void {
  // update global values
  let marketplace = Marketplace.load(MARKETPLACE_ADDRESS);
  if (marketplace === null) {
    marketplace = new Marketplace(MARKETPLACE_ADDRESS);
    marketplace.listingCount = 0;
    marketplace.totalVolumeUSD = ZERO_BD;
    marketplace.totalTokensSold = ZERO_BI;
    marketplace.txCount = ZERO_BI;
  }
  marketplace.txCount = marketplace.txCount.plus(ONE_BI);
  marketplace.save();

  // create the user
  let user = User.load(event.params.seller.toHexString());
  if (user === null)
  {
      user = new User(event.params.seller.toHexString());
      user.numberOfTokensSold = ZERO_BI;
      user.tradingVolumeUSD = ZERO_BD;
  }
  user.save();

  // update the listing
  let listing = Listing.load(event.params.marketplaceListingIndex.toString());
  if (listing)
  {
    listing.numberOfTokens = event.params.newQuantity;
    listing.save();
  }
  
  let transaction = new Transaction(event.transaction.hash.toHexString());
  transaction.blockNumber = event.block.number;
  transaction.timestamp = event.block.timestamp;
  transaction.user = user.id;
  transaction.botTokenAddress = fetchBotTokenAddress(event.params.marketplaceListingIndex).toHexString();
  transaction.save();
  
  // update UpdateQuantity event
  let updateQuantity = new UpdateQuantityEvent(event.transaction.hash.toHexString().concat("-updateQuantity"));
  updateQuantity.transaction = transaction.id;
  updateQuantity.timestamp = transaction.timestamp;
  updateQuantity.seller = event.params.seller.toHexString();
  updateQuantity.botTokenAddress = fetchBotTokenAddress(event.params.marketplaceListingIndex).toHexString();
  updateQuantity.index = event.params.marketplaceListingIndex;
  updateQuantity.newQuantity = event.params.newQuantity;
  updateQuantity.save();
  
  // update the transaction
  transaction.updateQuantity = updateQuantity.id;
  transaction.save();
  
  // update day entities
  let marketplaceDayData = updateMarketplaceDayData(event);
}

export function handlePurchase(event: Purchased): void {
  let USDAmount = event.params.numberOfTokens.times(event.params.price).div(BigInt.fromString("1000000000000000000"))
  let positionID = fetchPositionID(event.params.marketplaceListingIndex);

  // update global values
  let marketplace = Marketplace.load(MARKETPLACE_ADDRESS);
  if (marketplace === null) {
    marketplace = new Marketplace(MARKETPLACE_ADDRESS);
    marketplace.listingCount = 0;
    marketplace.totalVolumeUSD = ZERO_BD;
    marketplace.totalTokensSold = ZERO_BI;
    marketplace.txCount = ZERO_BI;
  }
  marketplace.txCount = marketplace.txCount.plus(ONE_BI);
  marketplace.totalVolumeUSD = marketplace.totalVolumeUSD.plus(USDAmount.toBigDecimal());
  marketplace.totalTokensSold = marketplace.totalTokensSold.plus(event.params.numberOfTokens);
  marketplace.save();

  // create the user
  let user = User.load(event.params.buyer.toHexString());
  if (user === null)
  {
      user = new User(event.params.buyer.toHexString());
      user.numberOfTokensSold = ZERO_BI;
      user.tradingVolumeUSD = ZERO_BD;
  }
  user.tradingVolumeUSD = user.tradingVolumeUSD.plus(USDAmount.toBigDecimal())
  user.save();

  // update the listing
  let listing = Listing.load(event.params.marketplaceListingIndex.toString());
  if (listing)
  {
    let newNumberOfTokens = (event.params.numberOfTokens >= listing.numberOfTokens) ? ZERO_BI : listing.numberOfTokens.minus(event.params.numberOfTokens);
    listing.numberOfTokens = newNumberOfTokens;
    listing.save();
  }
  
  let transaction = new Transaction(event.transaction.hash.toHexString());
  transaction.blockNumber = event.block.number;
  transaction.timestamp = event.block.timestamp;
  transaction.user = user.id;
  transaction.botTokenAddress = event.params.botToken.toHexString();
  transaction.save();
  
  // update Purchase event
  let purchase = new PurchaseEvent(event.transaction.hash.toHexString().concat("-purchase"));
  purchase.transaction = transaction.id;
  purchase.timestamp = transaction.timestamp;
  purchase.buyer = event.params.buyer.toHexString();
  purchase.botTokenAddress = event.params.botToken.toHexString();
  purchase.index = event.params.marketplaceListingIndex;
  purchase.numberOfTokens = event.params.numberOfTokens;
  purchase.tokenPrice = event.params.price;
  purchase.positionID = positionID;
  purchase.save();
  
  // update the transaction
  transaction.purchase = purchase.id;
  transaction.save();
  
  // update day entities
  let marketplaceDayData = updateMarketplaceDayData(event);
  marketplaceDayData.dailyNumberOfTokensSold = marketplaceDayData.dailyNumberOfTokensSold.plus(event.params.numberOfTokens);
  marketplaceDayData.dailyVolumeUSD = marketplaceDayData.dailyVolumeUSD.plus(USDAmount.toBigDecimal());
  marketplaceDayData.save();
}