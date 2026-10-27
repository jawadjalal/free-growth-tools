(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/qrcode/lib/can-promise.js
  var require_can_promise = __commonJS({
    "node_modules/qrcode/lib/can-promise.js"(exports, module) {
      module.exports = function() {
        return typeof Promise === "function" && Promise.prototype && Promise.prototype.then;
      };
    }
  });

  // node_modules/qrcode/lib/core/utils.js
  var require_utils = __commonJS({
    "node_modules/qrcode/lib/core/utils.js"(exports) {
      var toSJISFunction;
      var CODEWORDS_COUNT = [
        0,
        // Not used
        26,
        44,
        70,
        100,
        134,
        172,
        196,
        242,
        292,
        346,
        404,
        466,
        532,
        581,
        655,
        733,
        815,
        901,
        991,
        1085,
        1156,
        1258,
        1364,
        1474,
        1588,
        1706,
        1828,
        1921,
        2051,
        2185,
        2323,
        2465,
        2611,
        2761,
        2876,
        3034,
        3196,
        3362,
        3532,
        3706
      ];
      exports.getSymbolSize = function getSymbolSize(version) {
        if (!version) throw new Error('"version" cannot be null or undefined');
        if (version < 1 || version > 40) throw new Error('"version" should be in range from 1 to 40');
        return version * 4 + 17;
      };
      exports.getSymbolTotalCodewords = function getSymbolTotalCodewords(version) {
        return CODEWORDS_COUNT[version];
      };
      exports.getBCHDigit = function(data) {
        let digit = 0;
        while (data !== 0) {
          digit++;
          data >>>= 1;
        }
        return digit;
      };
      exports.setToSJISFunction = function setToSJISFunction(f) {
        if (typeof f !== "function") {
          throw new Error('"toSJISFunc" is not a valid function.');
        }
        toSJISFunction = f;
      };
      exports.isKanjiModeEnabled = function() {
        return typeof toSJISFunction !== "undefined";
      };
      exports.toSJIS = function toSJIS(kanji) {
        return toSJISFunction(kanji);
      };
    }
  });

  // node_modules/qrcode/lib/core/error-correction-level.js
  var require_error_correction_level = __commonJS({
    "node_modules/qrcode/lib/core/error-correction-level.js"(exports) {
      exports.L = { bit: 1 };
      exports.M = { bit: 0 };
      exports.Q = { bit: 3 };
      exports.H = { bit: 2 };
      function fromString(string) {
        if (typeof string !== "string") {
          throw new Error("Param is not a string");
        }
        const lcStr = string.toLowerCase();
        switch (lcStr) {
          case "l":
          case "low":
            return exports.L;
          case "m":
          case "medium":
            return exports.M;
          case "q":
          case "quartile":
            return exports.Q;
          case "h":
          case "high":
            return exports.H;
          default:
            throw new Error("Unknown EC Level: " + string);
        }
      }
      exports.isValid = function isValid(level) {
        return level && typeof level.bit !== "undefined" && level.bit >= 0 && level.bit < 4;
      };
      exports.from = function from(value, defaultValue) {
        if (exports.isValid(value)) {
          return value;
        }
        try {
          return fromString(value);
        } catch (e) {
          return defaultValue;
        }
      };
    }
  });

  // node_modules/qrcode/lib/core/bit-buffer.js
  var require_bit_buffer = __commonJS({
    "node_modules/qrcode/lib/core/bit-buffer.js"(exports, module) {
      function BitBuffer() {
        this.buffer = [];
        this.length = 0;
      }
      BitBuffer.prototype = {
        get: function(index) {
          const bufIndex = Math.floor(index / 8);
          return (this.buffer[bufIndex] >>> 7 - index % 8 & 1) === 1;
        },
        put: function(num, length) {
          for (let i = 0; i < length; i++) {
            this.putBit((num >>> length - i - 1 & 1) === 1);
          }
        },
        getLengthInBits: function() {
          return this.length;
        },
        putBit: function(bit) {
          const bufIndex = Math.floor(this.length / 8);
          if (this.buffer.length <= bufIndex) {
            this.buffer.push(0);
          }
          if (bit) {
            this.buffer[bufIndex] |= 128 >>> this.length % 8;
          }
          this.length++;
        }
      };
      module.exports = BitBuffer;
    }
  });

  // node_modules/qrcode/lib/core/bit-matrix.js
  var require_bit_matrix = __commonJS({
    "node_modules/qrcode/lib/core/bit-matrix.js"(exports, module) {
      function BitMatrix(size) {
        if (!size || size < 1) {
          throw new Error("BitMatrix size must be defined and greater than 0");
        }
        this.size = size;
        this.data = new Uint8Array(size * size);
        this.reservedBit = new Uint8Array(size * size);
      }
      BitMatrix.prototype.set = function(row, col, value, reserved) {
        const index = row * this.size + col;
        this.data[index] = value;
        if (reserved) this.reservedBit[index] = true;
      };
      BitMatrix.prototype.get = function(row, col) {
        return this.data[row * this.size + col];
      };
      BitMatrix.prototype.xor = function(row, col, value) {
        this.data[row * this.size + col] ^= value;
      };
      BitMatrix.prototype.isReserved = function(row, col) {
        return this.reservedBit[row * this.size + col];
      };
      module.exports = BitMatrix;
    }
  });

  // node_modules/qrcode/lib/core/alignment-pattern.js
  var require_alignment_pattern = __commonJS({
    "node_modules/qrcode/lib/core/alignment-pattern.js"(exports) {
      var getSymbolSize = require_utils().getSymbolSize;
      exports.getRowColCoords = function getRowColCoords(version) {
        if (version === 1) return [];
        const posCount = Math.floor(version / 7) + 2;
        const size = getSymbolSize(version);
        const intervals = size === 145 ? 26 : Math.ceil((size - 13) / (2 * posCount - 2)) * 2;
        const positions = [size - 7];
        for (let i = 1; i < posCount - 1; i++) {
          positions[i] = positions[i - 1] - intervals;
        }
        positions.push(6);
        return positions.reverse();
      };
      exports.getPositions = function getPositions(version) {
        const coords = [];
        const pos = exports.getRowColCoords(version);
        const posLength = pos.length;
        for (let i = 0; i < posLength; i++) {
          for (let j = 0; j < posLength; j++) {
            if (i === 0 && j === 0 || // top-left
            i === 0 && j === posLength - 1 || // bottom-left
            i === posLength - 1 && j === 0) {
              continue;
            }
            coords.push([pos[i], pos[j]]);
          }
        }
        return coords;
      };
    }
  });

  // node_modules/qrcode/lib/core/finder-pattern.js
  var require_finder_pattern = __commonJS({
    "node_modules/qrcode/lib/core/finder-pattern.js"(exports) {
      var getSymbolSize = require_utils().getSymbolSize;
      var FINDER_PATTERN_SIZE = 7;
      exports.getPositions = function getPositions(version) {
        const size = getSymbolSize(version);
        return [
          // top-left
          [0, 0],
          // top-right
          [size - FINDER_PATTERN_SIZE, 0],
          // bottom-left
          [0, size - FINDER_PATTERN_SIZE]
        ];
      };
    }
  });

  // node_modules/qrcode/lib/core/mask-pattern.js
  var require_mask_pattern = __commonJS({
    "node_modules/qrcode/lib/core/mask-pattern.js"(exports) {
      exports.Patterns = {
        PATTERN000: 0,
        PATTERN001: 1,
        PATTERN010: 2,
        PATTERN011: 3,
        PATTERN100: 4,
        PATTERN101: 5,
        PATTERN110: 6,
        PATTERN111: 7
      };
      var PenaltyScores = {
        N1: 3,
        N2: 3,
        N3: 40,
        N4: 10
      };
      exports.isValid = function isValid(mask) {
        return mask != null && mask !== "" && !isNaN(mask) && mask >= 0 && mask <= 7;
      };
      exports.from = function from(value) {
        return exports.isValid(value) ? parseInt(value, 10) : void 0;
      };
      exports.getPenaltyN1 = function getPenaltyN1(data) {
        const size = data.size;
        let points = 0;
        let sameCountCol = 0;
        let sameCountRow = 0;
        let lastCol = null;
        let lastRow = null;
        for (let row = 0; row < size; row++) {
          sameCountCol = sameCountRow = 0;
          lastCol = lastRow = null;
          for (let col = 0; col < size; col++) {
            let module2 = data.get(row, col);
            if (module2 === lastCol) {
              sameCountCol++;
            } else {
              if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5);
              lastCol = module2;
              sameCountCol = 1;
            }
            module2 = data.get(col, row);
            if (module2 === lastRow) {
              sameCountRow++;
            } else {
              if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5);
              lastRow = module2;
              sameCountRow = 1;
            }
          }
          if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5);
          if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5);
        }
        return points;
      };
      exports.getPenaltyN2 = function getPenaltyN2(data) {
        const size = data.size;
        let points = 0;
        for (let row = 0; row < size - 1; row++) {
          for (let col = 0; col < size - 1; col++) {
            const last = data.get(row, col) + data.get(row, col + 1) + data.get(row + 1, col) + data.get(row + 1, col + 1);
            if (last === 4 || last === 0) points++;
          }
        }
        return points * PenaltyScores.N2;
      };
      exports.getPenaltyN3 = function getPenaltyN3(data) {
        const size = data.size;
        let points = 0;
        let bitsCol = 0;
        let bitsRow = 0;
        for (let row = 0; row < size; row++) {
          bitsCol = bitsRow = 0;
          for (let col = 0; col < size; col++) {
            bitsCol = bitsCol << 1 & 2047 | data.get(row, col);
            if (col >= 10 && (bitsCol === 1488 || bitsCol === 93)) points++;
            bitsRow = bitsRow << 1 & 2047 | data.get(col, row);
            if (col >= 10 && (bitsRow === 1488 || bitsRow === 93)) points++;
          }
        }
        return points * PenaltyScores.N3;
      };
      exports.getPenaltyN4 = function getPenaltyN4(data) {
        let darkCount = 0;
        const modulesCount = data.data.length;
        for (let i = 0; i < modulesCount; i++) darkCount += data.data[i];
        const k = Math.abs(Math.ceil(darkCount * 100 / modulesCount / 5) - 10);
        return k * PenaltyScores.N4;
      };
      function getMaskAt(maskPattern, i, j) {
        switch (maskPattern) {
          case exports.Patterns.PATTERN000:
            return (i + j) % 2 === 0;
          case exports.Patterns.PATTERN001:
            return i % 2 === 0;
          case exports.Patterns.PATTERN010:
            return j % 3 === 0;
          case exports.Patterns.PATTERN011:
            return (i + j) % 3 === 0;
          case exports.Patterns.PATTERN100:
            return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
          case exports.Patterns.PATTERN101:
            return i * j % 2 + i * j % 3 === 0;
          case exports.Patterns.PATTERN110:
            return (i * j % 2 + i * j % 3) % 2 === 0;
          case exports.Patterns.PATTERN111:
            return (i * j % 3 + (i + j) % 2) % 2 === 0;
          default:
            throw new Error("bad maskPattern:" + maskPattern);
        }
      }
      exports.applyMask = function applyMask(pattern, data) {
        const size = data.size;
        for (let col = 0; col < size; col++) {
          for (let row = 0; row < size; row++) {
            if (data.isReserved(row, col)) continue;
            data.xor(row, col, getMaskAt(pattern, row, col));
          }
        }
      };
      exports.getBestMask = function getBestMask(data, setupFormatFunc) {
        const numPatterns = Object.keys(exports.Patterns).length;
        let bestPattern = 0;
        let lowerPenalty = Infinity;
        for (let p = 0; p < numPatterns; p++) {
          setupFormatFunc(p);
          exports.applyMask(p, data);
          const penalty = exports.getPenaltyN1(data) + exports.getPenaltyN2(data) + exports.getPenaltyN3(data) + exports.getPenaltyN4(data);
          exports.applyMask(p, data);
          if (penalty < lowerPenalty) {
            lowerPenalty = penalty;
            bestPattern = p;
          }
        }
        return bestPattern;
      };
    }
  });

  // node_modules/qrcode/lib/core/error-correction-code.js
  var require_error_correction_code = __commonJS({
    "node_modules/qrcode/lib/core/error-correction-code.js"(exports) {
      var ECLevel = require_error_correction_level();
      var EC_BLOCKS_TABLE = [
        // L  M  Q  H
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        2,
        2,
        1,
        2,
        2,
        4,
        1,
        2,
        4,
        4,
        2,
        4,
        4,
        4,
        2,
        4,
        6,
        5,
        2,
        4,
        6,
        6,
        2,
        5,
        8,
        8,
        4,
        5,
        8,
        8,
        4,
        5,
        8,
        11,
        4,
        8,
        10,
        11,
        4,
        9,
        12,
        16,
        4,
        9,
        16,
        16,
        6,
        10,
        12,
        18,
        6,
        10,
        17,
        16,
        6,
        11,
        16,
        19,
        6,
        13,
        18,
        21,
        7,
        14,
        21,
        25,
        8,
        16,
        20,
        25,
        8,
        17,
        23,
        25,
        9,
        17,
        23,
        34,
        9,
        18,
        25,
        30,
        10,
        20,
        27,
        32,
        12,
        21,
        29,
        35,
        12,
        23,
        34,
        37,
        12,
        25,
        34,
        40,
        13,
        26,
        35,
        42,
        14,
        28,
        38,
        45,
        15,
        29,
        40,
        48,
        16,
        31,
        43,
        51,
        17,
        33,
        45,
        54,
        18,
        35,
        48,
        57,
        19,
        37,
        51,
        60,
        19,
        38,
        53,
        63,
        20,
        40,
        56,
        66,
        21,
        43,
        59,
        70,
        22,
        45,
        62,
        74,
        24,
        47,
        65,
        77,
        25,
        49,
        68,
        81
      ];
      var EC_CODEWORDS_TABLE = [
        // L  M  Q  H
        7,
        10,
        13,
        17,
        10,
        16,
        22,
        28,
        15,
        26,
        36,
        44,
        20,
        36,
        52,
        64,
        26,
        48,
        72,
        88,
        36,
        64,
        96,
        112,
        40,
        72,
        108,
        130,
        48,
        88,
        132,
        156,
        60,
        110,
        160,
        192,
        72,
        130,
        192,
        224,
        80,
        150,
        224,
        264,
        96,
        176,
        260,
        308,
        104,
        198,
        288,
        352,
        120,
        216,
        320,
        384,
        132,
        240,
        360,
        432,
        144,
        280,
        408,
        480,
        168,
        308,
        448,
        532,
        180,
        338,
        504,
        588,
        196,
        364,
        546,
        650,
        224,
        416,
        600,
        700,
        224,
        442,
        644,
        750,
        252,
        476,
        690,
        816,
        270,
        504,
        750,
        900,
        300,
        560,
        810,
        960,
        312,
        588,
        870,
        1050,
        336,
        644,
        952,
        1110,
        360,
        700,
        1020,
        1200,
        390,
        728,
        1050,
        1260,
        420,
        784,
        1140,
        1350,
        450,
        812,
        1200,
        1440,
        480,
        868,
        1290,
        1530,
        510,
        924,
        1350,
        1620,
        540,
        980,
        1440,
        1710,
        570,
        1036,
        1530,
        1800,
        570,
        1064,
        1590,
        1890,
        600,
        1120,
        1680,
        1980,
        630,
        1204,
        1770,
        2100,
        660,
        1260,
        1860,
        2220,
        720,
        1316,
        1950,
        2310,
        750,
        1372,
        2040,
        2430
      ];
      exports.getBlocksCount = function getBlocksCount(version, errorCorrectionLevel) {
        switch (errorCorrectionLevel) {
          case ECLevel.L:
            return EC_BLOCKS_TABLE[(version - 1) * 4 + 0];
          case ECLevel.M:
            return EC_BLOCKS_TABLE[(version - 1) * 4 + 1];
          case ECLevel.Q:
            return EC_BLOCKS_TABLE[(version - 1) * 4 + 2];
          case ECLevel.H:
            return EC_BLOCKS_TABLE[(version - 1) * 4 + 3];
          default:
            return void 0;
        }
      };
      exports.getTotalCodewordsCount = function getTotalCodewordsCount(version, errorCorrectionLevel) {
        switch (errorCorrectionLevel) {
          case ECLevel.L:
            return EC_CODEWORDS_TABLE[(version - 1) * 4 + 0];
          case ECLevel.M:
            return EC_CODEWORDS_TABLE[(version - 1) * 4 + 1];
          case ECLevel.Q:
            return EC_CODEWORDS_TABLE[(version - 1) * 4 + 2];
          case ECLevel.H:
            return EC_CODEWORDS_TABLE[(version - 1) * 4 + 3];
          default:
            return void 0;
        }
      };
    }
  });

  // node_modules/qrcode/lib/core/galois-field.js
  var require_galois_field = __commonJS({
    "node_modules/qrcode/lib/core/galois-field.js"(exports) {
      var EXP_TABLE = new Uint8Array(512);
      var LOG_TABLE = new Uint8Array(256);
      (function initTables() {
        let x = 1;
        for (let i = 0; i < 255; i++) {
          EXP_TABLE[i] = x;
          LOG_TABLE[x] = i;
          x <<= 1;
          if (x & 256) {
            x ^= 285;
          }
        }
        for (let i = 255; i < 512; i++) {
          EXP_TABLE[i] = EXP_TABLE[i - 255];
        }
      })();
      exports.log = function log(n) {
        if (n < 1) throw new Error("log(" + n + ")");
        return LOG_TABLE[n];
      };
      exports.exp = function exp(n) {
        return EXP_TABLE[n];
      };
      exports.mul = function mul(x, y) {
        if (x === 0 || y === 0) return 0;
        return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
      };
    }
  });

  // node_modules/qrcode/lib/core/polynomial.js
  var require_polynomial = __commonJS({
    "node_modules/qrcode/lib/core/polynomial.js"(exports) {
      var GF = require_galois_field();
      exports.mul = function mul(p1, p2) {
        const coeff = new Uint8Array(p1.length + p2.length - 1);
        for (let i = 0; i < p1.length; i++) {
          for (let j = 0; j < p2.length; j++) {
            coeff[i + j] ^= GF.mul(p1[i], p2[j]);
          }
        }
        return coeff;
      };
      exports.mod = function mod(divident, divisor) {
        let result = new Uint8Array(divident);
        while (result.length - divisor.length >= 0) {
          const coeff = result[0];
          for (let i = 0; i < divisor.length; i++) {
            result[i] ^= GF.mul(divisor[i], coeff);
          }
          let offset = 0;
          while (offset < result.length && result[offset] === 0) offset++;
          result = result.slice(offset);
        }
        return result;
      };
      exports.generateECPolynomial = function generateECPolynomial(degree) {
        let poly = new Uint8Array([1]);
        for (let i = 0; i < degree; i++) {
          poly = exports.mul(poly, new Uint8Array([1, GF.exp(i)]));
        }
        return poly;
      };
    }
  });

  // node_modules/qrcode/lib/core/reed-solomon-encoder.js
  var require_reed_solomon_encoder = __commonJS({
    "node_modules/qrcode/lib/core/reed-solomon-encoder.js"(exports, module) {
      var Polynomial = require_polynomial();
      function ReedSolomonEncoder(degree) {
        this.genPoly = void 0;
        this.degree = degree;
        if (this.degree) this.initialize(this.degree);
      }
      ReedSolomonEncoder.prototype.initialize = function initialize(degree) {
        this.degree = degree;
        this.genPoly = Polynomial.generateECPolynomial(this.degree);
      };
      ReedSolomonEncoder.prototype.encode = function encode(data) {
        if (!this.genPoly) {
          throw new Error("Encoder not initialized");
        }
        const paddedData = new Uint8Array(data.length + this.degree);
        paddedData.set(data);
        const remainder = Polynomial.mod(paddedData, this.genPoly);
        const start = this.degree - remainder.length;
        if (start > 0) {
          const buff = new Uint8Array(this.degree);
          buff.set(remainder, start);
          return buff;
        }
        return remainder;
      };
      module.exports = ReedSolomonEncoder;
    }
  });

  // node_modules/qrcode/lib/core/version-check.js
  var require_version_check = __commonJS({
    "node_modules/qrcode/lib/core/version-check.js"(exports) {
      exports.isValid = function isValid(version) {
        return !isNaN(version) && version >= 1 && version <= 40;
      };
    }
  });

  // node_modules/qrcode/lib/core/regex.js
  var require_regex = __commonJS({
    "node_modules/qrcode/lib/core/regex.js"(exports) {
      var numeric = "[0-9]+";
      var alphanumeric = "[A-Z $%*+\\-./:]+";
      var kanji = "(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";
      kanji = kanji.replace(/u/g, "\\u");
      var byte = "(?:(?![A-Z0-9 $%*+\\-./:]|" + kanji + ")(?:.|[\r\n]))+";
      exports.KANJI = new RegExp(kanji, "g");
      exports.BYTE_KANJI = new RegExp("[^A-Z0-9 $%*+\\-./:]+", "g");
      exports.BYTE = new RegExp(byte, "g");
      exports.NUMERIC = new RegExp(numeric, "g");
      exports.ALPHANUMERIC = new RegExp(alphanumeric, "g");
      var TEST_KANJI = new RegExp("^" + kanji + "$");
      var TEST_NUMERIC = new RegExp("^" + numeric + "$");
      var TEST_ALPHANUMERIC = new RegExp("^[A-Z0-9 $%*+\\-./:]+$");
      exports.testKanji = function testKanji(str) {
        return TEST_KANJI.test(str);
      };
      exports.testNumeric = function testNumeric(str) {
        return TEST_NUMERIC.test(str);
      };
      exports.testAlphanumeric = function testAlphanumeric(str) {
        return TEST_ALPHANUMERIC.test(str);
      };
    }
  });

  // node_modules/qrcode/lib/core/mode.js
  var require_mode = __commonJS({
    "node_modules/qrcode/lib/core/mode.js"(exports) {
      var VersionCheck = require_version_check();
      var Regex = require_regex();
      exports.NUMERIC = {
        id: "Numeric",
        bit: 1 << 0,
        ccBits: [10, 12, 14]
      };
      exports.ALPHANUMERIC = {
        id: "Alphanumeric",
        bit: 1 << 1,
        ccBits: [9, 11, 13]
      };
      exports.BYTE = {
        id: "Byte",
        bit: 1 << 2,
        ccBits: [8, 16, 16]
      };
      exports.KANJI = {
        id: "Kanji",
        bit: 1 << 3,
        ccBits: [8, 10, 12]
      };
      exports.MIXED = {
        bit: -1
      };
      exports.getCharCountIndicator = function getCharCountIndicator(mode, version) {
        if (!mode.ccBits) throw new Error("Invalid mode: " + mode);
        if (!VersionCheck.isValid(version)) {
          throw new Error("Invalid version: " + version);
        }
        if (version >= 1 && version < 10) return mode.ccBits[0];
        else if (version < 27) return mode.ccBits[1];
        return mode.ccBits[2];
      };
      exports.getBestModeForData = function getBestModeForData(dataStr) {
        if (Regex.testNumeric(dataStr)) return exports.NUMERIC;
        else if (Regex.testAlphanumeric(dataStr)) return exports.ALPHANUMERIC;
        else if (Regex.testKanji(dataStr)) return exports.KANJI;
        else return exports.BYTE;
      };
      exports.toString = function toString(mode) {
        if (mode && mode.id) return mode.id;
        throw new Error("Invalid mode");
      };
      exports.isValid = function isValid(mode) {
        return mode && mode.bit && mode.ccBits;
      };
      function fromString(string) {
        if (typeof string !== "string") {
          throw new Error("Param is not a string");
        }
        const lcStr = string.toLowerCase();
        switch (lcStr) {
          case "numeric":
            return exports.NUMERIC;
          case "alphanumeric":
            return exports.ALPHANUMERIC;
          case "kanji":
            return exports.KANJI;
          case "byte":
            return exports.BYTE;
          default:
            throw new Error("Unknown mode: " + string);
        }
      }
      exports.from = function from(value, defaultValue) {
        if (exports.isValid(value)) {
          return value;
        }
        try {
          return fromString(value);
        } catch (e) {
          return defaultValue;
        }
      };
    }
  });

  // node_modules/qrcode/lib/core/version.js
  var require_version = __commonJS({
    "node_modules/qrcode/lib/core/version.js"(exports) {
      var Utils = require_utils();
      var ECCode = require_error_correction_code();
      var ECLevel = require_error_correction_level();
      var Mode = require_mode();
      var VersionCheck = require_version_check();
      var G18 = 1 << 12 | 1 << 11 | 1 << 10 | 1 << 9 | 1 << 8 | 1 << 5 | 1 << 2 | 1 << 0;
      var G18_BCH = Utils.getBCHDigit(G18);
      function getBestVersionForDataLength(mode, length, errorCorrectionLevel) {
        for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
          if (length <= exports.getCapacity(currentVersion, errorCorrectionLevel, mode)) {
            return currentVersion;
          }
        }
        return void 0;
      }
      function getReservedBitsCount(mode, version) {
        return Mode.getCharCountIndicator(mode, version) + 4;
      }
      function getTotalBitsFromDataArray(segments, version) {
        let totalBits = 0;
        segments.forEach(function(data) {
          const reservedBits = getReservedBitsCount(data.mode, version);
          totalBits += reservedBits + data.getBitsLength();
        });
        return totalBits;
      }
      function getBestVersionForMixedData(segments, errorCorrectionLevel) {
        for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
          const length = getTotalBitsFromDataArray(segments, currentVersion);
          if (length <= exports.getCapacity(currentVersion, errorCorrectionLevel, Mode.MIXED)) {
            return currentVersion;
          }
        }
        return void 0;
      }
      exports.from = function from(value, defaultValue) {
        if (VersionCheck.isValid(value)) {
          return parseInt(value, 10);
        }
        return defaultValue;
      };
      exports.getCapacity = function getCapacity(version, errorCorrectionLevel, mode) {
        if (!VersionCheck.isValid(version)) {
          throw new Error("Invalid QR Code version");
        }
        if (typeof mode === "undefined") mode = Mode.BYTE;
        const totalCodewords = Utils.getSymbolTotalCodewords(version);
        const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
        const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;
        if (mode === Mode.MIXED) return dataTotalCodewordsBits;
        const usableBits = dataTotalCodewordsBits - getReservedBitsCount(mode, version);
        switch (mode) {
          case Mode.NUMERIC:
            return Math.floor(usableBits / 10 * 3);
          case Mode.ALPHANUMERIC:
            return Math.floor(usableBits / 11 * 2);
          case Mode.KANJI:
            return Math.floor(usableBits / 13);
          case Mode.BYTE:
          default:
            return Math.floor(usableBits / 8);
        }
      };
      exports.getBestVersionForData = function getBestVersionForData(data, errorCorrectionLevel) {
        let seg;
        const ecl = ECLevel.from(errorCorrectionLevel, ECLevel.M);
        if (Array.isArray(data)) {
          if (data.length > 1) {
            return getBestVersionForMixedData(data, ecl);
          }
          if (data.length === 0) {
            return 1;
          }
          seg = data[0];
        } else {
          seg = data;
        }
        return getBestVersionForDataLength(seg.mode, seg.getLength(), ecl);
      };
      exports.getEncodedBits = function getEncodedBits(version) {
        if (!VersionCheck.isValid(version) || version < 7) {
          throw new Error("Invalid QR Code version");
        }
        let d = version << 12;
        while (Utils.getBCHDigit(d) - G18_BCH >= 0) {
          d ^= G18 << Utils.getBCHDigit(d) - G18_BCH;
        }
        return version << 12 | d;
      };
    }
  });

  // node_modules/qrcode/lib/core/format-info.js
  var require_format_info = __commonJS({
    "node_modules/qrcode/lib/core/format-info.js"(exports) {
      var Utils = require_utils();
      var G15 = 1 << 10 | 1 << 8 | 1 << 5 | 1 << 4 | 1 << 2 | 1 << 1 | 1 << 0;
      var G15_MASK = 1 << 14 | 1 << 12 | 1 << 10 | 1 << 4 | 1 << 1;
      var G15_BCH = Utils.getBCHDigit(G15);
      exports.getEncodedBits = function getEncodedBits(errorCorrectionLevel, mask) {
        const data = errorCorrectionLevel.bit << 3 | mask;
        let d = data << 10;
        while (Utils.getBCHDigit(d) - G15_BCH >= 0) {
          d ^= G15 << Utils.getBCHDigit(d) - G15_BCH;
        }
        return (data << 10 | d) ^ G15_MASK;
      };
    }
  });

  // node_modules/qrcode/lib/core/numeric-data.js
  var require_numeric_data = __commonJS({
    "node_modules/qrcode/lib/core/numeric-data.js"(exports, module) {
      var Mode = require_mode();
      function NumericData(data) {
        this.mode = Mode.NUMERIC;
        this.data = data.toString();
      }
      NumericData.getBitsLength = function getBitsLength(length) {
        return 10 * Math.floor(length / 3) + (length % 3 ? length % 3 * 3 + 1 : 0);
      };
      NumericData.prototype.getLength = function getLength() {
        return this.data.length;
      };
      NumericData.prototype.getBitsLength = function getBitsLength() {
        return NumericData.getBitsLength(this.data.length);
      };
      NumericData.prototype.write = function write(bitBuffer) {
        let i, group, value;
        for (i = 0; i + 3 <= this.data.length; i += 3) {
          group = this.data.substr(i, 3);
          value = parseInt(group, 10);
          bitBuffer.put(value, 10);
        }
        const remainingNum = this.data.length - i;
        if (remainingNum > 0) {
          group = this.data.substr(i);
          value = parseInt(group, 10);
          bitBuffer.put(value, remainingNum * 3 + 1);
        }
      };
      module.exports = NumericData;
    }
  });

  // node_modules/qrcode/lib/core/alphanumeric-data.js
  var require_alphanumeric_data = __commonJS({
    "node_modules/qrcode/lib/core/alphanumeric-data.js"(exports, module) {
      var Mode = require_mode();
      var ALPHA_NUM_CHARS = [
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "X",
        "Y",
        "Z",
        " ",
        "$",
        "%",
        "*",
        "+",
        "-",
        ".",
        "/",
        ":"
      ];
      function AlphanumericData(data) {
        this.mode = Mode.ALPHANUMERIC;
        this.data = data;
      }
      AlphanumericData.getBitsLength = function getBitsLength(length) {
        return 11 * Math.floor(length / 2) + 6 * (length % 2);
      };
      AlphanumericData.prototype.getLength = function getLength() {
        return this.data.length;
      };
      AlphanumericData.prototype.getBitsLength = function getBitsLength() {
        return AlphanumericData.getBitsLength(this.data.length);
      };
      AlphanumericData.prototype.write = function write(bitBuffer) {
        let i;
        for (i = 0; i + 2 <= this.data.length; i += 2) {
          let value = ALPHA_NUM_CHARS.indexOf(this.data[i]) * 45;
          value += ALPHA_NUM_CHARS.indexOf(this.data[i + 1]);
          bitBuffer.put(value, 11);
        }
        if (this.data.length % 2) {
          bitBuffer.put(ALPHA_NUM_CHARS.indexOf(this.data[i]), 6);
        }
      };
      module.exports = AlphanumericData;
    }
  });

  // node_modules/qrcode/lib/core/byte-data.js
  var require_byte_data = __commonJS({
    "node_modules/qrcode/lib/core/byte-data.js"(exports, module) {
      var Mode = require_mode();
      function ByteData(data) {
        this.mode = Mode.BYTE;
        if (typeof data === "string") {
          this.data = new TextEncoder().encode(data);
        } else {
          this.data = new Uint8Array(data);
        }
      }
      ByteData.getBitsLength = function getBitsLength(length) {
        return length * 8;
      };
      ByteData.prototype.getLength = function getLength() {
        return this.data.length;
      };
      ByteData.prototype.getBitsLength = function getBitsLength() {
        return ByteData.getBitsLength(this.data.length);
      };
      ByteData.prototype.write = function(bitBuffer) {
        for (let i = 0, l = this.data.length; i < l; i++) {
          bitBuffer.put(this.data[i], 8);
        }
      };
      module.exports = ByteData;
    }
  });

  // node_modules/qrcode/lib/core/kanji-data.js
  var require_kanji_data = __commonJS({
    "node_modules/qrcode/lib/core/kanji-data.js"(exports, module) {
      var Mode = require_mode();
      var Utils = require_utils();
      function KanjiData(data) {
        this.mode = Mode.KANJI;
        this.data = data;
      }
      KanjiData.getBitsLength = function getBitsLength(length) {
        return length * 13;
      };
      KanjiData.prototype.getLength = function getLength() {
        return this.data.length;
      };
      KanjiData.prototype.getBitsLength = function getBitsLength() {
        return KanjiData.getBitsLength(this.data.length);
      };
      KanjiData.prototype.write = function(bitBuffer) {
        let i;
        for (i = 0; i < this.data.length; i++) {
          let value = Utils.toSJIS(this.data[i]);
          if (value >= 33088 && value <= 40956) {
            value -= 33088;
          } else if (value >= 57408 && value <= 60351) {
            value -= 49472;
          } else {
            throw new Error(
              "Invalid SJIS character: " + this.data[i] + "\nMake sure your charset is UTF-8"
            );
          }
          value = (value >>> 8 & 255) * 192 + (value & 255);
          bitBuffer.put(value, 13);
        }
      };
      module.exports = KanjiData;
    }
  });

  // node_modules/dijkstrajs/dijkstra.js
  var require_dijkstra = __commonJS({
    "node_modules/dijkstrajs/dijkstra.js"(exports, module) {
      "use strict";
      var dijkstra = {
        single_source_shortest_paths: function(graph, s, d) {
          var predecessors = {};
          var costs = {};
          costs[s] = 0;
          var open = dijkstra.PriorityQueue.make();
          open.push(s, 0);
          var closest, u, v, cost_of_s_to_u, adjacent_nodes, cost_of_e, cost_of_s_to_u_plus_cost_of_e, cost_of_s_to_v, first_visit;
          while (!open.empty()) {
            closest = open.pop();
            u = closest.value;
            cost_of_s_to_u = closest.cost;
            adjacent_nodes = graph[u] || {};
            for (v in adjacent_nodes) {
              if (adjacent_nodes.hasOwnProperty(v)) {
                cost_of_e = adjacent_nodes[v];
                cost_of_s_to_u_plus_cost_of_e = cost_of_s_to_u + cost_of_e;
                cost_of_s_to_v = costs[v];
                first_visit = typeof costs[v] === "undefined";
                if (first_visit || cost_of_s_to_v > cost_of_s_to_u_plus_cost_of_e) {
                  costs[v] = cost_of_s_to_u_plus_cost_of_e;
                  open.push(v, cost_of_s_to_u_plus_cost_of_e);
                  predecessors[v] = u;
                }
              }
            }
          }
          if (typeof d !== "undefined" && typeof costs[d] === "undefined") {
            var msg = ["Could not find a path from ", s, " to ", d, "."].join("");
            throw new Error(msg);
          }
          return predecessors;
        },
        extract_shortest_path_from_predecessor_list: function(predecessors, d) {
          var nodes = [];
          var u = d;
          var predecessor;
          while (u) {
            nodes.push(u);
            predecessor = predecessors[u];
            u = predecessors[u];
          }
          nodes.reverse();
          return nodes;
        },
        find_path: function(graph, s, d) {
          var predecessors = dijkstra.single_source_shortest_paths(graph, s, d);
          return dijkstra.extract_shortest_path_from_predecessor_list(
            predecessors,
            d
          );
        },
        /**
         * A very naive priority queue implementation.
         */
        PriorityQueue: {
          make: function(opts) {
            var T = dijkstra.PriorityQueue, t = {}, key;
            opts = opts || {};
            for (key in T) {
              if (T.hasOwnProperty(key)) {
                t[key] = T[key];
              }
            }
            t.queue = [];
            t.sorter = opts.sorter || T.default_sorter;
            return t;
          },
          default_sorter: function(a, b) {
            return a.cost - b.cost;
          },
          /**
           * Add a new item to the queue and ensure the highest priority element
           * is at the front of the queue.
           */
          push: function(value, cost) {
            var item = { value, cost };
            this.queue.push(item);
            this.queue.sort(this.sorter);
          },
          /**
           * Return the highest priority element in the queue.
           */
          pop: function() {
            return this.queue.shift();
          },
          empty: function() {
            return this.queue.length === 0;
          }
        }
      };
      if (typeof module !== "undefined") {
        module.exports = dijkstra;
      }
    }
  });

  // node_modules/qrcode/lib/core/segments.js
  var require_segments = __commonJS({
    "node_modules/qrcode/lib/core/segments.js"(exports) {
      var Mode = require_mode();
      var NumericData = require_numeric_data();
      var AlphanumericData = require_alphanumeric_data();
      var ByteData = require_byte_data();
      var KanjiData = require_kanji_data();
      var Regex = require_regex();
      var Utils = require_utils();
      var dijkstra = require_dijkstra();
      function getStringByteLength(str) {
        return unescape(encodeURIComponent(str)).length;
      }
      function getSegments(regex, mode, str) {
        const segments = [];
        let result;
        while ((result = regex.exec(str)) !== null) {
          segments.push({
            data: result[0],
            index: result.index,
            mode,
            length: result[0].length
          });
        }
        return segments;
      }
      function getSegmentsFromString(dataStr) {
        const numSegs = getSegments(Regex.NUMERIC, Mode.NUMERIC, dataStr);
        const alphaNumSegs = getSegments(Regex.ALPHANUMERIC, Mode.ALPHANUMERIC, dataStr);
        let byteSegs;
        let kanjiSegs;
        if (Utils.isKanjiModeEnabled()) {
          byteSegs = getSegments(Regex.BYTE, Mode.BYTE, dataStr);
          kanjiSegs = getSegments(Regex.KANJI, Mode.KANJI, dataStr);
        } else {
          byteSegs = getSegments(Regex.BYTE_KANJI, Mode.BYTE, dataStr);
          kanjiSegs = [];
        }
        const segs = numSegs.concat(alphaNumSegs, byteSegs, kanjiSegs);
        return segs.sort(function(s1, s2) {
          return s1.index - s2.index;
        }).map(function(obj) {
          return {
            data: obj.data,
            mode: obj.mode,
            length: obj.length
          };
        });
      }
      function getSegmentBitsLength(length, mode) {
        switch (mode) {
          case Mode.NUMERIC:
            return NumericData.getBitsLength(length);
          case Mode.ALPHANUMERIC:
            return AlphanumericData.getBitsLength(length);
          case Mode.KANJI:
            return KanjiData.getBitsLength(length);
          case Mode.BYTE:
            return ByteData.getBitsLength(length);
        }
      }
      function mergeSegments(segs) {
        return segs.reduce(function(acc, curr) {
          const prevSeg = acc.length - 1 >= 0 ? acc[acc.length - 1] : null;
          if (prevSeg && prevSeg.mode === curr.mode) {
            acc[acc.length - 1].data += curr.data;
            return acc;
          }
          acc.push(curr);
          return acc;
        }, []);
      }
      function buildNodes(segs) {
        const nodes = [];
        for (let i = 0; i < segs.length; i++) {
          const seg = segs[i];
          switch (seg.mode) {
            case Mode.NUMERIC:
              nodes.push([
                seg,
                { data: seg.data, mode: Mode.ALPHANUMERIC, length: seg.length },
                { data: seg.data, mode: Mode.BYTE, length: seg.length }
              ]);
              break;
            case Mode.ALPHANUMERIC:
              nodes.push([
                seg,
                { data: seg.data, mode: Mode.BYTE, length: seg.length }
              ]);
              break;
            case Mode.KANJI:
              nodes.push([
                seg,
                { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
              ]);
              break;
            case Mode.BYTE:
              nodes.push([
                { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
              ]);
          }
        }
        return nodes;
      }
      function buildGraph(nodes, version) {
        const table = {};
        const graph = { start: {} };
        let prevNodeIds = ["start"];
        for (let i = 0; i < nodes.length; i++) {
          const nodeGroup = nodes[i];
          const currentNodeIds = [];
          for (let j = 0; j < nodeGroup.length; j++) {
            const node = nodeGroup[j];
            const key = "" + i + j;
            currentNodeIds.push(key);
            table[key] = { node, lastCount: 0 };
            graph[key] = {};
            for (let n = 0; n < prevNodeIds.length; n++) {
              const prevNodeId = prevNodeIds[n];
              if (table[prevNodeId] && table[prevNodeId].node.mode === node.mode) {
                graph[prevNodeId][key] = getSegmentBitsLength(table[prevNodeId].lastCount + node.length, node.mode) - getSegmentBitsLength(table[prevNodeId].lastCount, node.mode);
                table[prevNodeId].lastCount += node.length;
              } else {
                if (table[prevNodeId]) table[prevNodeId].lastCount = node.length;
                graph[prevNodeId][key] = getSegmentBitsLength(node.length, node.mode) + 4 + Mode.getCharCountIndicator(node.mode, version);
              }
            }
          }
          prevNodeIds = currentNodeIds;
        }
        for (let n = 0; n < prevNodeIds.length; n++) {
          graph[prevNodeIds[n]].end = 0;
        }
        return { map: graph, table };
      }
      function buildSingleSegment(data, modesHint) {
        let mode;
        const bestMode = Mode.getBestModeForData(data);
        mode = Mode.from(modesHint, bestMode);
        if (mode !== Mode.BYTE && mode.bit < bestMode.bit) {
          throw new Error('"' + data + '" cannot be encoded with mode ' + Mode.toString(mode) + ".\n Suggested mode is: " + Mode.toString(bestMode));
        }
        if (mode === Mode.KANJI && !Utils.isKanjiModeEnabled()) {
          mode = Mode.BYTE;
        }
        switch (mode) {
          case Mode.NUMERIC:
            return new NumericData(data);
          case Mode.ALPHANUMERIC:
            return new AlphanumericData(data);
          case Mode.KANJI:
            return new KanjiData(data);
          case Mode.BYTE:
            return new ByteData(data);
        }
      }
      exports.fromArray = function fromArray(array) {
        return array.reduce(function(acc, seg) {
          if (typeof seg === "string") {
            acc.push(buildSingleSegment(seg, null));
          } else if (seg.data) {
            acc.push(buildSingleSegment(seg.data, seg.mode));
          }
          return acc;
        }, []);
      };
      exports.fromString = function fromString(data, version) {
        const segs = getSegmentsFromString(data, Utils.isKanjiModeEnabled());
        const nodes = buildNodes(segs);
        const graph = buildGraph(nodes, version);
        const path = dijkstra.find_path(graph.map, "start", "end");
        const optimizedSegs = [];
        for (let i = 1; i < path.length - 1; i++) {
          optimizedSegs.push(graph.table[path[i]].node);
        }
        return exports.fromArray(mergeSegments(optimizedSegs));
      };
      exports.rawSplit = function rawSplit(data) {
        return exports.fromArray(
          getSegmentsFromString(data, Utils.isKanjiModeEnabled())
        );
      };
    }
  });

  // node_modules/qrcode/lib/core/qrcode.js
  var require_qrcode = __commonJS({
    "node_modules/qrcode/lib/core/qrcode.js"(exports) {
      var Utils = require_utils();
      var ECLevel = require_error_correction_level();
      var BitBuffer = require_bit_buffer();
      var BitMatrix = require_bit_matrix();
      var AlignmentPattern = require_alignment_pattern();
      var FinderPattern = require_finder_pattern();
      var MaskPattern = require_mask_pattern();
      var ECCode = require_error_correction_code();
      var ReedSolomonEncoder = require_reed_solomon_encoder();
      var Version = require_version();
      var FormatInfo = require_format_info();
      var Mode = require_mode();
      var Segments = require_segments();
      function setupFinderPattern(matrix, version) {
        const size = matrix.size;
        const pos = FinderPattern.getPositions(version);
        for (let i = 0; i < pos.length; i++) {
          const row = pos[i][0];
          const col = pos[i][1];
          for (let r = -1; r <= 7; r++) {
            if (row + r <= -1 || size <= row + r) continue;
            for (let c = -1; c <= 7; c++) {
              if (col + c <= -1 || size <= col + c) continue;
              if (r >= 0 && r <= 6 && (c === 0 || c === 6) || c >= 0 && c <= 6 && (r === 0 || r === 6) || r >= 2 && r <= 4 && c >= 2 && c <= 4) {
                matrix.set(row + r, col + c, true, true);
              } else {
                matrix.set(row + r, col + c, false, true);
              }
            }
          }
        }
      }
      function setupTimingPattern(matrix) {
        const size = matrix.size;
        for (let r = 8; r < size - 8; r++) {
          const value = r % 2 === 0;
          matrix.set(r, 6, value, true);
          matrix.set(6, r, value, true);
        }
      }
      function setupAlignmentPattern(matrix, version) {
        const pos = AlignmentPattern.getPositions(version);
        for (let i = 0; i < pos.length; i++) {
          const row = pos[i][0];
          const col = pos[i][1];
          for (let r = -2; r <= 2; r++) {
            for (let c = -2; c <= 2; c++) {
              if (r === -2 || r === 2 || c === -2 || c === 2 || r === 0 && c === 0) {
                matrix.set(row + r, col + c, true, true);
              } else {
                matrix.set(row + r, col + c, false, true);
              }
            }
          }
        }
      }
      function setupVersionInfo(matrix, version) {
        const size = matrix.size;
        const bits = Version.getEncodedBits(version);
        let row, col, mod;
        for (let i = 0; i < 18; i++) {
          row = Math.floor(i / 3);
          col = i % 3 + size - 8 - 3;
          mod = (bits >> i & 1) === 1;
          matrix.set(row, col, mod, true);
          matrix.set(col, row, mod, true);
        }
      }
      function setupFormatInfo(matrix, errorCorrectionLevel, maskPattern) {
        const size = matrix.size;
        const bits = FormatInfo.getEncodedBits(errorCorrectionLevel, maskPattern);
        let i, mod;
        for (i = 0; i < 15; i++) {
          mod = (bits >> i & 1) === 1;
          if (i < 6) {
            matrix.set(i, 8, mod, true);
          } else if (i < 8) {
            matrix.set(i + 1, 8, mod, true);
          } else {
            matrix.set(size - 15 + i, 8, mod, true);
          }
          if (i < 8) {
            matrix.set(8, size - i - 1, mod, true);
          } else if (i < 9) {
            matrix.set(8, 15 - i - 1 + 1, mod, true);
          } else {
            matrix.set(8, 15 - i - 1, mod, true);
          }
        }
        matrix.set(size - 8, 8, 1, true);
      }
      function setupData(matrix, data) {
        const size = matrix.size;
        let inc = -1;
        let row = size - 1;
        let bitIndex = 7;
        let byteIndex = 0;
        for (let col = size - 1; col > 0; col -= 2) {
          if (col === 6) col--;
          while (true) {
            for (let c = 0; c < 2; c++) {
              if (!matrix.isReserved(row, col - c)) {
                let dark = false;
                if (byteIndex < data.length) {
                  dark = (data[byteIndex] >>> bitIndex & 1) === 1;
                }
                matrix.set(row, col - c, dark);
                bitIndex--;
                if (bitIndex === -1) {
                  byteIndex++;
                  bitIndex = 7;
                }
              }
            }
            row += inc;
            if (row < 0 || size <= row) {
              row -= inc;
              inc = -inc;
              break;
            }
          }
        }
      }
      function createData(version, errorCorrectionLevel, segments) {
        const buffer = new BitBuffer();
        segments.forEach(function(data) {
          buffer.put(data.mode.bit, 4);
          buffer.put(data.getLength(), Mode.getCharCountIndicator(data.mode, version));
          data.write(buffer);
        });
        const totalCodewords = Utils.getSymbolTotalCodewords(version);
        const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
        const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;
        if (buffer.getLengthInBits() + 4 <= dataTotalCodewordsBits) {
          buffer.put(0, 4);
        }
        while (buffer.getLengthInBits() % 8 !== 0) {
          buffer.putBit(0);
        }
        const remainingByte = (dataTotalCodewordsBits - buffer.getLengthInBits()) / 8;
        for (let i = 0; i < remainingByte; i++) {
          buffer.put(i % 2 ? 17 : 236, 8);
        }
        return createCodewords(buffer, version, errorCorrectionLevel);
      }
      function createCodewords(bitBuffer, version, errorCorrectionLevel) {
        const totalCodewords = Utils.getSymbolTotalCodewords(version);
        const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
        const dataTotalCodewords = totalCodewords - ecTotalCodewords;
        const ecTotalBlocks = ECCode.getBlocksCount(version, errorCorrectionLevel);
        const blocksInGroup2 = totalCodewords % ecTotalBlocks;
        const blocksInGroup1 = ecTotalBlocks - blocksInGroup2;
        const totalCodewordsInGroup1 = Math.floor(totalCodewords / ecTotalBlocks);
        const dataCodewordsInGroup1 = Math.floor(dataTotalCodewords / ecTotalBlocks);
        const dataCodewordsInGroup2 = dataCodewordsInGroup1 + 1;
        const ecCount = totalCodewordsInGroup1 - dataCodewordsInGroup1;
        const rs = new ReedSolomonEncoder(ecCount);
        let offset = 0;
        const dcData = new Array(ecTotalBlocks);
        const ecData = new Array(ecTotalBlocks);
        let maxDataSize = 0;
        const buffer = new Uint8Array(bitBuffer.buffer);
        for (let b = 0; b < ecTotalBlocks; b++) {
          const dataSize = b < blocksInGroup1 ? dataCodewordsInGroup1 : dataCodewordsInGroup2;
          dcData[b] = buffer.slice(offset, offset + dataSize);
          ecData[b] = rs.encode(dcData[b]);
          offset += dataSize;
          maxDataSize = Math.max(maxDataSize, dataSize);
        }
        const data = new Uint8Array(totalCodewords);
        let index = 0;
        let i, r;
        for (i = 0; i < maxDataSize; i++) {
          for (r = 0; r < ecTotalBlocks; r++) {
            if (i < dcData[r].length) {
              data[index++] = dcData[r][i];
            }
          }
        }
        for (i = 0; i < ecCount; i++) {
          for (r = 0; r < ecTotalBlocks; r++) {
            data[index++] = ecData[r][i];
          }
        }
        return data;
      }
      function createSymbol(data, version, errorCorrectionLevel, maskPattern) {
        let segments;
        if (Array.isArray(data)) {
          segments = Segments.fromArray(data);
        } else if (typeof data === "string") {
          let estimatedVersion = version;
          if (!estimatedVersion) {
            const rawSegments = Segments.rawSplit(data);
            estimatedVersion = Version.getBestVersionForData(rawSegments, errorCorrectionLevel);
          }
          segments = Segments.fromString(data, estimatedVersion || 40);
        } else {
          throw new Error("Invalid data");
        }
        const bestVersion = Version.getBestVersionForData(segments, errorCorrectionLevel);
        if (!bestVersion) {
          throw new Error("The amount of data is too big to be stored in a QR Code");
        }
        if (!version) {
          version = bestVersion;
        } else if (version < bestVersion) {
          throw new Error(
            "\nThe chosen QR Code version cannot contain this amount of data.\nMinimum version required to store current data is: " + bestVersion + ".\n"
          );
        }
        const dataBits = createData(version, errorCorrectionLevel, segments);
        const moduleCount = Utils.getSymbolSize(version);
        const modules = new BitMatrix(moduleCount);
        setupFinderPattern(modules, version);
        setupTimingPattern(modules);
        setupAlignmentPattern(modules, version);
        setupFormatInfo(modules, errorCorrectionLevel, 0);
        if (version >= 7) {
          setupVersionInfo(modules, version);
        }
        setupData(modules, dataBits);
        if (isNaN(maskPattern)) {
          maskPattern = MaskPattern.getBestMask(
            modules,
            setupFormatInfo.bind(null, modules, errorCorrectionLevel)
          );
        }
        MaskPattern.applyMask(maskPattern, modules);
        setupFormatInfo(modules, errorCorrectionLevel, maskPattern);
        return {
          modules,
          version,
          errorCorrectionLevel,
          maskPattern,
          segments
        };
      }
      exports.create = function create(data, options) {
        if (typeof data === "undefined" || data === "") {
          throw new Error("No input text");
        }
        let errorCorrectionLevel = ECLevel.M;
        let version;
        let mask;
        if (typeof options !== "undefined") {
          errorCorrectionLevel = ECLevel.from(options.errorCorrectionLevel, ECLevel.M);
          version = Version.from(options.version);
          mask = MaskPattern.from(options.maskPattern);
          if (options.toSJISFunc) {
            Utils.setToSJISFunction(options.toSJISFunc);
          }
        }
        return createSymbol(data, version, errorCorrectionLevel, mask);
      };
    }
  });

  // node_modules/qrcode/lib/renderer/utils.js
  var require_utils2 = __commonJS({
    "node_modules/qrcode/lib/renderer/utils.js"(exports) {
      function hex2rgba(hex) {
        if (typeof hex === "number") {
          hex = hex.toString();
        }
        if (typeof hex !== "string") {
          throw new Error("Color should be defined as hex string");
        }
        let hexCode = hex.slice().replace("#", "").split("");
        if (hexCode.length < 3 || hexCode.length === 5 || hexCode.length > 8) {
          throw new Error("Invalid hex color: " + hex);
        }
        if (hexCode.length === 3 || hexCode.length === 4) {
          hexCode = Array.prototype.concat.apply([], hexCode.map(function(c) {
            return [c, c];
          }));
        }
        if (hexCode.length === 6) hexCode.push("F", "F");
        const hexValue = parseInt(hexCode.join(""), 16);
        return {
          r: hexValue >> 24 & 255,
          g: hexValue >> 16 & 255,
          b: hexValue >> 8 & 255,
          a: hexValue & 255,
          hex: "#" + hexCode.slice(0, 6).join("")
        };
      }
      exports.getOptions = function getOptions(options) {
        if (!options) options = {};
        if (!options.color) options.color = {};
        const margin = typeof options.margin === "undefined" || options.margin === null || options.margin < 0 ? 4 : options.margin;
        const width = options.width && options.width >= 21 ? options.width : void 0;
        const scale = options.scale || 4;
        return {
          width,
          scale: width ? 4 : scale,
          margin,
          color: {
            dark: hex2rgba(options.color.dark || "#000000ff"),
            light: hex2rgba(options.color.light || "#ffffffff")
          },
          type: options.type,
          rendererOpts: options.rendererOpts || {}
        };
      };
      exports.getScale = function getScale(qrSize, opts) {
        return opts.width && opts.width >= qrSize + opts.margin * 2 ? opts.width / (qrSize + opts.margin * 2) : opts.scale;
      };
      exports.getImageWidth = function getImageWidth(qrSize, opts) {
        const scale = exports.getScale(qrSize, opts);
        return Math.floor((qrSize + opts.margin * 2) * scale);
      };
      exports.qrToImageData = function qrToImageData(imgData, qr, opts) {
        const size = qr.modules.size;
        const data = qr.modules.data;
        const scale = exports.getScale(size, opts);
        const symbolSize = Math.floor((size + opts.margin * 2) * scale);
        const scaledMargin = opts.margin * scale;
        const palette = [opts.color.light, opts.color.dark];
        for (let i = 0; i < symbolSize; i++) {
          for (let j = 0; j < symbolSize; j++) {
            let posDst = (i * symbolSize + j) * 4;
            let pxColor = opts.color.light;
            if (i >= scaledMargin && j >= scaledMargin && i < symbolSize - scaledMargin && j < symbolSize - scaledMargin) {
              const iSrc = Math.floor((i - scaledMargin) / scale);
              const jSrc = Math.floor((j - scaledMargin) / scale);
              pxColor = palette[data[iSrc * size + jSrc] ? 1 : 0];
            }
            imgData[posDst++] = pxColor.r;
            imgData[posDst++] = pxColor.g;
            imgData[posDst++] = pxColor.b;
            imgData[posDst] = pxColor.a;
          }
        }
      };
    }
  });

  // node_modules/qrcode/lib/renderer/canvas.js
  var require_canvas = __commonJS({
    "node_modules/qrcode/lib/renderer/canvas.js"(exports) {
      var Utils = require_utils2();
      function clearCanvas(ctx, canvas, size) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!canvas.style) canvas.style = {};
        canvas.height = size;
        canvas.width = size;
        canvas.style.height = size + "px";
        canvas.style.width = size + "px";
      }
      function getCanvasElement() {
        try {
          return document.createElement("canvas");
        } catch (e) {
          throw new Error("You need to specify a canvas element");
        }
      }
      exports.render = function render(qrData, canvas, options) {
        let opts = options;
        let canvasEl = canvas;
        if (typeof opts === "undefined" && (!canvas || !canvas.getContext)) {
          opts = canvas;
          canvas = void 0;
        }
        if (!canvas) {
          canvasEl = getCanvasElement();
        }
        opts = Utils.getOptions(opts);
        const size = Utils.getImageWidth(qrData.modules.size, opts);
        const ctx = canvasEl.getContext("2d");
        const image = ctx.createImageData(size, size);
        Utils.qrToImageData(image.data, qrData, opts);
        clearCanvas(ctx, canvasEl, size);
        ctx.putImageData(image, 0, 0);
        return canvasEl;
      };
      exports.renderToDataURL = function renderToDataURL(qrData, canvas, options) {
        let opts = options;
        if (typeof opts === "undefined" && (!canvas || !canvas.getContext)) {
          opts = canvas;
          canvas = void 0;
        }
        if (!opts) opts = {};
        const canvasEl = exports.render(qrData, canvas, opts);
        const type = opts.type || "image/png";
        const rendererOpts = opts.rendererOpts || {};
        return canvasEl.toDataURL(type, rendererOpts.quality);
      };
    }
  });

  // node_modules/qrcode/lib/renderer/svg-tag.js
  var require_svg_tag = __commonJS({
    "node_modules/qrcode/lib/renderer/svg-tag.js"(exports) {
      var Utils = require_utils2();
      function getColorAttrib(color, attrib) {
        const alpha = color.a / 255;
        const str = attrib + '="' + color.hex + '"';
        return alpha < 1 ? str + " " + attrib + '-opacity="' + alpha.toFixed(2).slice(1) + '"' : str;
      }
      function svgCmd(cmd, x, y) {
        let str = cmd + x;
        if (typeof y !== "undefined") str += " " + y;
        return str;
      }
      function qrToPath(data, size, margin) {
        let path = "";
        let moveBy = 0;
        let newRow = false;
        let lineLength = 0;
        for (let i = 0; i < data.length; i++) {
          const col = Math.floor(i % size);
          const row = Math.floor(i / size);
          if (!col && !newRow) newRow = true;
          if (data[i]) {
            lineLength++;
            if (!(i > 0 && col > 0 && data[i - 1])) {
              path += newRow ? svgCmd("M", col + margin, 0.5 + row + margin) : svgCmd("m", moveBy, 0);
              moveBy = 0;
              newRow = false;
            }
            if (!(col + 1 < size && data[i + 1])) {
              path += svgCmd("h", lineLength);
              lineLength = 0;
            }
          } else {
            moveBy++;
          }
        }
        return path;
      }
      exports.render = function render(qrData, options, cb) {
        const opts = Utils.getOptions(options);
        const size = qrData.modules.size;
        const data = qrData.modules.data;
        const qrcodesize = size + opts.margin * 2;
        const bg = !opts.color.light.a ? "" : "<path " + getColorAttrib(opts.color.light, "fill") + ' d="M0 0h' + qrcodesize + "v" + qrcodesize + 'H0z"/>';
        const path = "<path " + getColorAttrib(opts.color.dark, "stroke") + ' d="' + qrToPath(data, size, opts.margin) + '"/>';
        const viewBox = 'viewBox="0 0 ' + qrcodesize + " " + qrcodesize + '"';
        const width = !opts.width ? "" : 'width="' + opts.width + '" height="' + opts.width + '" ';
        const svgTag = '<svg xmlns="http://www.w3.org/2000/svg" ' + width + viewBox + ' shape-rendering="crispEdges">' + bg + path + "</svg>\n";
        if (typeof cb === "function") {
          cb(null, svgTag);
        }
        return svgTag;
      };
    }
  });

  // node_modules/qrcode/lib/browser.js
  var require_browser = __commonJS({
    "node_modules/qrcode/lib/browser.js"(exports) {
      var canPromise = require_can_promise();
      var QRCode = require_qrcode();
      var CanvasRenderer = require_canvas();
      var SvgRenderer = require_svg_tag();
      function renderCanvas(renderFunc, canvas, text, opts, cb) {
        const args = [].slice.call(arguments, 1);
        const argsNum = args.length;
        const isLastArgCb = typeof args[argsNum - 1] === "function";
        if (!isLastArgCb && !canPromise()) {
          throw new Error("Callback required as last argument");
        }
        if (isLastArgCb) {
          if (argsNum < 2) {
            throw new Error("Too few arguments provided");
          }
          if (argsNum === 2) {
            cb = text;
            text = canvas;
            canvas = opts = void 0;
          } else if (argsNum === 3) {
            if (canvas.getContext && typeof cb === "undefined") {
              cb = opts;
              opts = void 0;
            } else {
              cb = opts;
              opts = text;
              text = canvas;
              canvas = void 0;
            }
          }
        } else {
          if (argsNum < 1) {
            throw new Error("Too few arguments provided");
          }
          if (argsNum === 1) {
            text = canvas;
            canvas = opts = void 0;
          } else if (argsNum === 2 && !canvas.getContext) {
            opts = text;
            text = canvas;
            canvas = void 0;
          }
          return new Promise(function(resolve, reject) {
            try {
              const data = QRCode.create(text, opts);
              resolve(renderFunc(data, canvas, opts));
            } catch (e) {
              reject(e);
            }
          });
        }
        try {
          const data = QRCode.create(text, opts);
          cb(null, renderFunc(data, canvas, opts));
        } catch (e) {
          cb(e);
        }
      }
      exports.create = QRCode.create;
      exports.toCanvas = renderCanvas.bind(null, CanvasRenderer.render);
      exports.toDataURL = renderCanvas.bind(null, CanvasRenderer.renderToDataURL);
      exports.toString = renderCanvas.bind(null, function(data, _, opts) {
        return SvgRenderer.render(data, opts);
      });
    }
  });

  // utm-builder/src/core.ts
  var URL_CHANNELS = "https://support.google.com/analytics/answer/9756891";
  var MAX_URL = 2e3;
  var MAX_TAG = 100;
  var MAX_ROWS = 200;
  var LONG_LINK = 2e3;
  var QR_DENSE = 1e3;
  var CHANNEL_LABEL = {
    organic_social: "Organic Social",
    email: "Email",
    referral: "Referral"
  };
  var PRESETS = [
    { id: "x", label: "X post", source: "x", medium: "social", channel: "organic_social" },
    { id: "linkedin", label: "LinkedIn post", source: "linkedin", medium: "social", channel: "organic_social" },
    { id: "newsletter", label: "Newsletter", source: "newsletter", medium: "email", channel: "email" },
    { id: "cold-email", label: "Cold email", source: "cold-email", medium: "email", channel: "email" },
    { id: "producthunt", label: "Product Hunt", source: "producthunt", medium: "referral", channel: "referral" }
  ];
  var TAGS = ["source", "medium", "campaign", "content", "term", "id"];
  var REQUIRED = ["source", "medium", "campaign"];
  var SOCIAL_MEDIUMS = ["social", "social-network", "social-media", "sm", "social network", "social media"];
  var REFERRAL_MEDIUMS = ["referral", "app", "link"];
  var EMAIL_WORDS = ["email", "e-mail", "e_mail", "e mail"];
  var PAID = /^(.*cp.*|ppc|retargeting|paid.*)$/;
  var DISPLAY = ["display", "banner", "expandable", "interstitial", "cpm"];
  var SHOP = /^(.*(([^a-df-z]|^)shop|shopping).*)$/;
  function channelOf(t) {
    const s = (t.source ?? "").trim().toLowerCase();
    const m = (t.medium ?? "").trim().toLowerCase();
    const c = (t.campaign ?? "").trim().toLowerCase();
    const earlier = c.includes("cross-network") || PAID.test(m) || DISPLAY.includes(m) || SHOP.test(c);
    if (earlier) return { channel: "unassigned_risk", label: null, earlier: true };
    if (SOCIAL_MEDIUMS.includes(m)) return { channel: "organic_social", label: CHANNEL_LABEL.organic_social, earlier: false };
    if (m.includes("video") || m === "organic" || m === "ai-assistant") return { channel: "unassigned_risk", label: null, earlier: true };
    if (REFERRAL_MEDIUMS.includes(m)) return { channel: "referral", label: CHANNEL_LABEL.referral, earlier: false };
    if (EMAIL_WORDS.includes(s) || EMAIL_WORDS.includes(m)) return { channel: "email", label: CHANNEL_LABEL.email, earlier: false };
    return { channel: "unassigned_risk", label: null, earlier: false };
  }
  function parseUrl(raw) {
    const v = raw.trim();
    if (!v) return { ok: false, error: "empty" };
    if (v.length > MAX_URL) return { ok: false, error: "too_long" };
    const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(v);
    let url;
    try {
      url = new URL(hasScheme ? v : `https://${v}`);
    } catch {
      return { ok: false, error: "invalid" };
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") return { ok: false, error: "invalid" };
    const host = url.hostname;
    if (!host || !/^([a-z0-9_-]+\.)*[a-z0-9_-]+$|^\[[0-9a-f:.]+\]$/i.test(host) || !host.includes(".") && host !== "localhost" || host.startsWith(".") || host.endsWith(".")) return { ok: false, error: "invalid" };
    return { ok: true, url, schemeAdded: !hasScheme };
  }
  function existingTags(url) {
    const out = [];
    url.searchParams.forEach((value, key) => {
      if (/^utm_/i.test(key)) out.push({ key, value });
    });
    return out;
  }
  var W = {
    mixed_case: "Meta and meta show up as two separate sources in your reports. Use lowercase.",
    // shape only; mixedCase() fills in the typed value
    spaces: "Spaces turn into %20 or +. Use a hyphen.",
    spaces_underscore: "Spaces turn into %20 or +. Use an underscore.",
    missing_tag: "Google says to always set source, medium and campaign.",
    special_chars: "We\u2019ve encoded it, but plain words read better in reports.",
    not_https: "Use https so tags survive redirects.",
    long_link: "This link is over 2,000 characters. Some apps may cut it off.",
    too_long: "Keep the web address under 2,000 characters.",
    non_latin: "That works, but plain ASCII names (a to z, 0 to 9) read better in reports.",
    inconsistent: "These look like the same source spelled two ways.",
    invalid: "That doesn\u2019t look like a web address",
    scheme: "We added https:// to the start.",
    unassigned: "This may land in Unassigned.",
    earlier: "These tags match one of Google\u2019s earlier rules, so this may not land where you expect.",
    qr_dense: "This link is over 1,000 characters, so the code will be dense and hard to scan. Try a shorter campaign name.",
    qr_note: "Scan to test before you print."
  };
  var TAG_PLURAL = { source: "sources", medium: "mediums", campaign: "campaigns", content: "content values", term: "terms", id: "campaign IDs" };
  var mixedCase = (tag, typed) => `${typed} and ${typed.toLowerCase()} show up as two separate ${TAG_PLURAL[tag]} in your reports. Use lowercase.`;
  var landsIn = (r) => r.label ? `In GA4 this will most likely show as ${r.label}` : r.earlier ? W.earlier : W.unassigned;
  var clean = (v) => (v ?? "").trim();
  function build(rawUrl, rawTags, opts) {
    const pu = parseUrl(rawUrl);
    if (!pu.ok) return { ok: false, error: pu.error === "empty" ? "empty_url" : pu.error === "too_long" ? "too_long_url" : "invalid_url", warnings: [] };
    const tags = {};
    for (const k of TAGS) {
      const v = clean(rawTags[k]).slice(0, MAX_TAG);
      if (v) tags[k] = opts.lowercase ? v.toLowerCase() : v;
    }
    const warnings = [];
    const missing = REQUIRED.filter((k) => !tags[k]);
    if (missing.length) {
      warnings.push({ id: "missing_tag", text: W.missing_tag, detail: missing.map((k) => `utm_${k}`) });
      return { ok: false, error: "missing_tag", missing, warnings, schemeAdded: pu.schemeAdded };
    }
    const url = new URL(pu.url.href);
    const had = existingTags(url);
    if (had.length) {
      const counts = /* @__PURE__ */ new Map();
      had.forEach((h) => counts.set(h.key.toLowerCase(), (counts.get(h.key.toLowerCase()) ?? 0) + 1));
      const detail = [];
      const seen = /* @__PURE__ */ new Set();
      for (const h of had) {
        const k = h.key.toLowerCase();
        if (seen.has(`${k}=${h.value}`)) continue;
        seen.add(`${k}=${h.value}`);
        const ours = tags[k.replace(/^utm_/, "")];
        if (ours === h.value && h.key === k && (counts.get(k) ?? 0) === 1) continue;
        detail.push(ours !== void 0 ? `Your URL already has ${h.key}=${h.value}. We\u2019ll replace it with ${ours}.` : `Your URL already has ${h.key}=${h.value}${(counts.get(k) ?? 0) > 1 ? " more than once" : ""}. We\u2019ll keep it.`);
      }
      const replaced = detail.length > 0 && (had.some((h) => tags[h.key.toLowerCase().replace(/^utm_/, "")] !== void 0) || [...counts.values()].some((n) => n > 1));
      if (replaced) warnings.push({ id: "duplicate", text: detail[0], detail: detail.slice(1) });
      for (const h of had) if (tags[h.key.toLowerCase().replace(/^utm_/, "")] !== void 0) url.searchParams.delete(h.key);
    }
    for (const k of TAGS) if (tags[k] !== void 0) url.searchParams.set(`utm_${k}`, tags[k]);
    const values = TAGS.map((k) => tags[k]).filter(Boolean);
    if (!opts.lowercase) {
      const mixed = TAGS.filter((k) => tags[k] && tags[k] !== tags[k].toLowerCase()).map((k) => mixedCase(k, tags[k]));
      if (mixed.length) warnings.push({ id: "mixed_case", text: mixed[0], detail: mixed.slice(1), fix: "lowercase" });
    }
    if (values.some((v) => /\s/.test(v))) warnings.push({ id: "spaces", text: opts.sep === "_" ? W.spaces_underscore : W.spaces, fix: "spaces" });
    if (values.some((v) => /[&=?#]/.test(v))) warnings.push({ id: "special_chars", text: W.special_chars });
    if (url.protocol === "http:") warnings.push({ id: "not_https", text: W.not_https });
    if (values.some((v) => /[^\x00-\x7F]/.test(v))) warnings.push({ id: "non_latin", text: W.non_latin });
    const link = url.href;
    if (link.length > LONG_LINK) warnings.push({ id: "long_link", text: W.long_link });
    return { ok: true, link, url, tags, warnings, channel: channelOf(tags), schemeAdded: pu.schemeAdded, tagsCount: values.length };
  }
  var fixSpaces = (v, sep) => v.trim().replace(/\s+/g, sep);
  var CSV_HEADER = ["url", "source", "medium", "campaign", "content", "term"];
  function splitCsv(line) {
    const out = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') q = false;
        else cur += ch;
      } else if (ch === '"' && cur.trim() === "") {
        q = true;
        cur = "";
      } else if (ch === ",") {
        out.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    out.push(cur.trim());
    return out;
  }
  var ERR_TEXT = {
    empty_url: "No URL on this line.",
    invalid_url: W.invalid,
    too_long_url: W.too_long,
    missing_tag: W.missing_tag
  };
  function buildBulk(text, shared, opts) {
    const lines = text.split(/\r?\n/).map((l, i) => ({ line: i + 1, text: l })).filter((l) => l.text.trim() !== "");
    const first = lines[0]?.text.trim().toLowerCase() ?? "";
    const csv = first.startsWith("url,");
    let headerError;
    let body = lines;
    if (csv) {
      const head = splitCsv(lines[0].text).map((h) => h.trim().toLowerCase());
      if (head.length < 4 || head.length > CSV_HEADER.length || head.join(",") !== CSV_HEADER.slice(0, head.length).join(",")) headerError = `Line ${lines[0].line}: the header should be ${CSV_HEADER.join(",")}.`;
      body = lines.slice(1);
    }
    const total = body.length;
    const truncated = total > MAX_ROWS;
    body = body.slice(0, MAX_ROWS);
    const rows = body.map(({ line, text: t }) => {
      if (csv) {
        if (headerError) return { line, input: t, built: null, error: `Line ${line}: fix the header on line ${lines[0].line} first.` };
        const cells2 = splitCsv(t);
        if (cells2.length < 4 || cells2.length > CSV_HEADER.length) {
          return { line, input: t, built: null, error: `Line ${line} has ${cells2.length} column${cells2.length === 1 ? "" : "s"}. Use url,source,medium,campaign and optionally content,term.` };
        }
        const [u, source, medium, campaign, content, term] = cells2;
        const b2 = build(u, { source, medium, campaign, content, term }, opts);
        return b2.ok ? { line, input: u, built: b2 } : { line, input: u, built: b2, error: `Line ${line}: ${ERR_TEXT[b2.error]}` };
      }
      const cells = t.includes(",") ? splitCsv(t) : [];
      if (cells.length >= 3 && parseUrl(cells[0]).ok && !parseUrl(t).ok) {
        return { line, input: t, built: null, error: `Line ${line} looks like CSV. Start with the header ${CSV_HEADER.join(",")}.` };
      }
      const b = build(t, shared, opts);
      return b.ok ? { line, input: t.trim(), built: b } : { line, input: t.trim(), built: b, error: `Line ${line}: ${ERR_TEXT[b.error]}` };
    });
    const groups = /* @__PURE__ */ new Map();
    for (const r of rows) {
      const s = r.built?.ok ? r.built.tags.source : void 0;
      if (!s) continue;
      const k = sourceKey(s);
      if (!groups.has(k)) groups.set(k, /* @__PURE__ */ new Set());
      groups.get(k).add(s);
    }
    const inconsistent = [...groups.values()].filter((g) => g.size > 1).map((g) => [...g]);
    if (inconsistent.length) {
      const bad = new Set(inconsistent.flat());
      for (const r of rows) if (r.built?.ok && bad.has(r.built.tags.source)) r.built.warnings.push({ id: "inconsistent", text: W.inconsistent });
    }
    return { rows, truncated, total, csv, headerError, inconsistent };
  }
  var ALIAS = { twitter: "x", "x.com": "x", "t.co": "x", fb: "facebook", ig: "instagram", yt: "youtube", lnkd: "linkedin", "lnkd.in": "linkedin", "product-hunt": "producthunt", "product hunt": "producthunt", "product_hunt": "producthunt" };
  function sourceKey(s) {
    let k = s.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
    if (ALIAS[k]) return ALIAS[k];
    k = k.replace(/\.(com|co|io|net|org|in|app)$/, "");
    return ALIAS[k] ?? k;
  }
  function toCsv(rows) {
    const esc = (v) => /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    const out = ["url,tagged_url,source,medium,campaign,content,term,warnings"];
    for (const r of rows) {
      if (!r.built?.ok) continue;
      const b = r.built;
      out.push([r.input, b.link, b.tags.source ?? "", b.tags.medium ?? "", b.tags.campaign ?? "", b.tags.content ?? "", b.tags.term ?? "", String(b.warnings.length)].map(esc).join(","));
    }
    return out.join("\r\n") + "\r\n";
  }
  var tagsBucket = (n) => n <= 3 ? "3" : n === 4 ? "4" : "5+";
  var warningsBucket = (n) => n === 0 ? "0" : n === 1 ? "1" : n <= 3 ? "2-3" : "4+";
  var rowsBucket = (n) => n < 10 ? "<10" : n <= 50 ? "10-50" : "51-200";

  // utm-builder/src/main.ts
  var cap = (_event, _props = {}) => {
  };
  var root = document.querySelector("[data-utm]");
  if (root) init(root);
  function init(root2) {
    const q = (s) => root2.querySelector(s);
    const qa = (s) => [...root2.querySelectorAll(s)];
    const urlIn = q("[data-ub-url]");
    const listIn = q("[data-ub-list]");
    const tagIn = (t) => q(`[data-ub-tag="${t}"]`);
    const lower = q("[data-ub-lower]");
    const qrOn = q("[data-ub-qr]");
    const result = q("[data-ub-result]");
    const bulkRes = q("[data-ub-bulkres]");
    const empty = q("[data-ub-empty]");
    const card = q("[data-ub-card]");
    const missingEl = q("[data-ub-missing]");
    let started = false, touched = false, lastUrlFilled = "", current = null, bulk = null;
    const errSent = /* @__PURE__ */ new Set();
    let checkTimer = 0, lastChecked = "";
    cap("tool_viewed");
    const mode = () => root2.querySelector("[data-ub-mode]:checked")?.value === "bulk" ? "bulk" : "single";
    const sep = () => root2.querySelector("[data-ub-sep]:checked")?.value === "_" ? "_" : "-";
    const presetId = () => root2.querySelector("[data-ub-preset]:checked")?.value ?? "none";
    const tags = () => Object.fromEntries(TAGS.map((t) => [t, tagIn(t).value]));
    const err = (type) => {
      if (!errSent.has(type)) {
        errSent.add(type);
        cap("tool_error", { error_type: type });
      }
    };
    const start = () => {
      if (!started) {
        started = true;
        cap("tool_started");
      }
    };
    const checked = (props) => {
      const key = JSON.stringify(props);
      window.clearTimeout(checkTimer);
      checkTimer = window.setTimeout(() => {
        if (key !== lastChecked) {
          lastChecked = key;
          cap("tool_checked", props);
        }
      }, 900);
    };
    const ids = (ws) => [...new Set(ws.map((w) => w.id))].sort();
    qa("[data-ub-preset]").forEach((r) => r.addEventListener("change", () => {
      const p = PRESETS.find((x) => x.id === r.value);
      if (p) {
        tagIn("source").value = p.source;
        tagIn("medium").value = p.medium;
      }
      touched = true;
      run();
    }));
    const syncPreset = () => {
      const s = tagIn("source").value.trim().toLowerCase(), m = tagIn("medium").value.trim().toLowerCase();
      const match = PRESETS.find((p) => p.source === s && p.medium === m);
      const cur = root2.querySelector("[data-ub-preset]:checked");
      if (match) {
        const el = root2.querySelector(`[data-ub-preset][value="${match.id}"]`);
        if (el) el.checked = true;
      } else if (cur && (s || m)) {
        const el = root2.querySelector('[data-ub-preset][value="custom"]');
        if (el) el.checked = true;
      }
    };
    root2.addEventListener("input", (e) => {
      const t = e.target;
      if (t.matches("[data-ub-tag]")) {
        touched = true;
        if (t.matches('[data-ub-tag="source"], [data-ub-tag="medium"]')) syncPreset();
      }
      if (t === urlIn) fillFromUrl();
      if (t.matches("[data-ub-tag], [data-ub-url], [data-ub-list]")) run();
    });
    root2.addEventListener("change", (e) => {
      const t = e.target;
      if (t.matches("[data-ub-mode], [data-ub-lower], [data-ub-sep], [data-ub-qr]")) run();
    });
    function fillFromUrl() {
      const pu = parseUrl(urlIn.value);
      if (!pu.ok || urlIn.value === lastUrlFilled) return;
      const had = existingTags(pu.url);
      if (!had.length) return;
      lastUrlFilled = urlIn.value;
      for (const h of had) {
        const k = h.key.toLowerCase().replace(/^utm_/, "");
        if (TAGS.includes(k) && !tagIn(k).value.trim()) tagIn(k).value = h.value;
      }
      syncPreset();
    }
    root2.addEventListener("click", (e) => {
      const b = e.target.closest("[data-ub-fix]");
      if (!b) return;
      for (const t of TAGS) {
        const el = tagIn(t);
        el.value = b.dataset.ubFix === "lowercase" ? el.value.toLowerCase() : fixSpaces(el.value, sep());
      }
      syncPreset();
      run();
    });
    function warnList(ul, ws) {
      ul.replaceChildren(...ws.map((w) => {
        const li = document.createElement("li");
        const p = document.createElement("p");
        p.textContent = w.text;
        li.append(p);
        for (const d of w.detail ?? []) {
          const x = document.createElement("p");
          x.className = "ub-detail";
          x.textContent = d;
          li.append(x);
        }
        if (w.fix) {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "btn btn--paper ub-fix";
          btn.dataset.ubFix = w.fix;
          btn.textContent = w.fix === "lowercase" ? "Make lowercase" : sep() === "_" ? "Use an underscore" : "Use a hyphen";
          li.append(btn);
        }
        return li;
      }));
    }
    function landsLine(el, b) {
      const a = document.createElement("a");
      a.href = URL_CHANNELS;
      a.rel = "noopener";
      if (b.channel.label) {
        a.textContent = "Google\u2019s rule";
        el.replaceChildren(`${landsIn(b.channel)} (`, a, ").");
      } else {
        a.textContent = "Google\u2019s default channel rules";
        el.replaceChildren(`${landsIn(b.channel)} See `, a, ".");
      }
    }
    const showMissing = (missing) => {
      missingEl.textContent = touched && missing?.length ? `Add ${missing.map((m) => `utm_${m}`).join(", ")}. ${W.missing_tag}` : "";
      if (touched && missing?.length) err("missing_tag");
    };
    function run() {
      const m = mode();
      qa("[data-ub-single]").forEach((el) => {
        el.hidden = m !== "single";
      });
      qa("[data-ub-bulk]").forEach((el) => {
        el.hidden = m !== "bulk";
      });
      const csvMode = m === "bulk" && listIn.value.trimStart().toLowerCase().startsWith("url,");
      qa("[data-ub-tags]").forEach((el) => {
        el.hidden = csvMode;
      });
      q(".ub-presets").hidden = csvMode;
      q("[data-ub-csvnote]").hidden = !csvMode;
      if (m === "single") runSingle();
      else runBulk();
    }
    function runSingle() {
      bulkRes.hidden = true;
      bulk = null;
      const raw = urlIn.value;
      const urlErr = q('[data-ub-err="url"]'), note = q("[data-ub-urlnote]");
      const show = (ok) => {
        result.hidden = !ok;
        empty.hidden = ok;
        card.hidden = !ok;
      };
      if (!raw.trim()) {
        urlErr.textContent = "";
        note.textContent = "";
        urlIn.setAttribute("aria-invalid", "false");
        current = null;
        show(false);
        showMissing(void 0);
        return;
      }
      const b = build(raw, tags(), { lowercase: lower.checked, sep: sep() });
      if (!b.ok && (b.error === "invalid_url" || b.error === "empty_url" || b.error === "too_long_url")) {
        urlErr.textContent = b.error === "too_long_url" ? W.too_long : W.invalid;
        note.textContent = "";
        urlIn.setAttribute("aria-invalid", "true");
        err("invalid_url");
        current = null;
        show(false);
        showMissing(void 0);
        return;
      }
      start();
      urlErr.textContent = "";
      urlIn.setAttribute("aria-invalid", "false");
      note.textContent = b.schemeAdded ? W.scheme : "";
      if (!b.ok) {
        current = null;
        show(false);
        showMissing(b.missing);
        return;
      }
      showMissing(void 0);
      current = b;
      show(true);
      q("[data-ub-link]").textContent = b.link;
      q("[data-ub-copied]").textContent = "";
      landsLine(q("[data-ub-lands]"), b);
      warnList(q("[data-ub-warns]"), b.warnings);
      renderQr(b.link);
      checked({ mode: "single", preset: presetId(), tags_count: tagsBucket(b.tagsCount), warnings_bucket: warningsBucket(b.warnings.length), warning_types: ids(b.warnings), channel: b.channel.channel });
    }
    function runBulk() {
      result.hidden = true;
      current = null;
      const listErr = q('[data-ub-err="list"]');
      const text = listIn.value;
      if (!text.trim()) {
        bulkRes.hidden = true;
        empty.hidden = false;
        card.hidden = true;
        listErr.textContent = "";
        showMissing(void 0);
        bulk = null;
        return;
      }
      const res = buildBulk(text, tags(), { lowercase: lower.checked, sep: sep() });
      bulk = res;
      const good = res.rows.filter((r) => r.built?.ok);
      if (res.rows.some((r) => parseUrl(r.input).ok)) start();
      const missing = !res.csv ? ["source", "medium", "campaign"].filter((t) => !tagIn(t).value.trim()) : [];
      if (missing.length) {
        bulkRes.hidden = true;
        empty.hidden = false;
        card.hidden = true;
        listErr.textContent = "";
        touched = touched || res.rows.length > 0;
        showMissing(missing);
        return;
      }
      showMissing(void 0);
      const msgs = [];
      if (res.headerError) {
        msgs.push(res.headerError);
        err("bad_csv");
      }
      if (res.rows.some((r) => r.error && /column|looks like CSV/.test(r.error))) err("bad_csv");
      if (res.rows.some((r) => r.built && !r.built.ok && (r.built.error === "invalid_url" || r.built.error === "too_long_url"))) err("invalid_url");
      if (res.rows.some((r) => r.built && !r.built.ok && r.built.error === "missing_tag")) err("missing_tag");
      if (res.truncated) {
        msgs.push(`You pasted ${res.total} lines. We built the first ${MAX_ROWS}.`);
        err("too_many_rows");
      }
      listErr.textContent = msgs.join(" ");
      bulkRes.hidden = false;
      empty.hidden = true;
      card.hidden = !good.length;
      const bad = res.rows.length - good.length;
      q("[data-ub-bsum]").textContent = `${good.length} link${good.length === 1 ? "" : "s"} built${bad ? `, ${bad} line${bad === 1 ? "" : "s"} to fix` : ""}`;
      const notes = res.inconsistent.map((g) => ({ id: "inconsistent", text: W.inconsistent, detail: [g.join(" and ")] }));
      if (res.truncated) notes.push({ id: "long_link", text: `Only the first ${MAX_ROWS} lines were built.` });
      warnList(q("[data-ub-bnotes]"), notes);
      q("[data-ub-bcopied]").textContent = "";
      q("[data-ub-rows]").replaceChildren(...res.rows.map((r) => {
        const tr = document.createElement("tr");
        const td = (label, text2, cls = "") => {
          const c = document.createElement("td");
          c.dataset.label = label;
          if (cls) c.className = cls;
          c.textContent = text2;
          return c;
        };
        if (r.built?.ok) {
          const w = r.built.warnings;
          const wt = td("Warnings", w.length ? `${w.length}: ${[...new Set(w.flatMap((x) => x.id === "mixed_case" ? [x.text, ...x.detail ?? []] : [x.text]))].join(" ")}` : "None");
          tr.append(td("Line", String(r.line)), td("Tagged link", r.built.link, "ub-cell-link"), wt);
        } else {
          tr.className = "is-bad";
          tr.append(td("Line", String(r.line)), td("Input", r.input, "ub-cell-link"), td("Problem", r.error ?? W.invalid));
        }
        return tr;
      }));
      q("[data-ub-copyall]").disabled = !good.length;
      q("[data-ub-csv]").disabled = !good.length;
      if (good.length) {
        const all = good.flatMap((r) => r.built?.ok ? r.built.warnings : []);
        const first = good[0].built;
        const maxTags = Math.max(...good.map((r) => r.built?.ok ? r.built.tagsCount : 3));
        checked({ mode: "bulk", preset: res.csv ? "none" : presetId(), tags_count: tagsBucket(maxTags), warnings_bucket: warningsBucket(all.length), warning_types: ids(all), rows_bucket: rowsBucket(res.rows.length), channel: first.channel.channel });
      }
    }
    async function copy(text, out, action) {
      try {
        await navigator.clipboard.writeText(text);
        out.textContent = "Copied";
        cap("tool_completed", { action });
      } catch {
        out.textContent = "Couldn\u2019t copy. Select the link and copy it yourself.";
      }
    }
    q("[data-ub-copy]").addEventListener("click", () => {
      if (current?.ok) copy(current.link, q("[data-ub-copied]"), "copy");
    });
    q("[data-ub-copyall]").addEventListener("click", () => {
      if (!bulk) return;
      const links = bulk.rows.flatMap((r) => r.built?.ok ? [r.built.link] : []);
      if (links.length) copy(links.join("\n"), q("[data-ub-bcopied]"), "copy_all");
    });
    const download = (blob, name) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.append(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(a.href), 4e3);
    };
    q("[data-ub-csv]").addEventListener("click", () => {
      if (!bulk) return;
      download(new Blob([toCsv(bulk.rows)], { type: "text/csv;charset=utf-8" }), "utm-links.csv");
      cap("tool_completed", { action: "csv" });
    });
    let qrLib = null;
    const lib = () => qrLib ?? (qrLib = Promise.resolve().then(() => __toESM(require_browser(), 1)).then((m) => m.default ?? m));
    const qrBox = q("[data-ub-qrbox]");
    const canvas = q("[data-ub-canvas]");
    const qrOpts = (link) => ({ errorCorrectionLevel: link.length > 1200 ? "L" : "M", margin: 2 });
    let qrFor = "";
    function renderQr(link) {
      qrBox.hidden = !qrOn.checked;
      if (!qrOn.checked) return;
      q("[data-ub-qrdense]").hidden = link.length <= QR_DENSE;
      if (qrFor === link) return;
      qrFor = link;
      lib().then((QRCode) => QRCode.toCanvas(canvas, link, { ...qrOpts(link), width: 240 })).then(() => {
        q("[data-ub-qrnote]").textContent = W.qr_note;
        qa("[data-ub-png], [data-ub-svg]").forEach((b) => {
          b.disabled = false;
        });
      }).catch(() => {
        q("[data-ub-qrnote]").textContent = "This link is too long for a QR code. Try a shorter campaign name.";
        qa("[data-ub-png], [data-ub-svg]").forEach((b) => {
          b.disabled = true;
        });
      });
    }
    q("[data-ub-png]").addEventListener("click", async () => {
      if (!current?.ok) return;
      const QRCode = await lib();
      const big = document.createElement("canvas");
      await QRCode.toCanvas(big, current.link, { ...qrOpts(current.link), width: 1024 });
      big.toBlob((blob) => {
        if (blob) {
          download(blob, "utm-qr.png");
          cap("tool_completed", { action: "qr_png" });
        }
      }, "image/png");
    });
    q("[data-ub-svg]").addEventListener("click", async () => {
      if (!current?.ok) return;
      const QRCode = await lib();
      const svg = await QRCode.toString(current.link, { ...qrOpts(current.link), type: "svg" });
      download(new Blob([svg], { type: "image/svg+xml" }), "utm-qr.svg");
      cap("tool_completed", { action: "qr_svg" });
    });
    document.querySelectorAll("[data-ub-cta]").forEach((el) => el.addEventListener("click", () => cap("cta_clicked", { placement: el.dataset.ubCta })));
    run();
  }
})();
