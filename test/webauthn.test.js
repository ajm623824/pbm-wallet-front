import test from "node:test";
import assert from "node:assert/strict";
import { buildSiweMessage } from "../src/api/siwe.js";
import { base64UrlToBytes, bytesToBase64Url, decodeRequestOptions, serializeCredential } from "../src/api/webauthn.js";

test("SIWE message matches the strict backend field contract", () => {
  const issuedAt = new Date("2026-08-13T00:00:00.000Z");
  const message = buildSiweMessage({
    wallet: "0x1111111111111111111111111111111111111111",
    nonce: "single-use-nonce",
    domain: "localhost",
    uri: "http://localhost",
    chainId: 84532,
    issuedAt,
  });
  assert.match(message, /^localhost wants you to sign in with your Ethereum account:\n0x1{40}/);
  assert.match(message, /\nURI: http:\/\/localhost\nVersion: 1\nChain ID: 84532\nNonce: single-use-nonce\n/);
  assert.match(message, /Issued At: 2026-08-13T00:00:00\.000Z\nExpiration Time: 2026-08-13T00:05:00\.000Z$/);
});

test("base64url conversion round-trips binary values", () => {
  const bytes = Uint8Array.from([0, 1, 2, 127, 128, 254, 255]);
  assert.deepEqual(base64UrlToBytes(bytesToBase64Url(bytes)), bytes);
});

test("request options decode server challenge and credential ids", () => {
  const decoded = decodeRequestOptions({ challenge: "AQID", allowCredentials: [{ id: "BAUG", type: "public-key" }] });
  assert.deepEqual([...decoded.challenge], [1, 2, 3]);
  assert.deepEqual([...decoded.allowCredentials[0].id], [4, 5, 6]);
});

test("assertion serialization contains only JSON-safe base64url data", () => {
  const credential = {
    id: "credential-id", rawId: Uint8Array.from([1, 2]).buffer, type: "public-key", authenticatorAttachment: "platform",
    getClientExtensionResults: () => ({ credProps: { rk: true } }),
    response: {
      clientDataJSON: Uint8Array.from([3]).buffer, authenticatorData: Uint8Array.from([4]).buffer,
      signature: Uint8Array.from([5]).buffer, userHandle: null,
    },
  };
  assert.deepEqual(serializeCredential(credential), {
    id: "credential-id", rawId: "AQI", type: "public-key", authenticatorAttachment: "platform",
    clientExtensionResults: { credProps: { rk: true } },
    response: { clientDataJSON: "Aw", authenticatorData: "BA", signature: "BQ", userHandle: null },
  });
});
