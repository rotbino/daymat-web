// initial permutation (split into left/right halves )
// since DES numbers bits starting at 1, we will ignore x[0]
const IP_perm = [-1,
    58, 50, 42, 34, 26, 18, 10, 2,
    60, 52, 44, 36, 28, 20, 12, 4,
    62, 54, 46, 38, 30, 22, 14, 6,
    64, 56, 48, 40, 32, 24, 16, 8,
    57, 49, 41, 33, 25, 17, 9, 1,
    59, 51, 43, 35, 27, 19, 11, 3,
    61, 53, 45, 37, 29, 21, 13, 5,
    63, 55, 47, 39, 31, 23, 15, 7];

// final permutation (inverse initial permutation)
const FP_perm = [-1,
    40, 8, 48, 16, 56, 24, 64, 32,
    39, 7, 47, 15, 55, 23, 63, 31,
    38, 6, 46, 14, 54, 22, 62, 30,
    37, 5, 45, 13, 53, 21, 61, 29,
    36, 4, 44, 12, 52, 20, 60, 28,
    35, 3, 43, 11, 51, 19, 59, 27,
    34, 2, 42, 10, 50, 18, 58, 26,
    33, 1, 41, 9, 49, 17, 57, 25];

// per-round expansion
const E_perm = [-1,
    32, 1, 2, 3, 4, 5,
    4, 5, 6, 7, 8, 9,
    8, 9, 10, 11, 12, 13,
    12, 13, 14, 15, 16, 17,
    16, 17, 18, 19, 20, 21,
    20, 21, 22, 23, 24, 25,
    24, 25, 26, 27, 28, 29,
    28, 29, 30, 31, 32, 1];

// per-round permutation
const P_perm = [-1,
    16, 7, 20, 21, 29, 12, 28, 17,
    1, 15, 23, 26, 5, 18, 31, 10,
    2, 8, 24, 14, 32, 27, 3, 9,
    19, 13, 30, 6, 22, 11, 4, 25];

// note we do use element 0 in the S-Boxes
const S1 = [14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7,
    0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8,
    4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0,
    15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13];
const S2 = [15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10,
    3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5,
    0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15,
    13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9];
const S3 = [10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8,
    13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1,
    13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7,
    1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12];
const S4 = [7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15,
    13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9,
    10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4,
    3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14];
const S5 = [2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9,
    14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6,
    4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14,
    11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3];
const S6 = [12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11,
    10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8,
    9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6,
    4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13];
const S7 = [4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1,
    13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6,
    1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2,
    6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12];
const S8 = [13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7,
    1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2,
    7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8,
    2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11];

//, first, key, permutation
const PC_1_perm = [-1,
    // C subkey bits
    57, 49, 41, 33, 25, 17, 9, 1, 58, 50, 42, 34, 26, 18,
    10, 2, 59, 51, 43, 35, 27, 19, 11, 3, 60, 52, 44, 36,
    // D subkey bits
    63, 55, 47, 39, 31, 23, 15, 7, 62, 54, 46, 38, 30, 22,
    14, 6, 61, 53, 45, 37, 29, 21, 13, 5, 28, 20, 12, 4];

//, per-round, key, selection, permutation
const PC_2_perm = [-1,
    14, 17, 11, 24, 1, 5, 3, 28, 15, 6, 21, 10,
    23, 19, 12, 4, 26, 8, 16, 7, 27, 20, 13, 2,
    41, 52, 31, 37, 47, 55, 30, 40, 51, 45, 33, 48,
    44, 49, 39, 56, 34, 53, 46, 42, 50, 36, 29, 32];

// split an integer into bits
// ary   = array to store bits in
// start = starting subscript
// bitc  = number of bits to convert
// val   = number to convert
const split_int = (ary, start, bitc, val) => {
    const i = start;
    let j;
    for (j = bitc - 1; j >= 0; j--) {
        // isolate low-order bit
        ary[i + j] = val & 1;
        // remove that bit
        val >>= 1;
    }
};

// copy bits in a permutation
//   dest = where to copy the bits to
//   src  = Where to copy the bits from
//   perm = The order to copy/permute the bits
// note: since DES ingores x[0], we do also
const permute = (dest, src, perm) => {
    let i;
    let fromloc;

    for (i = 1; i < perm.length; i++) {
        fromloc = perm[i];
        dest[i] = src[fromloc];
    }
};

// do an array XOR
// assume all array entries are 0 or 1
const xor = (a1, a2) => {
    let i;

    for (i = 1; i < a1.length; i++)
        a1[i] = a1[i] ^ a2[i];
};

// process one S-Box, return integer from S-Box
const do_S = (SBox, index, inbits) => {
    // collect the 6 bits into a single integer
    const S_index = inbits[index] * 32 + inbits[index + 5] * 16 +
        inbits[index + 1] * 8 + inbits[index + 2] * 4 +
        inbits[index + 3] * 2 + inbits[index + 4];

    // do lookup
    return SBox[S_index];
};

// do one round of DES encryption
const des_round = (L, R, KeyR) => {
    const E_result = new Array(49);
    const S_out = new Array(33);

    // copy the existing L bits, then set new L = old R
    const temp_L = new Array(33);
    for (let i = 0; i < 33; i++) {
        // copy exising L bits
        temp_L[i] = L[i];

        // set L = R
        L[i] = R[i];
    }

    // expand R using E permutation
    permute(E_result, R, E_perm);

    // exclusive-or with current key
    xor(E_result, KeyR);

    // put through the S-Boxes
    split_int(S_out, 1, 4, do_S(S1, 1, E_result));
    split_int(S_out, 5, 4, do_S(S2, 7, E_result));
    split_int(S_out, 9, 4, do_S(S3, 13, E_result));
    split_int(S_out, 13, 4, do_S(S4, 19, E_result));
    split_int(S_out, 17, 4, do_S(S5, 25, E_result));
    split_int(S_out, 21, 4, do_S(S6, 31, E_result));
    split_int(S_out, 25, 4, do_S(S7, 37, E_result));
    split_int(S_out, 29, 4, do_S(S8, 43, E_result));

    // do the P permutation
    permute(R, S_out, P_perm);

    // xor this with old L to get the new R
    xor(R, temp_L);
};

// shift the CD values left 1 bit
const shift_CD_1 = (CD) => {
    let i;

    // note we use [0] to hold the bit shifted around the end
    for (i = 0; i <= 55; i++)
        CD[i] = CD[i + 1];

    // shift D bit around end
    CD[56] = CD[28];
    // shift C bit around end
    CD[28] = CD[0];
};

// shift the CD values left 2 bits
const shift_CD_2 = (CD) => {
    let i;
    const C1 = CD[1];

    // note we use [0] to hold the bit shifted around the end
    for (i = 0; i <= 54; i++)
        CD[i] = CD[i + 2];

    // shift D bits around end
    CD[55] = CD[27];
    CD[56] = CD[28];
    // shift C bits around end
    CD[27] = C1;
    CD[28] = CD[0];
};


// do the actual DES encryption/decryption
const des_encrypt = (inData, Key, do_encrypt) => {
    const tempData = new Array(65);	// output bits
    const CD = new Array(57);		// halves of current key
    const KS = new Array(16);		// per-round key schedules
    const L = new Array(33);		// left half of current data
    const R = new Array(33);		// right half of current data
    const result = new Array(65);	// DES output
    let i;

    result[0] = 0;
    // do the initial key permutation
    permute(CD, Key, PC_1_perm);

    // create the subkeys
    for (i = 1; i <= 16; i++) {
        // create a new array for each round
        KS[i] = new Array(49);

        // how much should we shift C and D?
        if (i === 1 || i === 2 || i === 9 || i === 16)
            shift_CD_1(CD);
        else
            shift_CD_2(CD);

        // create the actual subkey
        permute(KS[i], CD, PC_2_perm);
    }

    // handle the initial permutation
    permute(tempData, inData, IP_perm);

    // split data into L/R parts
    for (i = 1; i <= 32; i++) {
        L[i] = tempData[i];
        R[i] = tempData[i + 32];
    }

    // encrypting or decrypting?
    if (do_encrypt) {
        // encrypting
        for (i = 1; i <= 16; i++) {
            des_round(L, R, KS[i]);
        }
    } else {
        // decrypting
        for (i = 16; i >= 1; i--) {
            des_round(L, R, KS[i]);
        }
    }

    // create the 64-bit preoutput block = R16/L16
    for (i = 1; i <= 32; i++) {
        // copy R bits into left half of block, L bits into right half
        tempData[i] = R[i];
        tempData[i + 32] = L[i];
    }

    // do final permutation and return result
    permute(result, tempData, FP_perm);
    return result;
};

const to_bitSet = (byteBlock) => {
    const bitSet = new Array(65);
    bitSet[0] = 0;
    for (let i = 0; i < 8; ++i) {
        let b = byteBlock[i];
        for (let j = 7; j >= 0; --j) {
            bitSet[i * 8 + j + 1] = b & 1;
            b >>= 1;
        }
    }
    return bitSet;
};

const to_byteBlock = (bitSet) => {
    const byteBlock = new Array(8);
    for (let i = 0; i < 8; ++i) {
        let s = 0;
        for (let j = 0; j < 8; ++j) {
            s <<= 1;
            s |= bitSet[i * 8 + j + 1];
        }
        byteBlock[i] = s;
    }
    return byteBlock;
};

const blokize = (byteArray) => {
    const n = 8 - byteArray.length % 8;
    if (n !== 8) {
        for (let i = 0; i < n; ++i) {
            byteArray.push(0xFF);
        }
    }
    return byteArray;
};

export const des_cbc = (plane, key, do_encrypt) => {
    if (key.length !== 8) {
        throw "Invalid Key Len";
    }
    const bsKey = to_bitSet(key);
    const block = new Array(8);
    let iv = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
    let i, j;
    blokize(plane);
    const result = new Array(plane.length);
    for (i = 0; i < plane.length; i += 8) {
        for (j = 0; j < 8; ++j) {
            block[j] = iv[j] ^ plane[i + j];
        }
        iv = to_byteBlock(des_encrypt(to_bitSet(block), bsKey, do_encrypt));
        for (j = 0; j < 8; ++j) {
            result[i + j] = iv[j];
        }
    }
    return result;
};

//////////////////////// Base 64 //////////////////////////////

const b64_CodeToChar = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
    'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
    'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
    'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f',
    'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
    'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
    'w', 'x', 'y', 'z', '0', '1', '2', '3',
    '4', '5', '6', '7', '8', '9', '+', '/'
];

const b64_OneBlockToString = (b0, b1, b2) => {
    let b64 = b64_CodeToChar[b0 >> 2];
    if (b1 == null) {
        return b64 + b64_CodeToChar[(b0 & 0x03) << 4] + "==";
    }
    b64 += b64_CodeToChar[((b0 & 0x03) << 4) | (b1 >> 4)];
    if (b2 == null) {
        return b64 + b64_CodeToChar[(b1 & 0x0F) << 2] + "=";
    }
    return b64 + b64_CodeToChar[((b1 & 0x0F) << 2 | (b2 >> 6))] + b64_CodeToChar[b2 & 0x3F];
};

export const byteArray2Base64 = (byteArray) => {
    let b0, b1, b2;
    let b64 = "";
    let i = 0;
    while (i < byteArray.length) {
        b0 = byteArray[i++];
        if (i < byteArray.length) {
            b1 = byteArray[i++];
            if (i < byteArray.length) {
                b2 = byteArray[i++];
            } else {
                b2 = null;
            }
        } else {
            b1 = null;
            b2 = null;
        }
        b64 += b64_OneBlockToString(b0, b1, b2);
    }
    return b64;
};
