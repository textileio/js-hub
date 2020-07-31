import nacl from 'tweetnacl'
import { convertPublicKey, convertSecretKey } from 'ed2curve'
import multibase from 'multibase'
import { Private, Public } from './identity'
import { encodePublicKey, encodePrivateKey, KeyType, decodePrivateKey, decodePublicKey } from './proto.keys'

const nonceBytes = 24 // Length of nacl nonce
const privateKeyBytes = 32
const publicKeyBytes = 32 // Length of nacl ephemeral public key

export class PublicKey implements Public {
  constructor(public pubKey: Uint8Array, public type: string = 'ed25519') {
    if (type !== 'ed25519') {
      throw new Error('Invalid keys type')
    }
    this.type = type || 'ed25519'
  }
  /**
   * Verifies if `signature` for `data` is valid.
   * @param data Signed data
   * @param signature Signature
   */
  async verify(data: Uint8Array, signature: Uint8Array) {
    return nacl.sign.detached.verify(data, signature, this.pubKey)
  }

  toString(): string {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return publicKeyToString(this)
  }

  get bytes(): Uint8Array {
    return encodePublicKey({
      Type: KeyType.Ed25519,
      Data: this.pubKey,
    })
  }

  encrypt(data: Uint8Array): Promise<Uint8Array> {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return encrypt(data, this.pubKey, this.type)
  }
}

export class PrivateKey implements Private {
  pubKey: Uint8Array
  seed: Uint8Array
  privKey: Uint8Array
  /**
   * Constructor
   * @param secretKey Raw secret key (32-byte secret seed in ed25519`)
   * @param type Public-key signature system name. (currently only `ed25519` keys are supported)
   */
  constructor(secretKey: Uint8Array, public type: string = 'ed25519') {
    if (type !== 'ed25519') {
      throw new Error('Invalid keys type')
    }
    this.type = type || 'ed25519'
    const secret = Uint8Array.from(secretKey)
    if (secret.length !== 32) {
      throw new Error('secretKey length is invalid')
    }
    const naclKeys = nacl.sign.keyPair.fromSeed(secret)
    this.seed = secret
    this.privKey = naclKeys.secretKey
    this.pubKey = naclKeys.publicKey
  }

  /**
   * Returns `true` if this `Keypair` object contains secret key and can sign.
   */
  canSign(): boolean {
    return !!this.privKey
  }

  /**
   * Signs data.
   * @param data Data to sign
   */
  async sign(data: Uint8Array): Promise<Uint8Array> {
    if (!this.canSign()) {
      throw new Error('cannot sign: no secret key available')
    }
    return nacl.sign.detached(data, this.privKey)
  }

  get public(): PublicKey {
    return new PublicKey(this.pubKey)
  }

  get bytes(): Uint8Array {
    return encodePrivateKey({
      Type: KeyType.Ed25519,
      Data: this.privKey,
    })
  }

  /**
   * Creates a new `Keypair` object from ed25519 secret key seed raw bytes.
   *
   * @param rawSeed Raw 32-byte ed25519 secret key seed
   */
  static fromRawEd25519Seed(rawSeed: Uint8Array): PrivateKey {
    return new this(rawSeed, 'ed25519')
  }
  /**
   * Create a random `PrivateKey` object.
   */
  static fromRandom(): PrivateKey {
    const secret = nacl.randomBytes(32)
    return this.fromRawEd25519Seed(secret)
  }

  toString(): string {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return privateKeyToString(this)
  }

  static fromString(str: string): PrivateKey {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return privateKeyFromString(str)
  }

  decrypt(ciphertext: Uint8Array): Promise<Uint8Array> {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return decrypt(ciphertext, this.privKey, this.type)
  }
}

/**
 * Decrypts the given `data` using a Curve25519 'variant' of the private key.
 *
 * Assumes ciphertext includes ephemeral public key and nonce used in original encryption
 * (e.g., via `encrypt`).
 *
 * @note See https://github.com/dchest/ed2curve-js for conversion details.
 * @param ciphertext Data to decrypt
 */
export async function decrypt(ciphertext: Uint8Array, privKey: Uint8Array, type = 'ed25519'): Promise<Uint8Array> {
  if (type !== 'ed25519') {
    throw Error(`'${type}' type keys are not currently supported`)
  }
  const pk = convertSecretKey(privKey)
  if (!pk) {
    throw Error('could not convert key type')
  }
  const nonce = ciphertext.slice(0, nonceBytes)
  const ephemeral = ciphertext.slice(nonceBytes, nonceBytes + publicKeyBytes)
  const ct = ciphertext.slice(nonceBytes + publicKeyBytes)
  const plaintext = nacl.box.open(ct, nonce, ephemeral, pk)
  if (!plaintext) {
    throw Error('failed to decrypt curve25519')
  }
  return Uint8Array.from(plaintext)
}

/**
 * Encrypts the given `data` using a Curve25519 'variant' of the public key.
 *
 * The encryption uses an ephemeral private key, which is prepended to the ciphertext,
 * along with a nonce of random bytes.
 *
 * @note See https://github.com/dchest/ed2curve-js for conversion details.
 * @param data Data to encrypt
 */
export async function encrypt(data: Uint8Array, pubKey: Uint8Array, type = 'ed25519'): Promise<Uint8Array> {
  if (type !== 'ed25519') {
    throw Error(`'${type}' type keys are not currently supported`)
  }
  // generated ephemeral key pair
  const ephemeral = nacl.box.keyPair()
  // convert recipient's key into curve25519 (assumes ed25519 keys)
  const pk = convertPublicKey(pubKey)
  if (!pk) {
    throw Error('could not convert key type')
  }
  // encrypt with nacl
  const nonce = nacl.randomBytes(24)
  const ciphertext = nacl.box(data, nonce, pk, ephemeral.secretKey)
  const merged = new Uint8Array(nonceBytes + publicKeyBytes + ciphertext.byteLength)
  // prepend nonce
  merged.set(new Uint8Array(nonce), 0)
  // then ephemeral public key
  merged.set(new Uint8Array(ephemeral.publicKey), nonceBytes)
  // then cipher text
  merged.set(new Uint8Array(ciphertext), nonceBytes + publicKeyBytes)
  return Uint8Array.from(merged)
}

export function publicKeyToString(key: PublicKey): string {
  const encoded = multibase.encode('base32', key.bytes as Buffer)
  return new TextDecoder().decode(encoded)
}

export function publicKeyFromString(str: string) {
  const decoded = multibase.decode(str)
  const obj = decodePublicKey(decoded)
  const bytes = obj.Data
  const keyBytes = bytes.slice(0, publicKeyBytes)
  return new PublicKey(keyBytes, 'ed25519')
}

export function privateKeyToString(key: PrivateKey) {
  const encoded = multibase.encode('base32', key.bytes as Buffer)
  return new TextDecoder().decode(encoded)
}

export function privateKeyFromString(str: string) {
  const decoded = multibase.decode(str)
  const obj = decodePrivateKey(decoded)
  const bytes = obj.Data
  // We might have the public key bytes appended twice, but we can ignore the extra public
  // bytes on the end (no need to check it either)
  const keyBytes = bytes.slice(0, privateKeyBytes)
  return new PrivateKey(keyBytes, 'ed25519')
}
