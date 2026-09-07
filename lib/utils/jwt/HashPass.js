import {des_cbc, byteArray2Base64, byteArray2Hex, base64toByteArray} from "./DES.js"

const getByteCode = (c) => {
	if (c <32 || c >127) {
		throw "ID or Password character";
	}
	return (c - 32) << 1;
};

const standardCaharsToBinary = (s) => {
	const result = [];
	for (let i = 0; i < s.length; ++i) {
		result[i] = getByteCode(s.charCodeAt(i));
	}
	return result;
};

const asciiToBinary = (s) => {
	const result = [];
	for (let i = 0; i < s.length; ++i) {
		result[i] = s.charCodeAt(i);
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
	const mix = miks(standardCaharsToBinary(id), standardCaharsToBinary(password));
	let l = mix.length;
	let n = 8 - l % 8;
	n = n === 8 ? 0 : n;
	for (let i = 0; i < n; ++i) {
		mix[l++] = 0xFF;
	}
	const transmitKey = calcTransmitKey(terminalKey, clientTime);
	return byteArray2Base64(des_cbc(mix, transmitKey, true));
};

const generateMacFromBinary = (data, macKey) => {
	const enc = des_cbc(data, macKey,true);
	const mac = [];
	let j = 0;
	for (let i = enc.length - 8; i < enc.length; ++i) {
		mac[j++] = enc[i];
	}
	return byteArray2Base64(mac);
};

export const generateMac = (dataString, macKey) => {
	return generateMacFromBinary(asciiToBinary(dataString), macKey);
};

export const generateMacFromB64 = (dataB64, macKey) => {
	return generateMacFromBinary(base64toByteArray(dataB64), macKey);
};


// console.log(generateTerminalPassword(
// 	"0000007",
// 	"123456",
// 	new Date(2022, 1, 22, 21, 25, 14),
// 	[0x2C, 0x2C, 0x2C, 0x2C, 0x2C, 0x2C, 0x2C, 0x2C, ]
// 	)
// );

//[0x8C, 0xD3, 0x3B, 0xCD, 0x68, 0x85, 0x89, 0xE5]

//console.log(generateMac("100003702023-02-20 08:18:34", [0x8C, 0xD3, 0x3B, 0xCD, 0x68, 0x85, 0x89, 0xE5]));

// const b64 = "W3siZWxlbWVudCI6IkNvbnRhaW5lciIsInN0eWxlIjp7ImZsZXgiOjEsImhlaWdodCI6ODAwLCJib3JkZXJXaWR0aCI6MCwiYm9yZGVyQ29sb3IiOiIjOGZkNjQ5IiwicGFk" +
// 	"ZGluZyI6MTYsImJhY2tncm91bmRDb2xvciI6IiNjNGYwYmUiLCJhbGlnbkl0ZW1zIjoiY2VudGVyIiwianVzdGlmeUNvbnRlbnQiOiJzcGFjZS1iZXR3ZWVuIn0sImNoaWxk" +
// 	"cmVuIjpbeyJlbGVtZW50IjoiUG9zSGVhZGVyIiwic3R5bGUiOnsibWFyZ2luVG9wIjowfX0seyJlbGVtZW50IjoiUG9zVGltZSIsInN0eWxlIjp7ImJhY2tncm91bmRDb2xv" +
// 	"ciI6IiMyYWRmZmMiLCJtYXJnaW5Ub3AiOjIwfX0seyJlbGVtZW50IjoiSW5wdXRQcmljZSIsInN0eWxlIjp7Im1hcmdpblRvcCI6MTB9LCJwdXJzZUlkIjoieHh4X3B1cnNl" +
// 	"SWQiLCJwb3NJZCI6Inh4eF9wb3NJbmZvIiwicHJpY2UiOjEwMDAwMCwidW5pdCI6InRtbiIsImltYWdlIjoiYXZhdGFyX2ltYWdlIiwidGl0bGUiOiJwYXkifV19XQ==";
// console.log(generateMacFromB64(b64, [0xC4, 0x02, 0x1F, 0xB6, 0xDF, 0x7A, 0xA2, 0xAE,]));

//console.log(byteArray2Base64([0x30, 0xD2, 0xB8, 0xDF, 0x1C, 0x60, 0xD4, 0x92, ]));

//console.log(byteArray2Hex(des_cbc(base64toByteArray("MNK43xxg1JI="), [0x1C, 0x1C, 0x1C, 0x1C, 0x1C, 0x1C, 0x1C, 0x1C, ], false)));
