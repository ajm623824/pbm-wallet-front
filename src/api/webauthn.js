export function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function bytesToBase64Url(value) {
  if (value == null) return null;
  const bytes = new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodeCreationOptions(options) {
  return {
    ...options,
    challenge: base64UrlToBytes(options.challenge),
    user: { ...options.user, id: base64UrlToBytes(options.user.id) },
    excludeCredentials: (options.excludeCredentials || []).map((credential) => ({
      ...credential,
      id: base64UrlToBytes(credential.id),
    })),
  };
}

export function decodeRequestOptions(options) {
  return {
    ...options,
    challenge: base64UrlToBytes(options.challenge),
    allowCredentials: (options.allowCredentials || []).map((credential) => ({
      ...credential,
      id: base64UrlToBytes(credential.id),
    })),
  };
}

export function serializeCredential(credential) {
  const response = credential.response;
  const serialized = {
    id: credential.id,
    rawId: bytesToBase64Url(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment || null,
    clientExtensionResults: credential.getClientExtensionResults(),
    response: {
      clientDataJSON: bytesToBase64Url(response.clientDataJSON),
    },
  };

  if ("attestationObject" in response) {
    serialized.response.attestationObject = bytesToBase64Url(response.attestationObject);
    serialized.response.transports = response.getTransports?.() || [];
  } else {
    serialized.response.authenticatorData = bytesToBase64Url(response.authenticatorData);
    serialized.response.signature = bytesToBase64Url(response.signature);
    serialized.response.userHandle = bytesToBase64Url(response.userHandle);
  }
  return serialized;
}
