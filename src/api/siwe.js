export function buildSiweMessage({ wallet, nonce, domain, uri, chainId, issuedAt = new Date(), expirationTime }) {
  const expires = expirationTime || new Date(issuedAt.getTime() + 5 * 60_000);
  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    wallet,
    "",
    "Sign in to PBM Wallet.",
    "",
    `URI: ${uri}`,
    "Version: 1",
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt.toISOString()}`,
    `Expiration Time: ${expires.toISOString()}`,
  ].join("\n");
}
