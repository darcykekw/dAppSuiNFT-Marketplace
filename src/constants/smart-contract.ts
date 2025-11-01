export const CONTRACT_PACKAGE_ID = import.meta.env.VITE_CONTRACT_PACKAGE_ID || "0x23afd63a5cd674ed90e24b8c69da3fdc2996d97dfea470c1d5e301fc655fe179";
export const CONTRACT_MODULE_NAME = import.meta.env.VITE_CONTRACT_MODULE_NAME || "nft_marketplace";
export const CONTRACT_MARKETPLACE_ID = import.meta.env.VITE_CONTRACT_MARKETPLACE_ID || "0x6bc5e931c750fccaf577559fd46d02859eac5f3dcf459282ca41038392f5e1e6";
export const ADMIN_ADDRESS = import.meta.env.VITE_ADMIN_ADDRESS || "0xc835ecbb489cdfd4dd4dc80608a8ca5cab4df5b8c545ebe549f173aa9ce1e3a7";

export const MINT_NFT_METHOD = "mint_to_sender";
export const LIST_NFT_METHOD = "list_nft_for_sale";
export const BUY_NFT_METHOD = "buy_nft";
export const BURN_NFT_METHOD = "burn_nft";
export const CANCEL_LISTING_METHOD = "cancel_listing";
export const UPDATE_NFT_DESCRIPTION_METHOD = "update_nft_description";
export const WITHDRAW_MARKETPLACE_FEES_METHOD = "withdraw_marketplace_fees";
export const LISTING_STRUCT_TYPE = `${CONTRACT_PACKAGE_ID}::${CONTRACT_MODULE_NAME}::Listing`;
