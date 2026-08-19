import {byteArray2Base64, base64toByteArray} from './DES.js';
import {sign} from './HMac256.js';

//const utf8enc = new TextEncoder();
//const utf8dec = new TextDecoder();

import * as encoding from 'text-encoding';

const utf8enc = new encoding.TextEncoder();
const utf8dec = new encoding.TextDecoder();

const toB64Url = b64 => {
  let b64Url = '';
  let c;
  for (let i = 0; i < b64.length; ++i) {
    c = b64.charAt(i);
    if (c === '+') {
      c = '-';
    } else if (c === '/') {
      c = '_';
    } else if (c === '=') {
      break;
    }
    b64Url += c;
  }
  return b64Url;
};

const fromB64Url = b64Url => {
  let b64 = '';
  let c;
  for (let i = 0; i < b64Url.length; ++i) {
    c = b64Url.charAt(i);
    if (c === '-') {
      c = '+';
    } else if (c === '_') {
      c = '/';
    }
    b64 += c;
  }
  let l = b64.length % 4;
  if (l === 3) {
    b64 += '=';
  } else if (l === 2) {
    b64 += '==';
  } else if (l === 1) {
    return null;
  }
  return b64;
};

const encode = obj => {
  return toB64Url(byteArray2Base64(utf8enc.encode(JSON.stringify(obj))));
};

const decode = b64Url => {
  return JSON.parse(
    utf8dec.decode(new Uint8Array(base64toByteArray(fromB64Url(b64Url)))),
  );
};

export const generateJWT = (iss, sub, aud, expAfter, secret) => {
  const n = new Date();
  const nowUtc =
    Date.UTC(
      n.getFullYear(),
      n.getMonth(),
      n.getDate(),
      n.getHours(),
      n.getMinutes(),
      n.getSeconds(),
    ) / 1000;
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  const payload = {
    sub: sub,
    aud: [aud],
    iat: nowUtc,
    exp: nowUtc + expAfter,
    iss: iss,
  };
  let t = encode(header) + '.' + encode(payload);
  let s = toB64Url(byteArray2Base64(sign(secret, t)));
  t += '.' + s;
  return t;
};

export const decodeJWT = jwt => {
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    return null;
  }
  return decode(parts[1]);
};

/*const tok = generateJWT(
  '2C49D9E34A76F7D0',
  'Refresh',
  'anymarket.cytechnology.ir',
  30,
  '044CAD5D893BAE1A37BACE1A4F5E6229',
);
console.log(tok);
const pl = decodeJWT(tok);
console.log(pl);*/
