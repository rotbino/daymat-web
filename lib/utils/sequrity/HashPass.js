import {byteArray2Base64, des_cbc} from "./DES.js"

const getByteCode = (c) => {
    if (c < 32 || c > 127) {
        throw "ID or Password character";
    }
    return (c - 32) << 1;
};

const toBinary = (s) => {
    const result = [];
    for (let i = 0; i < s.length; ++i) {
        result[i] = getByteCode(s.charCodeAt(i));
    }
    return result;
};

const miks = (left, right) => {
    let i = 0, l = 0;
    const result = [];
    while (i < left.length && i < right.length) {
        result[l++] = left[i];
        result[l++] = right[i];
        i++;
    }
    while (i < left.length) {
        result[l++] = left[i++];
    }
    while (i < right.length) {
        result[l++] = right[i++];
    }
    return result;
};

const calcTransmitKey = (key, clientTime) => {
    const transmitKey = [];
    transmitKey[0] = clientTime.getSeconds() ^ key[0];
    transmitKey[1] = (clientTime.getFullYear() % 100) ^ key[1];
    transmitKey[2] = clientTime.getHours() ^ key[2];
    transmitKey[3] = clientTime.getSeconds() ^ key[3];
    transmitKey[4] = clientTime.getDate() ^ key[4];
    transmitKey[5] = (clientTime.getMonth() + 1) ^ key[5];
    transmitKey[6] = clientTime.getMinutes() ^ key[6];
    transmitKey[7] = clientTime.getDate() ^ key[7];
    return transmitKey;
};

export const generateTerminalPassword = (id, password, clientTime, terminalKey) => {
    const mix = miks(toBinary(id), toBinary(password));
    let l = mix.length;
    let n = 8 - l % 8;
    n = n === 8 ? 0 : n;
    for (let i = 0; i < n; ++i) {
        mix[l++] = 0xFF;
    }
    const transmitKey = calcTransmitKey(terminalKey, clientTime);
    return byteArray2Base64(des_cbc(mix, transmitKey, true));
};

console.log(generateTerminalPassword(
    "UserId",
    "Password",
    new Date(2021, 0, 28, 11, 53, 17),
    [0x1C, 0x1C, 0x1C, 0x1C, 0x1C, 0x1C, 0x1C, 0x1C])
);
