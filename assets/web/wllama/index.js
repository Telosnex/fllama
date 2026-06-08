var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __knownSymbol = (name, symbol) => (symbol = Symbol[name]) ? symbol : Symbol.for("Symbol." + name);
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
var __await = function(promise, isYieldStar) {
  this[0] = promise;
  this[1] = isYieldStar;
};
var __asyncGenerator = (__this, __arguments, generator) => {
  var resume = (k, v, yes, no) => {
    try {
      var x = generator[k](v), isAwait = (v = x.value) instanceof __await, done = x.done;
      Promise.resolve(isAwait ? v[0] : v).then((y) => isAwait ? resume(k === "return" ? k : "next", v[1] ? { done: y.done, value: y.value } : y, yes, no) : yes({ value: y, done })).catch((e) => resume("throw", e, yes, no));
    } catch (e) {
      no(e);
    }
  }, method = (k) => it[k] = (x) => new Promise((yes, no) => resume(k, x, yes, no)), it = {};
  return generator = generator.apply(__this, __arguments), it[__knownSymbol("asyncIterator")] = () => it, method("next"), method("throw"), method("return"), it;
};
var __forAwait = (obj, it, method) => (it = obj[__knownSymbol("asyncIterator")]) ? it.call(obj) : (obj = obj[__knownSymbol("iterator")](), it = {}, method = (key, fn) => (fn = obj[key]) && (it[key] = (arg) => new Promise((yes, no, done) => (arg = fn.call(obj, arg), done = arg.done, Promise.resolve(arg.value).then((value) => yes({ value, done }), no)))), method("next"), method("return"), it);

// src/glue/messages.ts
var GLUE_VERSION = 1;
var GLUE_MESSAGE_PROTOTYPES = {
  "erro_evt": {
    "name": "erro_evt",
    "structName": "glue_msg_error",
    "className": "GlueMsgError",
    "fields": [
      {
        "type": "str",
        "name": "message",
        "isNullable": false
      }
    ]
  },
  "load_req": {
    "name": "load_req",
    "structName": "glue_msg_load_req",
    "className": "GlueMsgLoadReq",
    "fields": [
      {
        "type": "arr_str",
        "name": "model_paths",
        "isNullable": false
      },
      {
        "type": "str",
        "name": "mmproj_path",
        "isNullable": true
      },
      {
        "type": "bool",
        "name": "n_ctx_auto",
        "isNullable": false
      },
      {
        "type": "bool",
        "name": "use_mmap",
        "isNullable": false
      },
      {
        "type": "bool",
        "name": "use_mlock",
        "isNullable": false
      },
      {
        "type": "int",
        "name": "n_gpu_layers",
        "isNullable": false
      },
      {
        "type": "int",
        "name": "n_ctx",
        "isNullable": false
      },
      {
        "type": "int",
        "name": "n_threads",
        "isNullable": false
      },
      {
        "type": "str",
        "name": "model_alias",
        "isNullable": true
      },
      {
        "type": "int",
        "name": "log_level",
        "isNullable": true
      },
      {
        "type": "bool",
        "name": "embeddings",
        "isNullable": true
      },
      {
        "type": "bool",
        "name": "offload_kqv",
        "isNullable": true
      },
      {
        "type": "int",
        "name": "n_batch",
        "isNullable": true
      },
      {
        "type": "int",
        "name": "n_ubatch",
        "isNullable": true
      },
      {
        "type": "int",
        "name": "n_parallel",
        "isNullable": true
      },
      {
        "type": "str",
        "name": "pooling_type",
        "isNullable": true
      },
      {
        "type": "str",
        "name": "rope_scaling_type",
        "isNullable": true
      },
      {
        "type": "float",
        "name": "rope_freq_base",
        "isNullable": true
      },
      {
        "type": "float",
        "name": "rope_freq_scale",
        "isNullable": true
      },
      {
        "type": "float",
        "name": "yarn_ext_factor",
        "isNullable": true
      },
      {
        "type": "float",
        "name": "yarn_attn_factor",
        "isNullable": true
      },
      {
        "type": "float",
        "name": "yarn_beta_fast",
        "isNullable": true
      },
      {
        "type": "float",
        "name": "yarn_beta_slow",
        "isNullable": true
      },
      {
        "type": "int",
        "name": "yarn_orig_ctx",
        "isNullable": true
      },
      {
        "type": "str",
        "name": "cache_type_k",
        "isNullable": true
      },
      {
        "type": "str",
        "name": "cache_type_v",
        "isNullable": true
      },
      {
        "type": "bool",
        "name": "kv_unified",
        "isNullable": true
      },
      {
        "type": "bool",
        "name": "flash_attn",
        "isNullable": true
      },
      {
        "type": "bool",
        "name": "swa_full",
        "isNullable": true
      },
      {
        "type": "int",
        "name": "n_ctx_checkpoints",
        "isNullable": true
      },
      {
        "type": "int",
        "name": "checkpoint_min_step",
        "isNullable": true
      },
      {
        "type": "str",
        "name": "chat_template",
        "isNullable": true
      },
      {
        "type": "bool",
        "name": "jinja",
        "isNullable": true
      },
      {
        "type": "arr_str",
        "name": "default_template_kwargs_keys",
        "isNullable": true
      },
      {
        "type": "arr_str",
        "name": "default_template_kwargs_vals",
        "isNullable": true
      },
      {
        "type": "bool",
        "name": "reasoning",
        "isNullable": true
      },
      {
        "type": "int",
        "name": "image_min_tokens",
        "isNullable": true
      },
      {
        "type": "int",
        "name": "image_max_tokens",
        "isNullable": true
      },
      {
        "type": "bool",
        "name": "warmup",
        "isNullable": true
      },
      {
        "type": "bool",
        "name": "no_kv_offload",
        "isNullable": true
      },
      {
        "type": "bool",
        "name": "mmproj_offload",
        "isNullable": true
      },
      {
        "type": "bool",
        "name": "cont_batching",
        "isNullable": true
      },
      {
        "type": "int",
        "name": "n_keep",
        "isNullable": true
      },
      {
        "type": "bool",
        "name": "ctx_shift",
        "isNullable": true
      },
      {
        "type": "bool",
        "name": "cache_idle_slots",
        "isNullable": true
      },
      {
        "type": "int",
        "name": "n_cache_reuse",
        "isNullable": true
      },
      {
        "type": "arr_str",
        "name": "lora_paths",
        "isNullable": true
      },
      {
        "type": "arr_float",
        "name": "lora_scales",
        "isNullable": true
      },
      {
        "type": "bool",
        "name": "lora_init_without_apply",
        "isNullable": true
      },
      {
        "type": "str",
        "name": "spec_draft_model",
        "isNullable": true
      },
      {
        "type": "int",
        "name": "spec_draft_ngl",
        "isNullable": true
      },
      {
        "type": "int",
        "name": "spec_draft_n_max",
        "isNullable": true
      },
      {
        "type": "int",
        "name": "spec_draft_n_min",
        "isNullable": true
      },
      {
        "type": "float",
        "name": "spec_draft_p_min",
        "isNullable": true
      },
      {
        "type": "int",
        "name": "spec_draft_threads",
        "isNullable": true
      },
      {
        "type": "int",
        "name": "spec_draft_threads_batch",
        "isNullable": true
      },
      {
        "type": "arr_str",
        "name": "kv_overrides_keys",
        "isNullable": true
      },
      {
        "type": "arr_str",
        "name": "kv_overrides_vals",
        "isNullable": true
      },
      {
        "type": "int",
        "name": "reasoning_budget_tokens",
        "isNullable": true
      },
      {
        "type": "str",
        "name": "reasoning_budget_message",
        "isNullable": true
      },
      {
        "type": "str",
        "name": "reasoning_format",
        "isNullable": true
      },
      {
        "type": "bool",
        "name": "skip_chat_parsing",
        "isNullable": true
      },
      {
        "type": "bool",
        "name": "prefill_assistant",
        "isNullable": true
      }
    ]
  },
  "load_res": {
    "name": "load_res",
    "structName": "glue_msg_load_res",
    "className": "GlueMsgLoadRes",
    "fields": [
      {
        "type": "bool",
        "name": "success",
        "isNullable": false
      },
      {
        "type": "int",
        "name": "n_ctx",
        "isNullable": false
      },
      {
        "type": "int",
        "name": "n_batch",
        "isNullable": false
      },
      {
        "type": "int",
        "name": "n_ubatch",
        "isNullable": false
      },
      {
        "type": "int",
        "name": "n_vocab",
        "isNullable": false
      },
      {
        "type": "int",
        "name": "n_ctx_train",
        "isNullable": false
      },
      {
        "type": "int",
        "name": "n_embd",
        "isNullable": false
      },
      {
        "type": "int",
        "name": "n_layer",
        "isNullable": false
      },
      {
        "type": "arr_str",
        "name": "metadata_key",
        "isNullable": false
      },
      {
        "type": "arr_str",
        "name": "metadata_val",
        "isNullable": false
      },
      {
        "type": "int",
        "name": "token_bos",
        "isNullable": false
      },
      {
        "type": "int",
        "name": "token_eos",
        "isNullable": false
      },
      {
        "type": "int",
        "name": "token_eot",
        "isNullable": false
      },
      {
        "type": "arr_int",
        "name": "list_tokens_eog",
        "isNullable": false
      },
      {
        "type": "bool",
        "name": "add_bos_token",
        "isNullable": false
      },
      {
        "type": "bool",
        "name": "add_eos_token",
        "isNullable": false
      },
      {
        "type": "bool",
        "name": "has_encoder",
        "isNullable": false
      },
      {
        "type": "int",
        "name": "token_decoder_start",
        "isNullable": false
      },
      {
        "type": "str",
        "name": "media_marker",
        "isNullable": false
      },
      {
        "type": "bool",
        "name": "has_image_input",
        "isNullable": false
      },
      {
        "type": "bool",
        "name": "has_audio_input",
        "isNullable": false
      }
    ]
  },
  "cmpl_req": {
    "name": "cmpl_req",
    "structName": "glue_msg_completion_req",
    "className": "GlueMsgCompletionReq",
    "fields": [
      {
        "type": "bool",
        "name": "is_chat",
        "isNullable": false
      },
      {
        "type": "str",
        "name": "data_json",
        "isNullable": false
      },
      {
        "type": "arr_raw",
        "name": "files",
        "isNullable": false
      }
    ]
  },
  "cmpl_res": {
    "name": "cmpl_res",
    "structName": "glue_msg_completion_res",
    "className": "GlueMsgCompletionRes",
    "fields": [
      {
        "type": "bool",
        "name": "success",
        "isNullable": false
      },
      {
        "type": "int",
        "name": "request_id",
        "isNullable": false
      }
    ]
  },
  "embd_req": {
    "name": "embd_req",
    "structName": "glue_msg_embedding_req",
    "className": "GlueMsgEmbeddingReq",
    "fields": [
      {
        "type": "str",
        "name": "data_json",
        "isNullable": false
      },
      {
        "type": "arr_raw",
        "name": "files",
        "isNullable": false
      }
    ]
  },
  "embd_res": {
    "name": "embd_res",
    "structName": "glue_msg_embedding_res",
    "className": "GlueMsgEmbeddingRes",
    "fields": [
      {
        "type": "bool",
        "name": "success",
        "isNullable": false
      },
      {
        "type": "int",
        "name": "request_id",
        "isNullable": false
      }
    ]
  },
  "rrnk_req": {
    "name": "rrnk_req",
    "structName": "glue_msg_rerank_req",
    "className": "GlueMsgRerankReq",
    "fields": [
      {
        "type": "str",
        "name": "data_json",
        "isNullable": false
      }
    ]
  },
  "rrnk_res": {
    "name": "rrnk_res",
    "structName": "glue_msg_rerank_res",
    "className": "GlueMsgRerankRes",
    "fields": [
      {
        "type": "bool",
        "name": "success",
        "isNullable": false
      },
      {
        "type": "int",
        "name": "request_id",
        "isNullable": false
      }
    ]
  },
  "gres_req": {
    "name": "gres_req",
    "structName": "glue_msg_get_result_req",
    "className": "GlueMsgGetResultReq",
    "fields": [
      {
        "type": "int",
        "name": "request_id",
        "isNullable": false
      }
    ]
  },
  "gres_res": {
    "name": "gres_res",
    "structName": "glue_msg_get_result_res",
    "className": "GlueMsgGetResultRes",
    "fields": [
      {
        "type": "bool",
        "name": "success",
        "isNullable": false
      },
      {
        "type": "bool",
        "name": "has_more",
        "isNullable": false
      },
      {
        "type": "bool",
        "name": "is_error",
        "isNullable": false
      },
      {
        "type": "str",
        "name": "data_json",
        "isNullable": false
      }
    ]
  },
  "grrr_req": {
    "name": "grrr_req",
    "structName": "glue_msg_release_result_reader_req",
    "className": "GlueMsgReleaseResultReaderReq",
    "fields": [
      {
        "type": "int",
        "name": "request_id",
        "isNullable": false
      }
    ]
  },
  "grrr_res": {
    "name": "grrr_res",
    "structName": "glue_msg_release_result_reader_res",
    "className": "GlueMsgReleaseResultReaderRes",
    "fields": [
      {
        "type": "bool",
        "name": "success",
        "isNullable": false
      }
    ]
  },
  "tbop_req": {
    "name": "tbop_req",
    "structName": "glue_msg_test_backend_ops_req",
    "className": "GlueMsgTestBackendOpsReq",
    "fields": [
      {
        "type": "arr_str",
        "name": "args",
        "isNullable": false
      }
    ]
  },
  "tbop_res": {
    "name": "tbop_res",
    "structName": "glue_msg_test_backend_ops_res",
    "className": "GlueMsgTestBackendOpsRes",
    "fields": [
      {
        "type": "int",
        "name": "retcode",
        "isNullable": false
      },
      {
        "type": "bool",
        "name": "success",
        "isNullable": false
      }
    ]
  }
};

// src/glue/glue.ts
var GLUE_MAGIC = new Uint8Array([71, 76, 85, 69]);
var GLUE_DTYPE_NULL = 0;
var GLUE_DTYPE_BOOL = 1;
var GLUE_DTYPE_INT = 2;
var GLUE_DTYPE_FLOAT = 3;
var GLUE_DTYPE_STRING = 4;
var GLUE_DTYPE_RAW = 5;
var GLUE_DTYPE_ARRAY_BOOL = 6;
var GLUE_DTYPE_ARRAY_INT = 7;
var GLUE_DTYPE_ARRAY_FLOAT = 8;
var GLUE_DTYPE_ARRAY_STRING = 9;
var GLUE_DTYPE_ARRAY_RAW = 10;
var TYPE_MAP = {
  str: GLUE_DTYPE_STRING,
  int: GLUE_DTYPE_INT,
  float: GLUE_DTYPE_FLOAT,
  bool: GLUE_DTYPE_BOOL,
  raw: GLUE_DTYPE_RAW,
  arr_str: GLUE_DTYPE_ARRAY_STRING,
  arr_int: GLUE_DTYPE_ARRAY_INT,
  arr_float: GLUE_DTYPE_ARRAY_FLOAT,
  arr_bool: GLUE_DTYPE_ARRAY_BOOL,
  arr_raw: GLUE_DTYPE_ARRAY_RAW,
  null: GLUE_DTYPE_NULL
};
function glueDeserialize(buf) {
  let offset = 0;
  const view = new DataView(buf.buffer);
  const readUint32 = () => {
    const value = view.getUint32(offset, true);
    offset += 4;
    return value;
  };
  const readInt32 = () => {
    const value = view.getInt32(offset, true);
    offset += 4;
    return value;
  };
  const readFloat = () => {
    const value = view.getFloat32(offset, true);
    offset += 4;
    return value;
  };
  const readBool = () => {
    return readUint32() !== 0;
  };
  const readString = (customLen) => {
    const length = customLen != null ? customLen : readUint32();
    const value = new TextDecoder().decode(buf.slice(offset, offset + length));
    offset += length;
    return value;
  };
  const readRaw = () => {
    const length = readUint32();
    const value = buf.slice(offset, offset + length);
    offset += length;
    return value;
  };
  const readArray = (readItem) => {
    const length = readUint32();
    const value = new Array(length);
    for (let i = 0; i < length; i++) {
      value[i] = readItem();
    }
    return value;
  };
  const readNull = () => null;
  const readField = (field) => {
    switch (field.type) {
      case "str":
        return readString();
      case "int":
        return readInt32();
      case "float":
        return readFloat();
      case "bool":
        return readBool();
      case "raw":
        return readRaw();
      case "arr_str":
        return readArray(readString);
      case "arr_int":
        return readArray(readInt32);
      case "arr_float":
        return readArray(readFloat);
      case "arr_bool":
        return readArray(readBool);
      case "arr_raw":
        return readArray(readRaw);
      case "null":
        return readNull();
    }
  };
  const magicValid = buf[0] === GLUE_MAGIC[0] && buf[1] === GLUE_MAGIC[1] && buf[2] === GLUE_MAGIC[2] && buf[3] === GLUE_MAGIC[3];
  offset += 4;
  if (!magicValid) {
    throw new Error("Invalid magic number");
  }
  const version = readUint32();
  if (version !== GLUE_VERSION) {
    throw new Error("Invalid version number");
  }
  const name = readString(8);
  const msgProto = GLUE_MESSAGE_PROTOTYPES[name];
  if (!msgProto) {
    throw new Error(`Unknown message name: ${name}`);
  }
  const output = { _name: name };
  for (const field of msgProto.fields) {
    const readType = readUint32();
    if (readType === GLUE_DTYPE_NULL) {
      if (!field.isNullable) {
        throw new Error(
          `${name}: Expect field ${field.name} to be non-nullable`
        );
      }
      output[field.name] = null;
      continue;
    }
    if (readType !== TYPE_MAP[field.type]) {
      throw new Error(
        `${name}: Expect field ${field.name} to have type ${field.type}`
      );
    }
    output[field.name] = readField(field);
  }
  return output;
}
function glueSerialize(msg) {
  const msgProto = GLUE_MESSAGE_PROTOTYPES[msg._name];
  if (!msgProto) {
    throw new Error(`Unknown message name: ${msg._name}`);
  }
  const bufs = [];
  const writeUint32 = (value) => {
    const buf = new ArrayBuffer(4);
    new DataView(buf).setUint32(0, value, true);
    bufs.push(new Uint8Array(buf));
  };
  const writeInt32 = (value) => {
    const buf = new ArrayBuffer(4);
    new DataView(buf).setInt32(0, value, true);
    bufs.push(new Uint8Array(buf));
  };
  const writeFloat = (value) => {
    const buf = new ArrayBuffer(4);
    new DataView(buf).setFloat32(0, value, true);
    bufs.push(new Uint8Array(buf));
  };
  const writeBool = (value) => {
    writeUint32(value ? 1 : 0);
  };
  const writeString = (value) => {
    const utf8 = new TextEncoder().encode(value);
    writeUint32(utf8.byteLength);
    bufs.push(utf8);
  };
  const writeRaw = (value) => {
    writeUint32(value.byteLength);
    bufs.push(value);
  };
  const writeArray = (value, writeItem) => {
    writeUint32(value.length);
    for (const item of value) {
      writeItem(item);
    }
  };
  const writeNull = () => {
  };
  bufs.push(GLUE_MAGIC);
  writeUint32(GLUE_VERSION);
  {
    const utf8 = new TextEncoder().encode(msg._name);
    bufs.push(utf8);
  }
  for (const field of msgProto.fields) {
    const val = msg[field.name];
    if (!field.isNullable && (val === null || val === void 0)) {
      throw new Error(
        `${msg._name}: Expect field ${field.name} to be non-nullable`
      );
    }
    if (val === null || val === void 0) {
      writeUint32(GLUE_DTYPE_NULL);
      continue;
    }
    writeUint32(TYPE_MAP[field.type]);
    switch (field.type) {
      case "str":
        writeString(val);
        break;
      case "int":
        writeInt32(val);
        break;
      case "float":
        writeFloat(val);
        break;
      case "bool":
        writeBool(val);
        break;
      case "raw":
        writeRaw(val);
        break;
      case "arr_str":
        writeArray(val, writeString);
        break;
      case "arr_int":
        writeArray(val, writeInt32);
        break;
      case "arr_float":
        writeArray(val, writeFloat);
        break;
      case "arr_bool":
        writeArray(val, writeBool);
        break;
      case "arr_raw":
        writeArray(val, writeRaw);
        break;
      case "null":
        writeNull();
        break;
    }
  }
  const totalLength = bufs.reduce((acc, buf) => acc + buf.byteLength, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of bufs) {
    output.set(buf, offset);
    offset += buf.byteLength;
  }
  return output;
}

// src/wasm/source-map.ts
var WASM_SOURCE_MAP = {
  "default": "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",
  "compat": "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"
};

// src/debug.ts
var cache = /* @__PURE__ */ new Map();
function loadMap(buildKey) {
  return __async(this, null, function* () {
    if (cache.has(buildKey)) return cache.get(buildKey);
    const b64 = WASM_SOURCE_MAP[buildKey];
    if (!b64) throw new Error(`No source map for build "${buildKey}"`);
    const gzipped = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const ds = new DecompressionStream("gzip");
    const writer = ds.writable.getWriter();
    writer.write(gzipped);
    writer.close();
    const buf = yield new Response(ds.readable).arrayBuffer();
    const dv = new DataView(buf);
    const bytes = new Uint8Array(buf);
    const firstId = dv.getUint32(0, true);
    const funcCount = dv.getUint32(4, true);
    const numNames = dv.getUint32(8, true);
    const td = new TextDecoder();
    const names = [];
    let pos = 12;
    for (let i = 0; i < numNames; i++) {
      const len = bytes[pos++];
      names.push(td.decode(bytes.subarray(pos, pos + len)));
      pos += len;
    }
    const funcNames = [];
    for (let i = 0; i < funcCount; i++) {
      const idx = dv.getUint16(pos, true);
      pos += 2;
      funcNames.push(idx === 65535 ? null : names[idx]);
    }
    const entry = { firstId, funcNames };
    cache.set(buildKey, entry);
    return entry;
  });
}
var Debug = {
  /**
   * Resolves a list of wasm function indices to their cleaned symbol names.
   */
  decodeFuncIds: (funcIds, isCompatBuild) => __async(void 0, null, function* () {
    const buildKey = isCompatBuild ? "compat" : "default";
    const { firstId, funcNames } = yield loadMap(buildKey);
    return funcIds.map((funcId) => {
      const i = funcId - firstId;
      const name = i >= 0 && i < funcNames.length && funcNames[i] ? funcNames[i] : "(unknown)";
      return { funcId, name };
    });
  }),
  /**
   * Annotates a wasm stack trace string with resolved function names.
   *
   * Example input from Chrome:
   *   at http://localhost:8080/esm/wasm/wllama.wasm:wasm-function[775]:0x74251
   *   at async blob:http://localhost:8080/53a863cc-7227-45cc-8594-ddbbf5257f20:317:28
   *
   * Example input from Firefox:
   *   @http://localhost:8080/esm/wasm/wllama.wasm:wasm-function[796]:0x7dfe2
   *       at wModuleInit/WebAssembly.promising/< (9b6a2acd-d909-44e2-b021-d42fb9087cfb:15:32) index.js:1433:45
   *
   * Example input from Safari:
   *   2441@wasm-function[2441]
   *       at wrapper (d746f19e-4523-4f36-ba06-d0969acc0b05:22:126009)
   *
   * Example output:
   *   wasm-func[775] (server_response::send)
   */
  decodeStackTrace: (stack, isCompatBuild) => __async(void 0, null, function* () {
    const re = /wasm-function\[(\d+)\]/g;
    const funcIds = [
      ...new Set([...stack.matchAll(re)].map((m) => parseInt(m[1])))
    ];
    if (funcIds.length === 0) return stack;
    const resolved = yield Debug.decodeFuncIds(funcIds, isCompatBuild);
    return resolved.map((r) => {
      if (r.name === "(unknown)") {
        return `    wasm-func[${r.funcId}] (unknown)`;
      }
      return `    wasm-func[${r.funcId}] (${r.name})`;
    }).join("\n");
  })
};

// src/utils.ts
var textDecoder = new TextDecoder();
var URL_PARTS_REGEX = /-(\d{5})-of-(\d{5})\.gguf(?:\?.*)?$/;
var parseShardNumber = (fnameOrUrl) => {
  const matches = fnameOrUrl.match(URL_PARTS_REGEX);
  if (!matches) {
    return {
      baseURL: fnameOrUrl,
      current: 1,
      total: 1
    };
  } else {
    return {
      baseURL: fnameOrUrl.replace(URL_PARTS_REGEX, ""),
      current: parseInt(matches[1]),
      total: parseInt(matches[2])
    };
  }
};
var sortFileByShard = (blobs) => {
  const isFiles = blobs.every((b) => !!b.name);
  if (isFiles && blobs.length > 1) {
    const files = blobs;
    files.sort((a, b) => {
      const infoA = parseShardNumber(a.name);
      const infoB = parseShardNumber(b.name);
      return infoA.current - infoB.current;
    });
  }
};
var isMmproj = (blob) => __async(void 0, null, function* () {
  const META_NAME = "general.architecture";
  const META_VAL = "clip";
  const tmp = blob.slice(0, 128 * 1024);
  const header = yield tmp.arrayBuffer();
  const buf = new Uint8Array(header);
  const nameBytes = new TextEncoder().encode(META_NAME);
  const valBytes = new TextEncoder().encode(META_VAL);
  let offset = -1;
  outer: for (let i = 0; i <= buf.length - nameBytes.length; i++) {
    for (let j = 0; j < nameBytes.length; j++) {
      if (buf[i + j] !== nameBytes[j]) continue outer;
    }
    offset = i;
    break;
  }
  if (offset === -1) return false;
  if (offset + 8 * 4 + 4 > buf.length) return false;
  const view = new DataView(header);
  const valLen = view.getBigUint64(offset + 8 * 3, true);
  if (valLen !== /* @__PURE__ */ BigInt("4")) return false;
  for (let i = 0; i < valBytes.length; i++) {
    if (buf[offset + 8 * 4 + i] !== valBytes[i]) return false;
  }
  return true;
});
var absoluteUrl = (relativePath) => new URL(relativePath, document.baseURI).href;
var padDigits = (number, digits) => {
  return Array(Math.max(digits - String(number).length + 1, 0)).join("0") + number;
};
var sumArr = (arr) => arr.reduce((prev, curr) => prev + curr, 0);
var isString = (value) => !!(value == null ? void 0 : value.startsWith);
var MMPROJ_FILE_NAME = "mmproj.gguf";
var prepareBlobs = (blobsInp) => __async(void 0, null, function* () {
  const blobs = [];
  let blobMmproj = null;
  for (const blob of blobsInp) {
    if (yield isMmproj(blob)) {
      blobMmproj = blob;
    } else {
      blobs.push(blob);
    }
  }
  sortFileByShard(blobs);
  const result = blobs.map((blob, i) => ({
    blob,
    name: `model-${padDigits(i + 1, 5)}-of-${padDigits(blobs.length, 5)}.gguf`
  }));
  if (blobMmproj) {
    result.push({
      blob: blobMmproj,
      name: MMPROJ_FILE_NAME
    });
  }
  return {
    llm: result.filter((f) => f.name !== MMPROJ_FILE_NAME),
    mmproj: blobMmproj ? { blob: blobMmproj, name: MMPROJ_FILE_NAME } : null,
    all: result
  };
});
var isSupportMultiThread = () => ((e) => __async(void 0, null, function* () {
  try {
    return "undefined" != typeof MessageChannel && new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)), WebAssembly.validate(e);
  } catch (e2) {
    return false;
  }
}))(
  new Uint8Array([
    0,
    97,
    115,
    109,
    1,
    0,
    0,
    0,
    1,
    4,
    1,
    96,
    0,
    0,
    3,
    2,
    1,
    0,
    5,
    4,
    1,
    3,
    1,
    1,
    10,
    11,
    1,
    9,
    0,
    65,
    0,
    254,
    16,
    2,
    0,
    26,
    11
  ])
);
var isSupportExceptions = () => __async(void 0, null, function* () {
  return WebAssembly.validate(
    new Uint8Array([
      0,
      97,
      115,
      109,
      1,
      0,
      0,
      0,
      1,
      4,
      1,
      96,
      0,
      0,
      3,
      2,
      1,
      0,
      10,
      8,
      1,
      6,
      0,
      6,
      64,
      25,
      11,
      11
    ])
  );
});
var isSupportSIMD = () => __async(void 0, null, function* () {
  return WebAssembly.validate(
    new Uint8Array([
      0,
      97,
      115,
      109,
      1,
      0,
      0,
      0,
      1,
      5,
      1,
      96,
      0,
      1,
      123,
      3,
      2,
      1,
      0,
      10,
      10,
      1,
      8,
      0,
      65,
      0,
      253,
      15,
      253,
      98,
      11
    ])
  );
});
var isSupportJSPI = () => {
  return !!WebAssembly.Suspending;
};
var isSupportWebGPU = () => {
  return !!navigator.gpu;
};
var isSupportMem64 = () => {
  try {
    new WebAssembly.Memory({
      address: "i64",
      initial: /* @__PURE__ */ BigInt("1")
      // 1 page (64 KiB)
    });
    return true;
  } catch (e) {
    return false;
  }
};
var checkEnvironmentCompatible = () => __async(void 0, null, function* () {
  if (!(yield isSupportExceptions())) {
    throw new Error("WebAssembly runtime does not support exception handling");
  }
  if (!(yield isSupportSIMD())) {
    throw new Error("WebAssembly runtime does not support SIMD");
  }
});
var isFirefox = () => {
  return !!navigator.userAgent.match(/Firefox\/([0-9\.]+)(?:\s|$)/);
};
var GGUF_FILE_REGEX = /^.*\.gguf(?:\?.*)?$/;
var isValidGgufFile = (path) => {
  return GGUF_FILE_REGEX.test(path);
};
var isSafariMobile = () => {
  return !!navigator.userAgent.match(/Version\/([0-9\._]+).*Mobile.*Safari.*/);
};
var createWorker = (workerCode) => {
  const workerURL = URL.createObjectURL(
    isString(workerCode) ? new Blob([workerCode], { type: "text/javascript" }) : workerCode
  );
  return new Worker(workerURL, { type: "module" });
};
var cbToAsyncIter = (fn) => (...args) => {
  let values = [];
  let resolve;
  let reject;
  values.push(
    new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    })
  );
  fn(...args, (val, done, err) => {
    if (err) {
      reject(err);
      return;
    }
    resolve([val, done]);
    values.push(
      new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      })
    );
  });
  return function() {
    return __asyncGenerator(this, null, function* () {
      let val;
      for (let i = 0, done = false; !done; i++) {
        [val, done] = yield new __await(values[i]);
        delete values[i];
        if (val !== void 0) yield val;
      }
    });
  }();
};
var canUseAsyncFileRead = (compat) => isSupportJSPI() || compat;
var needCompat = () => !isSupportJSPI() || !isSupportMem64();

// src/workers-code/generated.ts
var LIBLLAMA_VERSION = "b9554-7d49b10";
var LLAMA_CPP_WORKER_CODE = "// Start the main llama.cpp\nlet wllamaMalloc;\nlet wllamaStart;\nlet wllamaAction;\nlet wllamaExit;\nlet wllamaDebug;\n\nlet Module = null;\nlet isCompat = false;\nlet lastStack = '';\nlet isAborted = false;\nlet hasMultithread = false;\n\n//////////////////////////////////////////////////////////////\n// UTILS\n//////////////////////////////////////////////////////////////\n\n// send message back to main thread\nconst msg = (data, transfer) => postMessage(data, transfer);\n\n// Convert CPP log into JS log\nconst cppLogToJSLog = (line) => {\n  const matched = line.match(/@@(DEBUG|INFO|WARN|ERROR)@@(.*)/);\n  return !!matched\n    ? {\n        level: (matched[1] === 'INFO' ? 'debug' : matched[1]).toLowerCase(),\n        text: matched[2],\n      }\n    : { level: 'log', text: line };\n};\n\nconst getHeapU8 = () => {\n  const buffer = Module.wasmMemory.buffer;\n  return new Uint8Array(buffer);\n};\n\nconst toSizeT = (num) => {\n  return isCompat ? Number(num) : BigInt(num);\n};\n\n// Get module config that forwards stdout/err to main thread\nconst getWModuleConfig = (_argMainScriptBlob) => {\n  var pathConfig = RUN_OPTIONS.pathConfig;\n  var pthreadPoolSize = RUN_OPTIONS.nbThread;\n  var argMainScriptBlob = _argMainScriptBlob;\n\n  isCompat = RUN_OPTIONS.compat;\n  hasMultithread = pthreadPoolSize > 1;\n\n  msg({\n    verb: 'console.debug',\n    args: [\n      `Multithread enabled: ${hasMultithread}, pthreadPoolSize: ${pthreadPoolSize}`,\n    ],\n  });\n\n  if (!pathConfig['wllama.wasm']) {\n    throw new Error('\"wllama.wasm\" is missing in pathConfig');\n  }\n  return {\n    noInitialRun: true,\n    print: function (text) {\n      if (arguments.length > 1)\n        text = Array.prototype.slice.call(arguments).join(' ');\n      msg({ verb: 'console.log', args: [text] });\n    },\n    printErr: function (text) {\n      if (arguments.length > 1)\n        text = Array.prototype.slice.call(arguments).join(' ');\n      if (text.startsWith('@@STACK@@')) {\n        lastStack = text.slice('@@STACK@@'.length);\n        return;\n      }\n      const logLine = cppLogToJSLog(text);\n      msg({ verb: 'console.' + logLine.level, args: [logLine.text] });\n    },\n    locateFile: function (filename, basePath) {\n      const p = pathConfig[filename];\n      const truncate = (str) =>\n        str.length > 128 ? `${str.substr(0, 128)}...` : str;\n      if (filename.match(/wllama\\.worker\\.js/)) {\n        msg({\n          verb: 'console.error',\n          args: [\n            '\"wllama.worker.js\" is removed from v2.2.1. Hint: make sure to clear browser\\'s cache.',\n          ],\n        });\n      } else {\n        msg({\n          verb: 'console.debug',\n          args: [`Loading \"${filename}\" from \"${truncate(p)}\"`],\n        });\n        return p;\n      }\n    },\n    mainScriptUrlOrBlob: hasMultithread\n      ? argMainScriptBlob\n      : 'throw new Error(\"Multithreading is not enabled\")',\n    pthreadPoolSize: hasMultithread ? pthreadPoolSize : 0,\n    wasmMemory: hasMultithread ? getWasmMemory() : null,\n    onAbort: function (message) {\n      isAborted = true;\n      msg({ verb: 'signal.abort', args: ['abort', message, lastStack, null] });\n    },\n    onExit: function (code) {\n      isAborted = true;\n      const callstack = new Error().stack.toString();\n      msg({\n        verb: 'signal.abort',\n        args: ['abort', 'exit(' + code + ')', callstack, null],\n      });\n    },\n  };\n};\n\n// Get the memory to be used by wasm. (Only used in multi-thread mode)\n// Because we have a weird OOM issue on iOS, we need to try some values\n// See: https://github.com/emscripten-core/emscripten/issues/19144\n//      https://github.com/godotengine/godot/issues/70621\nconst getWasmMemory = () => {\n  let minBytes = 128 * 1024 * 1024;\n  let maxBytes = 4096 * 1024 * 1024;\n  let stepBytes = 128 * 1024 * 1024;\n  while (maxBytes > minBytes) {\n    try {\n      const wasmMemory = new WebAssembly.Memory({\n        initial: toSizeT(minBytes / 65536),\n        maximum: toSizeT(maxBytes / 65536),\n        shared: true,\n        address: isCompat ? undefined : 'i64',\n      });\n      return wasmMemory;\n    } catch (e) {\n      maxBytes -= stepBytes;\n      continue; // retry\n    }\n  }\n  throw new Error('Cannot allocate WebAssembly.Memory');\n};\n\n//////////////////////////////////////////////////////////////\n// HEAPFS PATCH\n//////////////////////////////////////////////////////////////\n\n/**\n * By default, emscripten uses memfs. The way it works is by\n * allocating new Uint8Array in javascript heap. This is not good\n * because it requires files to be copied to wasm heap each time\n * a file is read.\n *\n * HeapFS is an alternative, which resolves this problem by\n * allocating space for file directly inside wasm heap. This\n * allows us to mmap without doing any copy.\n *\n * For llama.cpp, this is great because we use MAP_SHARED\n *\n * Ref: https://github.com/ngxson/wllama/pull/39\n * Ref: https://github.com/emscripten-core/emscripten/blob/main/src/library_memfs.js\n *\n * Note 29/05/2024 @ngxson\n * Due to ftell() being limited to MAX_LONG, we cannot load files bigger than 2^31 bytes (or 2GB)\n * Ref: https://github.com/emscripten-core/emscripten/blob/main/system/lib/libc/musl/src/stdio/ftell.c\n */\n\nconst fsNameToFile = {}; // map Name => File\nconst fsIdToFile = {}; // map ID => File\nlet currFileId = 0;\n\n// Patch and redirect memfs calls to wllama\nconst patchHeapFS = () => {\n  const m = Module;\n  // save functions\n  m.MEMFS.stream_ops._read = m.MEMFS.stream_ops.read;\n  m.MEMFS.stream_ops._write = m.MEMFS.stream_ops.write;\n  m.MEMFS.stream_ops._llseek = m.MEMFS.stream_ops.llseek;\n  m.MEMFS.stream_ops._allocate = m.MEMFS.stream_ops.allocate;\n  m.MEMFS.stream_ops._mmap = m.MEMFS.stream_ops.mmap;\n  m.MEMFS.stream_ops._msync = m.MEMFS.stream_ops.msync;\n\n  const patchStream = (stream) => {\n    const name = stream.node.name;\n    if (fsNameToFile[name]) {\n      const f = fsNameToFile[name];\n      const ptr = Number(f.ptr);\n      stream.node.contents = getHeapU8().subarray(ptr, ptr + f.size);\n      stream.node.usedBytes = f.size;\n    }\n  };\n\n  // replace \"read\" functions\n  m.MEMFS.stream_ops.read = function (\n    stream,\n    buffer,\n    offset,\n    length,\n    position\n  ) {\n    patchStream(stream);\n    return m.MEMFS.stream_ops._read(stream, buffer, offset, length, position);\n  };\n  m.MEMFS.ops_table.file.stream.read = m.MEMFS.stream_ops.read;\n\n  // replace \"llseek\" functions\n  m.MEMFS.stream_ops.llseek = function (stream, offset, whence) {\n    patchStream(stream);\n    return m.MEMFS.stream_ops._llseek(stream, offset, whence);\n  };\n  m.MEMFS.ops_table.file.stream.llseek = m.MEMFS.stream_ops.llseek;\n\n  // replace \"mmap\" functions\n  m.MEMFS.stream_ops.mmap = function (stream, length, position, prot, flags) {\n    patchStream(stream);\n    const name = stream.node.name;\n    if (fsNameToFile[name]) {\n      const f = fsNameToFile[name];\n      const mmapPtr = f.ptr + toSizeT(position);\n      return {\n        ptr: mmapPtr,\n        allocated: false,\n      };\n    } else {\n      return m.MEMFS.stream_ops._mmap(stream, length, position, prot, flags);\n    }\n  };\n  m.MEMFS.ops_table.file.stream.mmap = m.MEMFS.stream_ops.mmap;\n\n  // mount FS\n  m.FS.mkdir('/models');\n  m.FS.mount(m.MEMFS, { root: '.' }, '/models');\n};\n\n// Allocate a new file in wllama heapfs, returns file ID\nconst heapfsAlloc = (name, size, allocBuffer) => {\n  if (size < 1) {\n    throw new Error('File size must be bigger than 0');\n  }\n  const m = Module;\n  const ptr = toSizeT(allocBuffer ? m.mmapAlloc(size) : 0);\n  const file = {\n    ptr: ptr,\n    size: size,\n    id: currFileId++,\n  };\n  fsIdToFile[file.id] = file;\n  fsNameToFile[name] = file;\n  return file.id;\n};\n\n// Add new file to wllama heapfs, return number of written bytes\nconst heapfsWrite = (id, buffer, offset) => {\n  if (fsIdToFile[id]) {\n    const { ptr, size } = fsIdToFile[id];\n    const afterWriteByte = offset + buffer.byteLength;\n    if (afterWriteByte > size) {\n      throw new Error(\n        `File ID ${id} write out of bound, afterWriteByte = ${afterWriteByte} while size = ${size}`\n      );\n    }\n    getHeapU8().set(buffer, Number(ptr) + offset);\n    return buffer.byteLength;\n  } else {\n    throw new Error(`File ID ${id} not found in heapfs`);\n  }\n};\n\n//////////////////////////////////////////////////////////////\n// ASYNC FILE READ\n//////////////////////////////////////////////////////////////\n\nlet isAwaitReading = false;\nlet pendingReadPromise = null;\nlet pendingReadResolve = null;\nlet pendingReadReject = null;\n\nconst _stripModelsPrefix = (path) => path.replace(/^\\/?models\\//, '');\n\n// Called from EM_ASYNC_JS stub in wllama-fs.h (path is already a JS string)\nconst _wllama_js_file_read = async (path, offset, req_size, out_ptr) => {\n  const name = _stripModelsPrefix(path);\n\n  pendingReadPromise = new Promise((res, rej) => {\n    pendingReadResolve = res;\n    pendingReadReject = rej;\n  });\n  isAwaitReading = true;\n\n  postMessage({ verb: 'fs.read_req', args: [name, offset, req_size] });\n\n  let data;\n  try {\n    data = await pendingReadPromise;\n  } finally {\n    isAwaitReading = false;\n    pendingReadResolve = null;\n    pendingReadReject = null;\n  }\n\n  const bytes = new Uint8Array(data);\n  getHeapU8().set(bytes, out_ptr);\n  return toSizeT(bytes.length);\n};\n\n//////////////////////////////////////////////////////////////\n// MAIN CODE\n//////////////////////////////////////////////////////////////\n\nconst callWrapper = (name, ret, args, isAsync) => {\n  const fn = Module.cwrap(\n    name,\n    ret,\n    args,\n    isAsync ? { async: true } : undefined\n  );\n  return async (action, req) => {\n    // console.log(`Calling ${name} with action:`, action, 'and req:', req);\n    let result;\n    try {\n      if (args.length === 2) {\n        result = isAsync ? await fn(action, req) : fn(action, req);\n      } else {\n        result = fn();\n      }\n    } catch (ex) {\n      console.error(ex);\n      throw ex;\n    }\n    return result;\n  };\n};\n\nfunction handleError(err) {\n  // If WASM already aborted, onAbort already sent signal.abort; skip to avoid\n  // re-reporting the resulting WebAssembly.RuntimeError as a JS exception.\n  if (isAborted) return;\n\n  const message = err ? err.message || String(err) : 'Unknown error';\n  const stack = err ? err.stack || String(err) : '';\n  msg({\n    verb: 'signal.abort',\n    args: ['exception', message, stack, err],\n  });\n}\n\nonmessage = async (e) => {\n  if (!e.data) return;\n  const { verb, args, callbackId } = e.data;\n\n  // fs.read_res arrives while wasm is JSPI-suspended; resolve the pending promise.\n  if (verb === 'fs.read_res') {\n    if (pendingReadResolve) {\n      pendingReadResolve(args[0]);\n    }\n    return;\n  }\n\n  // Guard: while awaiting a file read, reject any other incoming task.\n  if (isAwaitReading) {\n    if (callbackId) {\n      msg({\n        callbackId,\n        err: 'Worker is suspended waiting for file data (JSPI)',\n      });\n    }\n    return;\n  }\n\n  if (!callbackId) {\n    msg({ verb: 'console.error', args: ['callbackId is required', e.data] });\n    return;\n  }\n\n  if (verb === 'module.init') {\n    const argMainScriptBlob = args[0];\n    const argUseAsyncFile = args[1];\n    try {\n      Module = getWModuleConfig(argMainScriptBlob);\n      Module.preRun = () => {\n        if (argUseAsyncFile) {\n          Module.ENV['USE_ASYNC_FILE'] = '1';\n        }\n      };\n      Module.onRuntimeInitialized = () => {\n        // async call once module is ready\n        // init FS\n        patchHeapFS();\n        // init cwrap\n        const pointer = isCompat ? 'number' : 'bigint';\n        // TODO: note sure why emscripten cannot bind if there is only 1 argument\n        wllamaMalloc = callWrapper('wllama_malloc', pointer, [\n          'number',\n          pointer,\n        ]);\n        wllamaStart = callWrapper('wllama_start', 'string', [], true);\n        wllamaAction = callWrapper(\n          'wllama_action',\n          pointer,\n          ['string', pointer],\n          true\n        );\n        wllamaExit = callWrapper('wllama_exit', 'string', []);\n        wllamaDebug = callWrapper('wllama_debug', 'string', []);\n        msg({ callbackId, result: null });\n      };\n      wModuleInit();\n    } catch (err) {\n      handleError(err);\n    }\n    return;\n  }\n\n  if (verb === 'fs.alloc') {\n    const argFilename = args[0];\n    const argSize = args[1];\n    const argAllocBuffer = args[2];\n    try {\n      // create blank file\n      const emptyBuffer = new ArrayBuffer(0);\n      Module['FS_createDataFile'](\n        '/models',\n        argFilename,\n        emptyBuffer,\n        true,\n        true,\n        true\n      );\n      // alloc data on heap\n      const fileId = heapfsAlloc(argFilename, argSize, argAllocBuffer);\n      msg({ callbackId, result: { fileId } });\n    } catch (err) {\n      handleError(err);\n    }\n    return;\n  }\n\n  if (verb === 'fs.write') {\n    const argFileId = args[0];\n    const argBuffer = args[1];\n    const argOffset = args[2];\n    try {\n      const writtenBytes = heapfsWrite(argFileId, argBuffer, argOffset);\n      msg({ callbackId, result: { writtenBytes } });\n    } catch (err) {\n      handleError(err);\n    }\n    return;\n  }\n\n  if (verb === 'wllama.start') {\n    try {\n      const result = await wllamaStart();\n      msg({ callbackId, result });\n    } catch (err) {\n      handleError(err);\n    }\n    return;\n  }\n\n  if (verb === 'wllama.action') {\n    const argAction = args[0];\n    const argEncodedMsg = args[1];\n    try {\n      const inputPtr = await wllamaMalloc(toSizeT(argEncodedMsg.byteLength), 0);\n      // copy data to wasm heap\n      const inputBuffer = new Uint8Array(\n        getHeapU8().buffer,\n        Number(inputPtr),\n        argEncodedMsg.byteLength\n      );\n      inputBuffer.set(argEncodedMsg, 0);\n      const outputPtr = await wllamaAction(argAction, inputPtr);\n      // length of output buffer is written at the first 4 bytes of input buffer\n      const outputLen = new Uint32Array(\n        getHeapU8().buffer,\n        Number(inputPtr),\n        1\n      )[0];\n      // copy the output buffer to JS heap\n      const outputBuffer = new Uint8Array(outputLen);\n      const outputSrcView = new Uint8Array(\n        getHeapU8().buffer,\n        Number(outputPtr),\n        outputLen\n      );\n      outputBuffer.set(outputSrcView, 0); // copy it\n      msg({ callbackId, result: outputBuffer }, [outputBuffer.buffer]);\n    } catch (err) {\n      handleError(err);\n    }\n    return;\n  }\n\n  if (verb === 'wllama.exit') {\n    try {\n      const result = await wllamaExit();\n      msg({ callbackId, result });\n    } catch (err) {\n      handleError(err);\n    }\n    return;\n  }\n\n  if (verb === 'wllama.debug') {\n    try {\n      const result = await wllamaDebug();\n      msg({ callbackId, result });\n    } catch (err) {\n      handleError(err);\n    }\n    return;\n  }\n};\n";
var OPFS_UTILS_WORKER_CODE = "let accessHandle;\nlet abortController = new AbortController();\n\nasync function openFile(filename) {\n  const opfsRoot = await navigator.storage.getDirectory();\n  const cacheDir = await opfsRoot.getDirectoryHandle('cache', { create: true });\n  const fileHandler = await cacheDir.getFileHandle(filename, { create: true });\n  accessHandle = await fileHandler.createSyncAccessHandle();\n  accessHandle.truncate(0); // clear file content\n}\n\nasync function writeFile(buf) {\n  accessHandle.write(buf);\n}\n\nasync function closeFile() {\n  accessHandle.flush();\n  accessHandle.close();\n}\n\nasync function writeTextFile(filename, str) {\n  await openFile(filename);\n  await writeFile(new TextEncoder().encode(str));\n  await closeFile();\n}\n\nconst throttled = (func, delay) => {\n  let lastRun = 0;\n  return (...args) => {\n    const now = Date.now();\n    if (now - lastRun > delay) {\n      lastRun = now;\n      func.apply(null, args);\n    }\n  };\n};\n\nconst assertNonNull = (val) => {\n  if (val === null || val === undefined) {\n    throw new Error('OPFS Worker: Assertion failed');\n  }\n};\n\n// respond to main thread\nconst resOK = () => postMessage({ ok: true });\nconst resProgress = (loaded, total) =>\n  postMessage({ progress: { loaded, total } });\nconst resErr = (err) => postMessage({ err });\n\nonmessage = async (e) => {\n  try {\n    if (!e.data) return;\n\n    /**\n     * @param {Object} e.data\n     *\n     * Fine-control FS actions:\n     * - { action: 'open', filename: 'string' }\n     * - { action: 'write', buf: ArrayBuffer }\n     * - { action: 'close' }\n     *\n     * Simple write API:\n     * - { action: 'write-simple', filename: 'string', buf: ArrayBuffer }\n     *\n     * Download API:\n     * - { action: 'download', url: 'string', filename: 'string', options: Object, metadataFileName: 'string' }\n     * - { action: 'download-abort' }\n     */\n    const {\n      action,\n      filename,\n      buf,\n      url,\n      options,\n      metadataFileName,\n      metadataAdditional,\n    } = e.data;\n\n    if (action === 'open') {\n      assertNonNull(filename);\n      await openFile(filename);\n      return resOK();\n    } else if (action === 'write') {\n      assertNonNull(buf);\n      await writeFile(buf);\n      return resOK();\n    } else if (action === 'close') {\n      await closeFile();\n      return resOK();\n    } else if (action === 'write-simple') {\n      assertNonNull(filename);\n      assertNonNull(buf);\n      await openFile(filename);\n      await writeFile(buf);\n      await closeFile();\n      return resOK();\n    } else if (action === 'download') {\n      assertNonNull(url);\n      assertNonNull(filename);\n      assertNonNull(metadataFileName);\n      assertNonNull(options);\n      assertNonNull(options.aborted);\n      abortController = new AbortController();\n      if (options.aborted) abortController.abort();\n      const response = await fetch(url, {\n        ...options,\n        signal: abortController.signal,\n      });\n      const contentLength = response.headers.get('content-length');\n      const etag = (response.headers.get('etag') || '').replace(\n        /[^A-Za-z0-9]/g,\n        ''\n      );\n      const total = parseInt(contentLength, 10);\n      const reader = response.body.getReader();\n      await openFile(filename);\n      let loaded = 0;\n      const throttledProgress = throttled(resProgress, 100);\n      while (true) {\n        const { done, value } = await reader.read();\n        if (done) break;\n        loaded += value.byteLength;\n        await writeFile(value);\n        throttledProgress(loaded, total);\n      }\n      resProgress(total, total); // 100% done\n      await closeFile();\n      // make sure this is in-sync with CacheEntryMetadata\n      await writeTextFile(\n        metadataFileName,\n        JSON.stringify({\n          originalURL: url,\n          originalSize: total,\n          etag,\n          ...metadataAdditional,\n        })\n      );\n      return resOK();\n    } else if (action === 'download-abort') {\n      if (abortController) {\n        abortController.abort();\n      }\n      return;\n    }\n\n    throw new Error('OPFS Worker: Invalid action', e.data);\n  } catch (err) {\n    return resErr(err);\n  }\n};\n";
var WLLAMA_EMSCRIPTEN_CODE = 'var Module=typeof Module!="undefined"?Module:{};var ENVIRONMENT_IS_WEB=!!globalThis.window;var ENVIRONMENT_IS_WORKER=!!globalThis.WorkerGlobalScope;var ENVIRONMENT_IS_NODE=globalThis.process?.versions?.node&&globalThis.process?.type!="renderer";var ENVIRONMENT_IS_PTHREAD=ENVIRONMENT_IS_WORKER&&self.name?.startsWith("em-pthread");if(ENVIRONMENT_IS_NODE){var worker_threads=require("worker_threads");global.Worker=worker_threads.Worker;ENVIRONMENT_IS_WORKER=!worker_threads.isMainThread;ENVIRONMENT_IS_PTHREAD=ENVIRONMENT_IS_WORKER&&worker_threads["workerData"]=="em-pthread"}var arguments_=[];var thisProgram="./this.program";var quit_=(status,toThrow)=>{throw toThrow};var _scriptName=globalThis.document?.currentScript?.src;if(typeof __filename!="undefined"){_scriptName=__filename}else if(ENVIRONMENT_IS_WORKER){_scriptName=self.location.href}var scriptDirectory="";function locateFile(path){if(Module["locateFile"]){return Module["locateFile"](path,scriptDirectory)}return scriptDirectory+path}var readAsync,readBinary;if(ENVIRONMENT_IS_NODE){var fs=require("fs");scriptDirectory=__dirname+"/";readBinary=filename=>{filename=isFileURI(filename)?new URL(filename):filename;var ret=fs.readFileSync(filename);return ret};readAsync=async(filename,binary=true)=>{filename=isFileURI(filename)?new URL(filename):filename;var ret=fs.readFileSync(filename,binary?undefined:"utf8");return ret};if(process.argv.length>1){thisProgram=process.argv[1].replace(/\\\\/g,"/")}arguments_=process.argv.slice(2);if(typeof module!="undefined"){module["exports"]=Module}quit_=(status,toThrow)=>{process.exitCode=status;throw toThrow}}else if(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER){try{scriptDirectory=new URL(".",_scriptName).href}catch{}if(!ENVIRONMENT_IS_NODE){if(ENVIRONMENT_IS_WORKER){readBinary=url=>{var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.responseType="arraybuffer";xhr.send(null);return new Uint8Array(xhr.response)}}readAsync=async url=>{if(isFileURI(url)){return new Promise((resolve,reject)=>{var xhr=new XMLHttpRequest;xhr.open("GET",url,true);xhr.responseType="arraybuffer";xhr.onload=()=>{if(xhr.status==200||xhr.status==0&&xhr.response){resolve(xhr.response);return}reject(xhr.status)};xhr.onerror=reject;xhr.send(null)})}var response=await fetch(url,{credentials:"same-origin"});if(response.ok){return response.arrayBuffer()}throw new Error(response.status+" : "+response.url)}}}else{}var defaultPrint=console.log.bind(console);var defaultPrintErr=console.error.bind(console);if(ENVIRONMENT_IS_NODE){var utils=require("util");var stringify=a=>typeof a=="object"?utils.inspect(a):a;defaultPrint=(...args)=>fs.writeSync(1,args.map(stringify).join(" ")+"\\n");defaultPrintErr=(...args)=>fs.writeSync(2,args.map(stringify).join(" ")+"\\n")}var out=defaultPrint;var err=defaultPrintErr;var wasmBinary;var wasmModule;var ABORT=false;var EXITSTATUS;function assert(condition,text){if(!condition){abort(text)}}var isFileURI=filename=>filename.startsWith("file://");function growMemViews(){if(wasmMemory.buffer!=HEAP8.buffer){updateMemoryViews()}}if(ENVIRONMENT_IS_NODE&&ENVIRONMENT_IS_PTHREAD){var parentPort=worker_threads["parentPort"];parentPort.on("message",msg=>global.onmessage?.({data:msg}));Object.assign(globalThis,{self:global,postMessage:msg=>parentPort["postMessage"](msg)});process.on("uncaughtException",err=>{postMessage({cmd:"uncaughtException",error:err});process.exit(1)})}var startWorker;if(ENVIRONMENT_IS_PTHREAD){var initializedJS=false;self.onunhandledrejection=e=>{throw e.reason||e};async function handleMessage(e){try{var msgData=e["data"];var cmd=msgData.cmd;if(cmd==="load"){let messageQueue=[];self.onmessage=e=>messageQueue.push(e);startWorker=()=>{postMessage({cmd:"loaded"});for(let msg of messageQueue){handleMessage(msg)}self.onmessage=handleMessage};for(const handler of msgData.handlers){if(!Module[handler]||Module[handler].proxy){Module[handler]=(...args)=>{postMessage({cmd:"callHandler",handler,args})};if(handler=="print")out=Module[handler];if(handler=="printErr")err=Module[handler]}}wasmMemory=msgData.wasmMemory;updateMemoryViews();wasmModule=msgData.wasmModule;createWasm();run()}else if(cmd==="run"){establishStackSpace(msgData.pthread_ptr);__emscripten_thread_init(msgData.pthread_ptr,0,0,1,0,0);PThread.threadInitTLS();__emscripten_thread_mailbox_await(msgData.pthread_ptr);if(!initializedJS){initializedJS=true}try{await invokeEntryPoint(msgData.start_routine,msgData.arg)}catch(ex){if(ex!="unwind"){throw ex}}}else if(msgData.target==="setimmediate"){}else if(cmd==="checkMailbox"){if(initializedJS){checkMailbox()}}else if(cmd){err(`worker: received unknown command ${cmd}`);err(msgData)}}catch(ex){__emscripten_thread_crashed();throw ex}}self.onmessage=handleMessage}var HEAP8,HEAPU8,HEAP16,HEAPU16,HEAP32,HEAPU32,HEAPF32,HEAPF64;var HEAP64,HEAPU64;var runtimeInitialized=false;function updateMemoryViews(){var b=wasmMemory.buffer;HEAP8=new Int8Array(b);HEAP16=new Int16Array(b);Module["HEAPU8"]=HEAPU8=new Uint8Array(b);HEAPU16=new Uint16Array(b);HEAP32=new Int32Array(b);HEAPU32=new Uint32Array(b);HEAPF32=new Float32Array(b);HEAPF64=new Float64Array(b);HEAP64=new BigInt64Array(b);HEAPU64=new BigUint64Array(b)}function initMemory(){if(ENVIRONMENT_IS_PTHREAD){return}if(Module["wasmMemory"]){wasmMemory=Module["wasmMemory"]}else{var INITIAL_MEMORY=Module["INITIAL_MEMORY"]||134217728;wasmMemory=new WebAssembly.Memory({initial:BigInt(INITIAL_MEMORY/65536),maximum:65536n,shared:true,address:"i64"})}updateMemoryViews()}function preRun(){if(Module["preRun"]){if(typeof Module["preRun"]=="function")Module["preRun"]=[Module["preRun"]];while(Module["preRun"].length){addOnPreRun(Module["preRun"].shift())}}callRuntimeCallbacks(onPreRuns)}function initRuntime(){runtimeInitialized=true;if(ENVIRONMENT_IS_PTHREAD)return startWorker();if(!Module["noFSInit"]&&!FS.initialized)FS.init();TTY.init();wasmExports["__wasm_call_ctors"]();FS.ignorePermissions=false}function preMain(){}function postRun(){if(ENVIRONMENT_IS_PTHREAD){return}if(Module["postRun"]){if(typeof Module["postRun"]=="function")Module["postRun"]=[Module["postRun"]];while(Module["postRun"].length){addOnPostRun(Module["postRun"].shift())}}callRuntimeCallbacks(onPostRuns)}function abort(what){Module["onAbort"]?.(what);what="Aborted("+what+")";err(what);ABORT=true;what+=". Build with -sASSERTIONS for more info.";if(runtimeInitialized){___trap()}var e=new WebAssembly.RuntimeError(what);throw e}var wasmBinaryFile;function findWasmBinary(){return locateFile("wllama.wasm")}function getBinarySync(file){if(file==wasmBinaryFile&&wasmBinary){return new Uint8Array(wasmBinary)}if(readBinary){return readBinary(file)}throw"both async and sync fetching of the wasm failed"}async function getWasmBinary(binaryFile){if(!wasmBinary){try{var response=await readAsync(binaryFile);return new Uint8Array(response)}catch{}}return getBinarySync(binaryFile)}async function instantiateArrayBuffer(binaryFile,imports){try{var binary=await getWasmBinary(binaryFile);var instance=await WebAssembly.instantiate(binary,imports);return instance}catch(reason){err(`failed to asynchronously prepare wasm: ${reason}`);abort(reason)}}async function instantiateAsync(binary,binaryFile,imports){if(!binary&&!isFileURI(binaryFile)&&!ENVIRONMENT_IS_NODE){try{var response=fetch(binaryFile,{credentials:"same-origin"});var instantiationResult=await WebAssembly.instantiateStreaming(response,imports);return instantiationResult}catch(reason){err(`wasm streaming compile failed: ${reason}`);err("falling back to ArrayBuffer instantiation")}}return instantiateArrayBuffer(binaryFile,imports)}function getWasmImports(){assignWasmImports();if(!wasmImports.__instrumented){wasmImports.__instrumented=true;Asyncify.instrumentWasmImports(wasmImports)}var imports={env:wasmImports,wasi_snapshot_preview1:wasmImports};return imports}async function createWasm(){function receiveInstance(instance,module){wasmExports=instance.exports;wasmExports=Asyncify.instrumentWasmExports(wasmExports);wasmExports=applySignatureConversions(wasmExports);registerTLSInit(wasmExports["_emscripten_tls_init"]);assignWasmExports(wasmExports);wasmModule=module;removeRunDependency("wasm-instantiate");return wasmExports}addRunDependency("wasm-instantiate");function receiveInstantiationResult(result){return receiveInstance(result["instance"],result["module"])}var info=getWasmImports();if(Module["instantiateWasm"]){return new Promise((resolve,reject)=>{Module["instantiateWasm"](info,(inst,mod)=>{resolve(receiveInstance(inst,mod))})})}if(ENVIRONMENT_IS_PTHREAD){var instance=new WebAssembly.Instance(wasmModule,getWasmImports());return receiveInstance(instance,wasmModule)}wasmBinaryFile??=findWasmBinary();var result=await instantiateAsync(wasmBinary,wasmBinaryFile,info);var exports=receiveInstantiationResult(result);return exports}class ExitStatus{name="ExitStatus";constructor(status){this.message=`Program terminated with exit(${status})`;this.status=status}}var terminateWorker=worker=>{worker.terminate();worker.onmessage=e=>{}};var cleanupThread=pthread_ptr=>{var worker=PThread.pthreads[pthread_ptr];PThread.returnWorkerToPool(worker)};var callRuntimeCallbacks=callbacks=>{while(callbacks.length>0){callbacks.shift()(Module)}};var onPreRuns=[];var addOnPreRun=cb=>onPreRuns.push(cb);var runDependencies=0;var dependenciesFulfilled=null;var removeRunDependency=id=>{runDependencies--;Module["monitorRunDependencies"]?.(runDependencies);if(runDependencies==0){if(dependenciesFulfilled){var callback=dependenciesFulfilled;dependenciesFulfilled=null;callback()}}};var addRunDependency=id=>{runDependencies++;Module["monitorRunDependencies"]?.(runDependencies)};var spawnThread=threadParams=>{var worker=PThread.getNewWorker();if(!worker){return 6}PThread.runningWorkers.push(worker);PThread.pthreads[threadParams.pthread_ptr]=worker;worker.pthread_ptr=threadParams.pthread_ptr;var msg={cmd:"run",start_routine:threadParams.startRoutine,arg:threadParams.arg,pthread_ptr:threadParams.pthread_ptr};if(ENVIRONMENT_IS_NODE){worker.unref()}worker.postMessage(msg,threadParams.transferList);return 0};var runtimeKeepaliveCounter=0;var keepRuntimeAlive=()=>noExitRuntime||runtimeKeepaliveCounter>0;var stackSave=()=>_emscripten_stack_get_current();var stackRestore=val=>__emscripten_stack_restore(val);var stackAlloc=sz=>__emscripten_stack_alloc(sz);var proxyToMainThread=(funcIndex,emAsmAddr,sync,...callArgs)=>{var serializedNumCallArgs=callArgs.length*2;var sp=stackSave();var args=stackAlloc(serializedNumCallArgs*8);var b=args/8;for(var i=0;i<callArgs.length;i++){var arg=callArgs[i];if(typeof arg=="bigint"){(growMemViews(),HEAP64)[b+2*i]=1n;(growMemViews(),HEAP64)[b+2*i+1]=arg}else{(growMemViews(),HEAP64)[b+2*i]=0n;(growMemViews(),HEAPF64)[b+2*i+1]=arg}}var rtn=__emscripten_run_js_on_main_thread(funcIndex,emAsmAddr,serializedNumCallArgs,args,sync);stackRestore(sp);return rtn};function _proc_exit(code){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(0,0,1,code);EXITSTATUS=code;if(!keepRuntimeAlive()){PThread.terminateAllThreads();Module["onExit"]?.(code);ABORT=true}quit_(code,new ExitStatus(code))}function exitOnMainThread(returnCode){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(1,0,0,returnCode);_exit(returnCode)}var exitJS=(status,implicit)=>{EXITSTATUS=status;if(ENVIRONMENT_IS_PTHREAD){exitOnMainThread(status);throw"unwind"}_proc_exit(status)};var _exit=exitJS;var PThread={unusedWorkers:[],runningWorkers:[],tlsInitFunctions:[],pthreads:{},init(){if(!ENVIRONMENT_IS_PTHREAD){PThread.initMainThread()}},initMainThread(){var pthreadPoolSize=Module["pthreadPoolSize"];while(pthreadPoolSize--){PThread.allocateUnusedWorker()}addOnPreRun(async()=>{var pthreadPoolReady=PThread.loadWasmModuleToAllWorkers();addRunDependency("loading-workers");await pthreadPoolReady;removeRunDependency("loading-workers")})},terminateAllThreads:()=>{for(var worker of PThread.runningWorkers){terminateWorker(worker)}for(var worker of PThread.unusedWorkers){terminateWorker(worker)}PThread.unusedWorkers=[];PThread.runningWorkers=[];PThread.pthreads={}},returnWorkerToPool:worker=>{var pthread_ptr=worker.pthread_ptr;delete PThread.pthreads[pthread_ptr];PThread.unusedWorkers.push(worker);PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(worker),1);worker.pthread_ptr=0;__emscripten_thread_free_data(pthread_ptr)},threadInitTLS(){PThread.tlsInitFunctions.forEach(f=>f())},loadWasmModuleToWorker:worker=>new Promise(onFinishedLoading=>{worker.onmessage=e=>{var d=e["data"];var cmd=d.cmd;if(d.targetThread&&d.targetThread!=_pthread_self()){var targetWorker=PThread.pthreads[d.targetThread];if(targetWorker){targetWorker.postMessage(d,d.transferList)}else{err(`Internal error! Worker sent a message "${cmd}" to target pthread ${d.targetThread}, but that thread no longer exists!`)}return}if(cmd==="checkMailbox"){checkMailbox()}else if(cmd==="spawnThread"){spawnThread(d)}else if(cmd==="cleanupThread"){callUserCallback(()=>cleanupThread(d.thread))}else if(cmd==="loaded"){worker.loaded=true;if(ENVIRONMENT_IS_NODE&&!worker.pthread_ptr){worker.unref()}onFinishedLoading(worker)}else if(d.target==="setimmediate"){worker.postMessage(d)}else if(cmd==="uncaughtException"){worker.onerror(d.error)}else if(cmd==="callHandler"){Module[d.handler](...d.args)}else if(cmd){err(`worker sent an unknown command ${cmd}`)}};worker.onerror=e=>{var message="worker sent an error!";err(`${message} ${e.filename}:${e.lineno}: ${e.message}`);throw e};if(ENVIRONMENT_IS_NODE){worker.on("message",data=>worker.onmessage({data}));worker.on("error",e=>worker.onerror(e))}var handlers=[];var knownHandlers=["onExit","onAbort","print","printErr"];for(var handler of knownHandlers){if(Module.propertyIsEnumerable(handler)){handlers.push(handler)}}worker.postMessage({cmd:"load",handlers,wasmMemory,wasmModule})}),async loadWasmModuleToAllWorkers(){if(ENVIRONMENT_IS_PTHREAD){return}let pthreadPoolReady=Promise.all(PThread.unusedWorkers.map(PThread.loadWasmModuleToWorker));return pthreadPoolReady},allocateUnusedWorker(){var worker;var pthreadMainJs=_scriptName;if(Module["mainScriptUrlOrBlob"]){pthreadMainJs=Module["mainScriptUrlOrBlob"];if(typeof pthreadMainJs!="string"){pthreadMainJs=URL.createObjectURL(pthreadMainJs)}}worker=new Worker(pthreadMainJs,{workerData:"em-pthread",name:"em-pthread"});PThread.unusedWorkers.push(worker)},getNewWorker(){if(PThread.unusedWorkers.length==0){PThread.allocateUnusedWorker();PThread.loadWasmModuleToWorker(PThread.unusedWorkers[0])}return PThread.unusedWorkers.pop()}};var onPostRuns=[];var addOnPostRun=cb=>onPostRuns.push(cb);function establishStackSpace(pthread_ptr){var stackHigh=Number((growMemViews(),HEAPU64)[(pthread_ptr+88)/8]);var stackSize=Number((growMemViews(),HEAPU64)[(pthread_ptr+96)/8]);var stackLow=stackHigh-stackSize;_emscripten_stack_set_limits(stackHigh,stackLow);stackRestore(stackHigh)}var wasmTableMirror=[];var getWasmTableEntry=funcPtr=>{funcPtr=Number(funcPtr);var func=wasmTableMirror[funcPtr];if(!func){wasmTableMirror[funcPtr]=func=wasmTable.get(BigInt(funcPtr));if(Asyncify.isAsyncExport(func)){wasmTableMirror[funcPtr]=func=Asyncify.makeAsyncFunction(func)}}return func};var invokeEntryPoint=async(ptr,arg)=>{runtimeKeepaliveCounter=0;noExitRuntime=0;var result=(a1=>WebAssembly.promising(getWasmTableEntry(ptr)).call(null,BigInt(a1)))(arg);function finish(result){if(keepRuntimeAlive()){EXITSTATUS=result;return}__emscripten_thread_exit(result)}result=await result;finish(result)};invokeEntryPoint.isAsync=true;var noExitRuntime=true;var registerTLSInit=tlsInitFunc=>PThread.tlsInitFunctions.push(tlsInitFunc);var wasmMemory;function pthreadCreateProxied(pthread_ptr,attr,startRoutine,arg){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(2,0,1,pthread_ptr,attr,startRoutine,arg);return ___pthread_create_js(pthread_ptr,attr,startRoutine,arg)}var _emscripten_has_threading_support=()=>!!globalThis.SharedArrayBuffer;var INT53_MAX=9007199254740992;var INT53_MIN=-9007199254740992;var bigintToI53Checked=num=>num<INT53_MIN||num>INT53_MAX?NaN:Number(num);function ___pthread_create_js(pthread_ptr,attr,startRoutine,arg){pthread_ptr=bigintToI53Checked(pthread_ptr);attr=bigintToI53Checked(attr);startRoutine=bigintToI53Checked(startRoutine);arg=bigintToI53Checked(arg);if(!_emscripten_has_threading_support()){return 6}var transferList=[];var error=0;if(ENVIRONMENT_IS_PTHREAD&&(transferList.length===0||error)){return pthreadCreateProxied(pthread_ptr,attr,startRoutine,arg)}if(error)return error;var threadParams={startRoutine,pthread_ptr,arg,transferList};if(ENVIRONMENT_IS_PTHREAD){threadParams.cmd="spawnThread";postMessage(threadParams,transferList);return 0}return spawnThread(threadParams)}var syscallGetVarargP=()=>{var ret=Number((growMemViews(),HEAPU64)[SYSCALLS.varargs/8]);SYSCALLS.varargs+=8;return ret};var syscallGetVarargI=()=>{var ret=(growMemViews(),HEAP32)[+SYSCALLS.varargs/4];SYSCALLS.varargs+=4;return ret};var PATH={isAbs:path=>path.charAt(0)==="/",splitPath:filename=>{var splitPathRe=/^(\\/?|)([\\s\\S]*?)((?:\\.{1,2}|[^\\/]+?|)(\\.[^.\\/]*|))(?:[\\/]*)$/;return splitPathRe.exec(filename).slice(1)},normalizeArray:(parts,allowAboveRoot)=>{var up=0;for(var i=parts.length-1;i>=0;i--){var last=parts[i];if(last==="."){parts.splice(i,1)}else if(last===".."){parts.splice(i,1);up++}else if(up){parts.splice(i,1);up--}}if(allowAboveRoot){for(;up;up--){parts.unshift("..")}}return parts},normalize:path=>{var isAbsolute=PATH.isAbs(path),trailingSlash=path.slice(-1)==="/";path=PATH.normalizeArray(path.split("/").filter(p=>!!p),!isAbsolute).join("/");if(!path&&!isAbsolute){path="."}if(path&&trailingSlash){path+="/"}return(isAbsolute?"/":"")+path},dirname:path=>{var result=PATH.splitPath(path),root=result[0],dir=result[1];if(!root&&!dir){return"."}if(dir){dir=dir.slice(0,-1)}return root+dir},basename:path=>path&&path.match(/([^\\/]+|\\/)\\/*$/)[1],join:(...paths)=>PATH.normalize(paths.join("/")),join2:(l,r)=>PATH.normalize(l+"/"+r)};var initRandomFill=()=>view=>view.set(crypto.getRandomValues(new Uint8Array(view.byteLength)));var randomFill=view=>{(randomFill=initRandomFill())(view)};var PATH_FS={resolve:(...args)=>{var resolvedPath="",resolvedAbsolute=false;for(var i=args.length-1;i>=-1&&!resolvedAbsolute;i--){var path=i>=0?args[i]:FS.cwd();if(typeof path!="string"){throw new TypeError("Arguments to path.resolve must be strings")}else if(!path){return""}resolvedPath=path+"/"+resolvedPath;resolvedAbsolute=PATH.isAbs(path)}resolvedPath=PATH.normalizeArray(resolvedPath.split("/").filter(p=>!!p),!resolvedAbsolute).join("/");return(resolvedAbsolute?"/":"")+resolvedPath||"."},relative:(from,to)=>{from=PATH_FS.resolve(from).slice(1);to=PATH_FS.resolve(to).slice(1);function trim(arr){var start=0;for(;start<arr.length;start++){if(arr[start]!=="")break}var end=arr.length-1;for(;end>=0;end--){if(arr[end]!=="")break}if(start>end)return[];return arr.slice(start,end-start+1)}var fromParts=trim(from.split("/"));var toParts=trim(to.split("/"));var length=Math.min(fromParts.length,toParts.length);var samePartsLength=length;for(var i=0;i<length;i++){if(fromParts[i]!==toParts[i]){samePartsLength=i;break}}var outputParts=[];for(var i=samePartsLength;i<fromParts.length;i++){outputParts.push("..")}outputParts=outputParts.concat(toParts.slice(samePartsLength));return outputParts.join("/")}};var UTF8Decoder=globalThis.TextDecoder&&new TextDecoder;var findStringEnd=(heapOrArray,idx,maxBytesToRead,ignoreNul)=>{var maxIdx=idx+maxBytesToRead;if(ignoreNul)return maxIdx;while(heapOrArray[idx]&&!(idx>=maxIdx))++idx;return idx};var UTF8ArrayToString=(heapOrArray,idx=0,maxBytesToRead,ignoreNul)=>{var endPtr=findStringEnd(heapOrArray,idx,maxBytesToRead,ignoreNul);if(endPtr-idx>16&&heapOrArray.buffer&&UTF8Decoder){return UTF8Decoder.decode(heapOrArray.buffer instanceof ArrayBuffer?heapOrArray.subarray(idx,endPtr):heapOrArray.slice(idx,endPtr))}var str="";while(idx<endPtr){var u0=heapOrArray[idx++];if(!(u0&128)){str+=String.fromCharCode(u0);continue}var u1=heapOrArray[idx++]&63;if((u0&224)==192){str+=String.fromCharCode((u0&31)<<6|u1);continue}var u2=heapOrArray[idx++]&63;if((u0&240)==224){u0=(u0&15)<<12|u1<<6|u2}else{u0=(u0&7)<<18|u1<<12|u2<<6|heapOrArray[idx++]&63}if(u0<65536){str+=String.fromCharCode(u0)}else{var ch=u0-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023)}}return str};var FS_stdin_getChar_buffer=[];var lengthBytesUTF8=str=>{var len=0;for(var i=0;i<str.length;++i){var c=str.charCodeAt(i);if(c<=127){len++}else if(c<=2047){len+=2}else if(c>=55296&&c<=57343){len+=4;++i}else{len+=3}}return len};var stringToUTF8Array=(str,heap,outIdx,maxBytesToWrite)=>{if(!(maxBytesToWrite>0))return 0;var startIdx=outIdx;var endIdx=outIdx+maxBytesToWrite-1;for(var i=0;i<str.length;++i){var u=str.codePointAt(i);if(u<=127){if(outIdx>=endIdx)break;heap[outIdx++]=u}else if(u<=2047){if(outIdx+1>=endIdx)break;heap[outIdx++]=192|u>>6;heap[outIdx++]=128|u&63}else if(u<=65535){if(outIdx+2>=endIdx)break;heap[outIdx++]=224|u>>12;heap[outIdx++]=128|u>>6&63;heap[outIdx++]=128|u&63}else{if(outIdx+3>=endIdx)break;heap[outIdx++]=240|u>>18;heap[outIdx++]=128|u>>12&63;heap[outIdx++]=128|u>>6&63;heap[outIdx++]=128|u&63;i++}}heap[outIdx]=0;return outIdx-startIdx};var intArrayFromString=(stringy,dontAddNull,length)=>{var len=length>0?length:lengthBytesUTF8(stringy)+1;var u8array=new Array(len);var numBytesWritten=stringToUTF8Array(stringy,u8array,0,u8array.length);if(dontAddNull)u8array.length=numBytesWritten;return u8array};var FS_stdin_getChar=()=>{if(!FS_stdin_getChar_buffer.length){var result=null;if(ENVIRONMENT_IS_NODE){var BUFSIZE=256;var buf=Buffer.alloc(BUFSIZE);var bytesRead=0;var fd=process.stdin.fd;try{bytesRead=fs.readSync(fd,buf,0,BUFSIZE)}catch(e){if(e.toString().includes("EOF"))bytesRead=0;else throw e}if(bytesRead>0){result=buf.slice(0,bytesRead).toString("utf-8")}}else if(globalThis.window?.prompt){result=window.prompt("Input: ");if(result!==null){result+="\\n"}}else{}if(!result){return null}FS_stdin_getChar_buffer=intArrayFromString(result,true)}return FS_stdin_getChar_buffer.shift()};var TTY={ttys:[],init(){},shutdown(){},register(dev,ops){TTY.ttys[dev]={input:[],output:[],ops};FS.registerDevice(dev,TTY.stream_ops)},stream_ops:{open(stream){var tty=TTY.ttys[stream.node.rdev];if(!tty){throw new FS.ErrnoError(43)}stream.tty=tty;stream.seekable=false},close(stream){stream.tty.ops.fsync(stream.tty)},fsync(stream){stream.tty.ops.fsync(stream.tty)},read(stream,buffer,offset,length,pos){if(!stream.tty||!stream.tty.ops.get_char){throw new FS.ErrnoError(60)}var bytesRead=0;for(var i=0;i<length;i++){var result;try{result=stream.tty.ops.get_char(stream.tty)}catch(e){throw new FS.ErrnoError(29)}if(result===undefined&&bytesRead===0){throw new FS.ErrnoError(6)}if(result===null||result===undefined)break;bytesRead++;buffer[offset+i]=result}if(bytesRead){stream.node.atime=Date.now()}return bytesRead},write(stream,buffer,offset,length,pos){if(!stream.tty||!stream.tty.ops.put_char){throw new FS.ErrnoError(60)}try{for(var i=0;i<length;i++){stream.tty.ops.put_char(stream.tty,buffer[offset+i])}}catch(e){throw new FS.ErrnoError(29)}if(length){stream.node.mtime=stream.node.ctime=Date.now()}return i}},default_tty_ops:{get_char(tty){return FS_stdin_getChar()},put_char(tty,val){if(val===null||val===10){out(UTF8ArrayToString(tty.output));tty.output=[]}else{if(val!=0)tty.output.push(val)}},fsync(tty){if(tty.output?.length>0){out(UTF8ArrayToString(tty.output));tty.output=[]}},ioctl_tcgets(tty){return{c_iflag:25856,c_oflag:5,c_cflag:191,c_lflag:35387,c_cc:[3,28,127,21,4,0,1,0,17,19,26,0,18,15,23,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}},ioctl_tcsets(tty,optional_actions,data){return 0},ioctl_tiocgwinsz(tty){return[24,80]}},default_tty1_ops:{put_char(tty,val){if(val===null||val===10){err(UTF8ArrayToString(tty.output));tty.output=[]}else{if(val!=0)tty.output.push(val)}},fsync(tty){if(tty.output?.length>0){err(UTF8ArrayToString(tty.output));tty.output=[]}}}};var zeroMemory=(ptr,size)=>(growMemViews(),HEAPU8).fill(0,ptr,ptr+size);var alignMemory=(size,alignment)=>Math.ceil(size/alignment)*alignment;var mmapAlloc=size=>{size=alignMemory(size,65536);var ptr=_emscripten_builtin_memalign(65536,size);if(ptr)zeroMemory(ptr,size);return ptr};var MEMFS={ops_table:null,mount(mount){return MEMFS.createNode(null,"/",16895,0)},createNode(parent,name,mode,dev){if(FS.isBlkdev(mode)||FS.isFIFO(mode)){throw new FS.ErrnoError(63)}MEMFS.ops_table||={dir:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr,lookup:MEMFS.node_ops.lookup,mknod:MEMFS.node_ops.mknod,rename:MEMFS.node_ops.rename,unlink:MEMFS.node_ops.unlink,rmdir:MEMFS.node_ops.rmdir,readdir:MEMFS.node_ops.readdir,symlink:MEMFS.node_ops.symlink},stream:{llseek:MEMFS.stream_ops.llseek}},file:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr},stream:{llseek:MEMFS.stream_ops.llseek,read:MEMFS.stream_ops.read,write:MEMFS.stream_ops.write,mmap:MEMFS.stream_ops.mmap,msync:MEMFS.stream_ops.msync}},link:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr,readlink:MEMFS.node_ops.readlink},stream:{}},chrdev:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr},stream:FS.chrdev_stream_ops}};var node=FS.createNode(parent,name,mode,dev);if(FS.isDir(node.mode)){node.node_ops=MEMFS.ops_table.dir.node;node.stream_ops=MEMFS.ops_table.dir.stream;node.contents={}}else if(FS.isFile(node.mode)){node.node_ops=MEMFS.ops_table.file.node;node.stream_ops=MEMFS.ops_table.file.stream;node.usedBytes=0;node.contents=null}else if(FS.isLink(node.mode)){node.node_ops=MEMFS.ops_table.link.node;node.stream_ops=MEMFS.ops_table.link.stream}else if(FS.isChrdev(node.mode)){node.node_ops=MEMFS.ops_table.chrdev.node;node.stream_ops=MEMFS.ops_table.chrdev.stream}node.atime=node.mtime=node.ctime=Date.now();if(parent){parent.contents[name]=node;parent.atime=parent.mtime=parent.ctime=node.atime}return node},getFileDataAsTypedArray(node){if(!node.contents)return new Uint8Array(0);if(node.contents.subarray)return node.contents.subarray(0,node.usedBytes);return new Uint8Array(node.contents)},expandFileStorage(node,newCapacity){var prevCapacity=node.contents?node.contents.length:0;if(prevCapacity>=newCapacity)return;var CAPACITY_DOUBLING_MAX=1024*1024;newCapacity=Math.max(newCapacity,prevCapacity*(prevCapacity<CAPACITY_DOUBLING_MAX?2:1.125)>>>0);if(prevCapacity!=0)newCapacity=Math.max(newCapacity,256);var oldContents=node.contents;node.contents=new Uint8Array(newCapacity);if(node.usedBytes>0)node.contents.set(oldContents.subarray(0,node.usedBytes),0)},resizeFileStorage(node,newSize){if(node.usedBytes==newSize)return;if(newSize==0){node.contents=null;node.usedBytes=0}else{var oldContents=node.contents;node.contents=new Uint8Array(newSize);if(oldContents){node.contents.set(oldContents.subarray(0,Math.min(newSize,node.usedBytes)))}node.usedBytes=newSize}},node_ops:{getattr(node){var attr={};attr.dev=FS.isChrdev(node.mode)?node.id:1;attr.ino=node.id;attr.mode=node.mode;attr.nlink=1;attr.uid=0;attr.gid=0;attr.rdev=node.rdev;if(FS.isDir(node.mode)){attr.size=4096}else if(FS.isFile(node.mode)){attr.size=node.usedBytes}else if(FS.isLink(node.mode)){attr.size=node.link.length}else{attr.size=0}attr.atime=new Date(node.atime);attr.mtime=new Date(node.mtime);attr.ctime=new Date(node.ctime);attr.blksize=4096;attr.blocks=Math.ceil(attr.size/attr.blksize);return attr},setattr(node,attr){for(const key of["mode","atime","mtime","ctime"]){if(attr[key]!=null){node[key]=attr[key]}}if(attr.size!==undefined){MEMFS.resizeFileStorage(node,attr.size)}},lookup(parent,name){if(!MEMFS.doesNotExistError){MEMFS.doesNotExistError=new FS.ErrnoError(44);MEMFS.doesNotExistError.stack="<generic error, no stack>"}throw MEMFS.doesNotExistError},mknod(parent,name,mode,dev){return MEMFS.createNode(parent,name,mode,dev)},rename(old_node,new_dir,new_name){var new_node;try{new_node=FS.lookupNode(new_dir,new_name)}catch(e){}if(new_node){if(FS.isDir(old_node.mode)){for(var i in new_node.contents){throw new FS.ErrnoError(55)}}FS.hashRemoveNode(new_node)}delete old_node.parent.contents[old_node.name];new_dir.contents[new_name]=old_node;old_node.name=new_name;new_dir.ctime=new_dir.mtime=old_node.parent.ctime=old_node.parent.mtime=Date.now()},unlink(parent,name){delete parent.contents[name];parent.ctime=parent.mtime=Date.now()},rmdir(parent,name){var node=FS.lookupNode(parent,name);for(var i in node.contents){throw new FS.ErrnoError(55)}delete parent.contents[name];parent.ctime=parent.mtime=Date.now()},readdir(node){return[".","..",...Object.keys(node.contents)]},symlink(parent,newname,oldpath){var node=MEMFS.createNode(parent,newname,511|40960,0);node.link=oldpath;return node},readlink(node){if(!FS.isLink(node.mode)){throw new FS.ErrnoError(28)}return node.link}},stream_ops:{read(stream,buffer,offset,length,position){var contents=stream.node.contents;if(position>=stream.node.usedBytes)return 0;var size=Math.min(stream.node.usedBytes-position,length);if(size>8&&contents.subarray){buffer.set(contents.subarray(position,position+size),offset)}else{for(var i=0;i<size;i++)buffer[offset+i]=contents[position+i]}return size},write(stream,buffer,offset,length,position,canOwn){if(buffer.buffer===(growMemViews(),HEAP8).buffer){canOwn=false}if(!length)return 0;var node=stream.node;node.mtime=node.ctime=Date.now();if(buffer.subarray&&(!node.contents||node.contents.subarray)){if(canOwn){node.contents=buffer.subarray(offset,offset+length);node.usedBytes=length;return length}else if(node.usedBytes===0&&position===0){node.contents=buffer.slice(offset,offset+length);node.usedBytes=length;return length}else if(position+length<=node.usedBytes){node.contents.set(buffer.subarray(offset,offset+length),position);return length}}MEMFS.expandFileStorage(node,position+length);if(node.contents.subarray&&buffer.subarray){node.contents.set(buffer.subarray(offset,offset+length),position)}else{for(var i=0;i<length;i++){node.contents[position+i]=buffer[offset+i]}}node.usedBytes=Math.max(node.usedBytes,position+length);return length},llseek(stream,offset,whence){var position=offset;if(whence===1){position+=stream.position}else if(whence===2){if(FS.isFile(stream.node.mode)){position+=stream.node.usedBytes}}if(position<0){throw new FS.ErrnoError(28)}return position},mmap(stream,length,position,prot,flags){if(!FS.isFile(stream.node.mode)){throw new FS.ErrnoError(43)}var ptr;var allocated;var contents=stream.node.contents;if(!(flags&2)&&contents&&contents.buffer===(growMemViews(),HEAP8).buffer){allocated=false;ptr=contents.byteOffset}else{allocated=true;ptr=mmapAlloc(length);if(!ptr){throw new FS.ErrnoError(48)}if(contents){if(position>0||position+length<contents.length){if(contents.subarray){contents=contents.subarray(position,position+length)}else{contents=Array.prototype.slice.call(contents,position,position+length)}}(growMemViews(),HEAP8).set(contents,ptr)}}return{ptr,allocated}},msync(stream,buffer,offset,length,mmapFlags){MEMFS.stream_ops.write(stream,buffer,0,length,offset,false);return 0}}};var FS_modeStringToFlags=str=>{var flagModes={r:0,"r+":2,w:512|64|1,"w+":512|64|2,a:1024|64|1,"a+":1024|64|2};var flags=flagModes[str];if(typeof flags=="undefined"){throw new Error(`Unknown file open mode: ${str}`)}return flags};var FS_getMode=(canRead,canWrite)=>{var mode=0;if(canRead)mode|=292|73;if(canWrite)mode|=146;return mode};var asyncLoad=async url=>{var arrayBuffer=await readAsync(url);return new Uint8Array(arrayBuffer)};var FS_createDataFile=(...args)=>FS.createDataFile(...args);var getUniqueRunDependency=id=>id;var preloadPlugins=[];var FS_handledByPreloadPlugin=async(byteArray,fullname)=>{if(typeof Browser!="undefined")Browser.init();for(var plugin of preloadPlugins){if(plugin["canHandle"](fullname)){return plugin["handle"](byteArray,fullname)}}return byteArray};var FS_preloadFile=async(parent,name,url,canRead,canWrite,dontCreateFile,canOwn,preFinish)=>{var fullname=name?PATH_FS.resolve(PATH.join2(parent,name)):parent;var dep=getUniqueRunDependency(`cp ${fullname}`);addRunDependency(dep);try{var byteArray=url;if(typeof url=="string"){byteArray=await asyncLoad(url)}byteArray=await FS_handledByPreloadPlugin(byteArray,fullname);preFinish?.();if(!dontCreateFile){FS_createDataFile(parent,name,byteArray,canRead,canWrite,canOwn)}}finally{removeRunDependency(dep)}};var FS_createPreloadedFile=(parent,name,url,canRead,canWrite,onload,onerror,dontCreateFile,canOwn,preFinish)=>{FS_preloadFile(parent,name,url,canRead,canWrite,dontCreateFile,canOwn,preFinish).then(onload).catch(onerror)};var FS={root:null,mounts:[],devices:{},streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,filesystems:null,syncFSRequests:0,readFiles:{},ErrnoError:class{name="ErrnoError";constructor(errno){this.errno=errno}},FSStream:class{shared={};get object(){return this.node}set object(val){this.node=val}get isRead(){return(this.flags&2097155)!==1}get isWrite(){return(this.flags&2097155)!==0}get isAppend(){return this.flags&1024}get flags(){return this.shared.flags}set flags(val){this.shared.flags=val}get position(){return this.shared.position}set position(val){this.shared.position=val}},FSNode:class{node_ops={};stream_ops={};readMode=292|73;writeMode=146;mounted=null;constructor(parent,name,mode,rdev){if(!parent){parent=this}this.parent=parent;this.mount=parent.mount;this.id=FS.nextInode++;this.name=name;this.mode=mode;this.rdev=rdev;this.atime=this.mtime=this.ctime=Date.now()}get read(){return(this.mode&this.readMode)===this.readMode}set read(val){val?this.mode|=this.readMode:this.mode&=~this.readMode}get write(){return(this.mode&this.writeMode)===this.writeMode}set write(val){val?this.mode|=this.writeMode:this.mode&=~this.writeMode}get isFolder(){return FS.isDir(this.mode)}get isDevice(){return FS.isChrdev(this.mode)}},lookupPath(path,opts={}){if(!path){throw new FS.ErrnoError(44)}opts.follow_mount??=true;if(!PATH.isAbs(path)){path=FS.cwd()+"/"+path}linkloop:for(var nlinks=0;nlinks<40;nlinks++){var parts=path.split("/").filter(p=>!!p);var current=FS.root;var current_path="/";for(var i=0;i<parts.length;i++){var islast=i===parts.length-1;if(islast&&opts.parent){break}if(parts[i]==="."){continue}if(parts[i]===".."){current_path=PATH.dirname(current_path);if(FS.isRoot(current)){path=current_path+"/"+parts.slice(i+1).join("/");nlinks--;continue linkloop}else{current=current.parent}continue}current_path=PATH.join2(current_path,parts[i]);try{current=FS.lookupNode(current,parts[i])}catch(e){if(e?.errno===44&&islast&&opts.noent_okay){return{path:current_path}}throw e}if(FS.isMountpoint(current)&&(!islast||opts.follow_mount)){current=current.mounted.root}if(FS.isLink(current.mode)&&(!islast||opts.follow)){if(!current.node_ops.readlink){throw new FS.ErrnoError(52)}var link=current.node_ops.readlink(current);if(!PATH.isAbs(link)){link=PATH.dirname(current_path)+"/"+link}path=link+"/"+parts.slice(i+1).join("/");continue linkloop}}return{path:current_path,node:current}}throw new FS.ErrnoError(32)},getPath(node){var path;while(true){if(FS.isRoot(node)){var mount=node.mount.mountpoint;if(!path)return mount;return mount[mount.length-1]!=="/"?`${mount}/${path}`:mount+path}path=path?`${node.name}/${path}`:node.name;node=node.parent}},hashName(parentid,name){var hash=0;for(var i=0;i<name.length;i++){hash=(hash<<5)-hash+name.charCodeAt(i)|0}return(parentid+hash>>>0)%FS.nameTable.length},hashAddNode(node){var hash=FS.hashName(node.parent.id,node.name);node.name_next=FS.nameTable[hash];FS.nameTable[hash]=node},hashRemoveNode(node){var hash=FS.hashName(node.parent.id,node.name);if(FS.nameTable[hash]===node){FS.nameTable[hash]=node.name_next}else{var current=FS.nameTable[hash];while(current){if(current.name_next===node){current.name_next=node.name_next;break}current=current.name_next}}},lookupNode(parent,name){var errCode=FS.mayLookup(parent);if(errCode){throw new FS.ErrnoError(errCode)}var hash=FS.hashName(parent.id,name);for(var node=FS.nameTable[hash];node;node=node.name_next){var nodeName=node.name;if(node.parent.id===parent.id&&nodeName===name){return node}}return FS.lookup(parent,name)},createNode(parent,name,mode,rdev){var node=new FS.FSNode(parent,name,mode,rdev);FS.hashAddNode(node);return node},destroyNode(node){FS.hashRemoveNode(node)},isRoot(node){return node===node.parent},isMountpoint(node){return!!node.mounted},isFile(mode){return(mode&61440)===32768},isDir(mode){return(mode&61440)===16384},isLink(mode){return(mode&61440)===40960},isChrdev(mode){return(mode&61440)===8192},isBlkdev(mode){return(mode&61440)===24576},isFIFO(mode){return(mode&61440)===4096},isSocket(mode){return(mode&49152)===49152},flagsToPermissionString(flag){var perms=["r","w","rw"][flag&3];if(flag&512){perms+="w"}return perms},nodePermissions(node,perms){if(FS.ignorePermissions){return 0}if(perms.includes("r")&&!(node.mode&292)){return 2}else if(perms.includes("w")&&!(node.mode&146)){return 2}else if(perms.includes("x")&&!(node.mode&73)){return 2}return 0},mayLookup(dir){if(!FS.isDir(dir.mode))return 54;var errCode=FS.nodePermissions(dir,"x");if(errCode)return errCode;if(!dir.node_ops.lookup)return 2;return 0},mayCreate(dir,name){if(!FS.isDir(dir.mode)){return 54}try{var node=FS.lookupNode(dir,name);return 20}catch(e){}return FS.nodePermissions(dir,"wx")},mayDelete(dir,name,isdir){var node;try{node=FS.lookupNode(dir,name)}catch(e){return e.errno}var errCode=FS.nodePermissions(dir,"wx");if(errCode){return errCode}if(isdir){if(!FS.isDir(node.mode)){return 54}if(FS.isRoot(node)||FS.getPath(node)===FS.cwd()){return 10}}else{if(FS.isDir(node.mode)){return 31}}return 0},mayOpen(node,flags){if(!node){return 44}if(FS.isLink(node.mode)){return 32}else if(FS.isDir(node.mode)){if(FS.flagsToPermissionString(flags)!=="r"||flags&(512|64)){return 31}}return FS.nodePermissions(node,FS.flagsToPermissionString(flags))},checkOpExists(op,err){if(!op){throw new FS.ErrnoError(err)}return op},MAX_OPEN_FDS:4096,nextfd(){for(var fd=0;fd<=FS.MAX_OPEN_FDS;fd++){if(!FS.streams[fd]){return fd}}throw new FS.ErrnoError(33)},getStreamChecked(fd){var stream=FS.getStream(fd);if(!stream){throw new FS.ErrnoError(8)}return stream},getStream:fd=>FS.streams[fd],createStream(stream,fd=-1){stream=Object.assign(new FS.FSStream,stream);if(fd==-1){fd=FS.nextfd()}stream.fd=fd;FS.streams[fd]=stream;return stream},closeStream(fd){FS.streams[fd]=null},dupStream(origStream,fd=-1){var stream=FS.createStream(origStream,fd);stream.stream_ops?.dup?.(stream);return stream},doSetAttr(stream,node,attr){var setattr=stream?.stream_ops.setattr;var arg=setattr?stream:node;setattr??=node.node_ops.setattr;FS.checkOpExists(setattr,63);setattr(arg,attr)},chrdev_stream_ops:{open(stream){var device=FS.getDevice(stream.node.rdev);stream.stream_ops=device.stream_ops;stream.stream_ops.open?.(stream)},llseek(){throw new FS.ErrnoError(70)}},major:dev=>dev>>8,minor:dev=>dev&255,makedev:(ma,mi)=>ma<<8|mi,registerDevice(dev,ops){FS.devices[dev]={stream_ops:ops}},getDevice:dev=>FS.devices[dev],getMounts(mount){var mounts=[];var check=[mount];while(check.length){var m=check.pop();mounts.push(m);check.push(...m.mounts)}return mounts},syncfs(populate,callback){if(typeof populate=="function"){callback=populate;populate=false}FS.syncFSRequests++;if(FS.syncFSRequests>1){err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`)}var mounts=FS.getMounts(FS.root.mount);var completed=0;function doCallback(errCode){FS.syncFSRequests--;return callback(errCode)}function done(errCode){if(errCode){if(!done.errored){done.errored=true;return doCallback(errCode)}return}if(++completed>=mounts.length){doCallback(null)}}for(var mount of mounts){if(mount.type.syncfs){mount.type.syncfs(mount,populate,done)}else{done(null)}}},mount(type,opts,mountpoint){var root=mountpoint==="/";var pseudo=!mountpoint;var node;if(root&&FS.root){throw new FS.ErrnoError(10)}else if(!root&&!pseudo){var lookup=FS.lookupPath(mountpoint,{follow_mount:false});mountpoint=lookup.path;node=lookup.node;if(FS.isMountpoint(node)){throw new FS.ErrnoError(10)}if(!FS.isDir(node.mode)){throw new FS.ErrnoError(54)}}var mount={type,opts,mountpoint,mounts:[]};var mountRoot=type.mount(mount);mountRoot.mount=mount;mount.root=mountRoot;if(root){FS.root=mountRoot}else if(node){node.mounted=mount;if(node.mount){node.mount.mounts.push(mount)}}return mountRoot},unmount(mountpoint){var lookup=FS.lookupPath(mountpoint,{follow_mount:false});if(!FS.isMountpoint(lookup.node)){throw new FS.ErrnoError(28)}var node=lookup.node;var mount=node.mounted;var mounts=FS.getMounts(mount);for(var[hash,current]of Object.entries(FS.nameTable)){while(current){var next=current.name_next;if(mounts.includes(current.mount)){FS.destroyNode(current)}current=next}}node.mounted=null;var idx=node.mount.mounts.indexOf(mount);node.mount.mounts.splice(idx,1)},lookup(parent,name){return parent.node_ops.lookup(parent,name)},mknod(path,mode,dev){var lookup=FS.lookupPath(path,{parent:true});var parent=lookup.node;var name=PATH.basename(path);if(!name){throw new FS.ErrnoError(28)}if(name==="."||name===".."){throw new FS.ErrnoError(20)}var errCode=FS.mayCreate(parent,name);if(errCode){throw new FS.ErrnoError(errCode)}if(!parent.node_ops.mknod){throw new FS.ErrnoError(63)}return parent.node_ops.mknod(parent,name,mode,dev)},statfs(path){return FS.statfsNode(FS.lookupPath(path,{follow:true}).node)},statfsStream(stream){return FS.statfsNode(stream.node)},statfsNode(node){var rtn={bsize:4096,frsize:4096,blocks:1e6,bfree:5e5,bavail:5e5,files:FS.nextInode,ffree:FS.nextInode-1,fsid:42,flags:2,namelen:255};if(node.node_ops.statfs){Object.assign(rtn,node.node_ops.statfs(node.mount.opts.root))}return rtn},create(path,mode=438){mode&=4095;mode|=32768;return FS.mknod(path,mode,0)},mkdir(path,mode=511){mode&=511|512;mode|=16384;return FS.mknod(path,mode,0)},mkdirTree(path,mode){var dirs=path.split("/");var d="";for(var dir of dirs){if(!dir)continue;if(d||PATH.isAbs(path))d+="/";d+=dir;try{FS.mkdir(d,mode)}catch(e){if(e.errno!=20)throw e}}},mkdev(path,mode,dev){if(typeof dev=="undefined"){dev=mode;mode=438}mode|=8192;return FS.mknod(path,mode,dev)},symlink(oldpath,newpath){if(!PATH_FS.resolve(oldpath)){throw new FS.ErrnoError(44)}var lookup=FS.lookupPath(newpath,{parent:true});var parent=lookup.node;if(!parent){throw new FS.ErrnoError(44)}var newname=PATH.basename(newpath);var errCode=FS.mayCreate(parent,newname);if(errCode){throw new FS.ErrnoError(errCode)}if(!parent.node_ops.symlink){throw new FS.ErrnoError(63)}return parent.node_ops.symlink(parent,newname,oldpath)},rename(old_path,new_path){var old_dirname=PATH.dirname(old_path);var new_dirname=PATH.dirname(new_path);var old_name=PATH.basename(old_path);var new_name=PATH.basename(new_path);var lookup,old_dir,new_dir;lookup=FS.lookupPath(old_path,{parent:true});old_dir=lookup.node;lookup=FS.lookupPath(new_path,{parent:true});new_dir=lookup.node;if(!old_dir||!new_dir)throw new FS.ErrnoError(44);if(old_dir.mount!==new_dir.mount){throw new FS.ErrnoError(75)}var old_node=FS.lookupNode(old_dir,old_name);var relative=PATH_FS.relative(old_path,new_dirname);if(relative.charAt(0)!=="."){throw new FS.ErrnoError(28)}relative=PATH_FS.relative(new_path,old_dirname);if(relative.charAt(0)!=="."){throw new FS.ErrnoError(55)}var new_node;try{new_node=FS.lookupNode(new_dir,new_name)}catch(e){}if(old_node===new_node){return}var isdir=FS.isDir(old_node.mode);var errCode=FS.mayDelete(old_dir,old_name,isdir);if(errCode){throw new FS.ErrnoError(errCode)}errCode=new_node?FS.mayDelete(new_dir,new_name,isdir):FS.mayCreate(new_dir,new_name);if(errCode){throw new FS.ErrnoError(errCode)}if(!old_dir.node_ops.rename){throw new FS.ErrnoError(63)}if(FS.isMountpoint(old_node)||new_node&&FS.isMountpoint(new_node)){throw new FS.ErrnoError(10)}if(new_dir!==old_dir){errCode=FS.nodePermissions(old_dir,"w");if(errCode){throw new FS.ErrnoError(errCode)}}FS.hashRemoveNode(old_node);try{old_dir.node_ops.rename(old_node,new_dir,new_name);old_node.parent=new_dir}catch(e){throw e}finally{FS.hashAddNode(old_node)}},rmdir(path){var lookup=FS.lookupPath(path,{parent:true});var parent=lookup.node;var name=PATH.basename(path);var node=FS.lookupNode(parent,name);var errCode=FS.mayDelete(parent,name,true);if(errCode){throw new FS.ErrnoError(errCode)}if(!parent.node_ops.rmdir){throw new FS.ErrnoError(63)}if(FS.isMountpoint(node)){throw new FS.ErrnoError(10)}parent.node_ops.rmdir(parent,name);FS.destroyNode(node)},readdir(path){var lookup=FS.lookupPath(path,{follow:true});var node=lookup.node;var readdir=FS.checkOpExists(node.node_ops.readdir,54);return readdir(node)},unlink(path){var lookup=FS.lookupPath(path,{parent:true});var parent=lookup.node;if(!parent){throw new FS.ErrnoError(44)}var name=PATH.basename(path);var node=FS.lookupNode(parent,name);var errCode=FS.mayDelete(parent,name,false);if(errCode){throw new FS.ErrnoError(errCode)}if(!parent.node_ops.unlink){throw new FS.ErrnoError(63)}if(FS.isMountpoint(node)){throw new FS.ErrnoError(10)}parent.node_ops.unlink(parent,name);FS.destroyNode(node)},readlink(path){var lookup=FS.lookupPath(path);var link=lookup.node;if(!link){throw new FS.ErrnoError(44)}if(!link.node_ops.readlink){throw new FS.ErrnoError(28)}return link.node_ops.readlink(link)},stat(path,dontFollow){var lookup=FS.lookupPath(path,{follow:!dontFollow});var node=lookup.node;var getattr=FS.checkOpExists(node.node_ops.getattr,63);return getattr(node)},fstat(fd){var stream=FS.getStreamChecked(fd);var node=stream.node;var getattr=stream.stream_ops.getattr;var arg=getattr?stream:node;getattr??=node.node_ops.getattr;FS.checkOpExists(getattr,63);return getattr(arg)},lstat(path){return FS.stat(path,true)},doChmod(stream,node,mode,dontFollow){FS.doSetAttr(stream,node,{mode:mode&4095|node.mode&~4095,ctime:Date.now(),dontFollow})},chmod(path,mode,dontFollow){var node;if(typeof path=="string"){var lookup=FS.lookupPath(path,{follow:!dontFollow});node=lookup.node}else{node=path}FS.doChmod(null,node,mode,dontFollow)},lchmod(path,mode){FS.chmod(path,mode,true)},fchmod(fd,mode){var stream=FS.getStreamChecked(fd);FS.doChmod(stream,stream.node,mode,false)},doChown(stream,node,dontFollow){FS.doSetAttr(stream,node,{timestamp:Date.now(),dontFollow})},chown(path,uid,gid,dontFollow){var node;if(typeof path=="string"){var lookup=FS.lookupPath(path,{follow:!dontFollow});node=lookup.node}else{node=path}FS.doChown(null,node,dontFollow)},lchown(path,uid,gid){FS.chown(path,uid,gid,true)},fchown(fd,uid,gid){var stream=FS.getStreamChecked(fd);FS.doChown(stream,stream.node,false)},doTruncate(stream,node,len){if(FS.isDir(node.mode)){throw new FS.ErrnoError(31)}if(!FS.isFile(node.mode)){throw new FS.ErrnoError(28)}var errCode=FS.nodePermissions(node,"w");if(errCode){throw new FS.ErrnoError(errCode)}FS.doSetAttr(stream,node,{size:len,timestamp:Date.now()})},truncate(path,len){if(len<0){throw new FS.ErrnoError(28)}var node;if(typeof path=="string"){var lookup=FS.lookupPath(path,{follow:true});node=lookup.node}else{node=path}FS.doTruncate(null,node,len)},ftruncate(fd,len){var stream=FS.getStreamChecked(fd);if(len<0||(stream.flags&2097155)===0){throw new FS.ErrnoError(28)}FS.doTruncate(stream,stream.node,len)},utime(path,atime,mtime){var lookup=FS.lookupPath(path,{follow:true});var node=lookup.node;var setattr=FS.checkOpExists(node.node_ops.setattr,63);setattr(node,{atime,mtime})},open(path,flags,mode=438){if(path===""){throw new FS.ErrnoError(44)}flags=typeof flags=="string"?FS_modeStringToFlags(flags):flags;if(flags&64){mode=mode&4095|32768}else{mode=0}var node;var isDirPath;if(typeof path=="object"){node=path}else{isDirPath=path.endsWith("/");var lookup=FS.lookupPath(path,{follow:!(flags&131072),noent_okay:true});node=lookup.node;path=lookup.path}var created=false;if(flags&64){if(node){if(flags&128){throw new FS.ErrnoError(20)}}else if(isDirPath){throw new FS.ErrnoError(31)}else{node=FS.mknod(path,mode|511,0);created=true}}if(!node){throw new FS.ErrnoError(44)}if(FS.isChrdev(node.mode)){flags&=~512}if(flags&65536&&!FS.isDir(node.mode)){throw new FS.ErrnoError(54)}if(!created){var errCode=FS.mayOpen(node,flags);if(errCode){throw new FS.ErrnoError(errCode)}}if(flags&512&&!created){FS.truncate(node,0)}flags&=~(128|512|131072);var stream=FS.createStream({node,path:FS.getPath(node),flags,seekable:true,position:0,stream_ops:node.stream_ops,ungotten:[],error:false});if(stream.stream_ops.open){stream.stream_ops.open(stream)}if(created){FS.chmod(node,mode&511)}if(Module["logReadFiles"]&&!(flags&1)){if(!(path in FS.readFiles)){FS.readFiles[path]=1}}return stream},close(stream){if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if(stream.getdents)stream.getdents=null;try{if(stream.stream_ops.close){stream.stream_ops.close(stream)}}catch(e){throw e}finally{FS.closeStream(stream.fd)}stream.fd=null},isClosed(stream){return stream.fd===null},llseek(stream,offset,whence){if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if(!stream.seekable||!stream.stream_ops.llseek){throw new FS.ErrnoError(70)}if(whence!=0&&whence!=1&&whence!=2){throw new FS.ErrnoError(28)}stream.position=stream.stream_ops.llseek(stream,offset,whence);stream.ungotten=[];return stream.position},read(stream,buffer,offset,length,position){if(length<0||position<0){throw new FS.ErrnoError(28)}if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if((stream.flags&2097155)===1){throw new FS.ErrnoError(8)}if(FS.isDir(stream.node.mode)){throw new FS.ErrnoError(31)}if(!stream.stream_ops.read){throw new FS.ErrnoError(28)}var seeking=typeof position!="undefined";if(!seeking){position=stream.position}else if(!stream.seekable){throw new FS.ErrnoError(70)}var bytesRead=stream.stream_ops.read(stream,buffer,offset,length,position);if(!seeking)stream.position+=bytesRead;return bytesRead},write(stream,buffer,offset,length,position,canOwn){if(length<0||position<0){throw new FS.ErrnoError(28)}if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if((stream.flags&2097155)===0){throw new FS.ErrnoError(8)}if(FS.isDir(stream.node.mode)){throw new FS.ErrnoError(31)}if(!stream.stream_ops.write){throw new FS.ErrnoError(28)}if(stream.seekable&&stream.flags&1024){FS.llseek(stream,0,2)}var seeking=typeof position!="undefined";if(!seeking){position=stream.position}else if(!stream.seekable){throw new FS.ErrnoError(70)}var bytesWritten=stream.stream_ops.write(stream,buffer,offset,length,position,canOwn);if(!seeking)stream.position+=bytesWritten;return bytesWritten},mmap(stream,length,position,prot,flags){if((prot&2)!==0&&(flags&2)===0&&(stream.flags&2097155)!==2){throw new FS.ErrnoError(2)}if((stream.flags&2097155)===1){throw new FS.ErrnoError(2)}if(!stream.stream_ops.mmap){throw new FS.ErrnoError(43)}if(!length){throw new FS.ErrnoError(28)}return stream.stream_ops.mmap(stream,length,position,prot,flags)},msync(stream,buffer,offset,length,mmapFlags){if(!stream.stream_ops.msync){return 0}return stream.stream_ops.msync(stream,buffer,offset,length,mmapFlags)},ioctl(stream,cmd,arg){if(!stream.stream_ops.ioctl){throw new FS.ErrnoError(59)}return stream.stream_ops.ioctl(stream,cmd,arg)},readFile(path,opts={}){opts.flags=opts.flags||0;opts.encoding=opts.encoding||"binary";if(opts.encoding!=="utf8"&&opts.encoding!=="binary"){abort(`Invalid encoding type "${opts.encoding}"`)}var stream=FS.open(path,opts.flags);var stat=FS.stat(path);var length=stat.size;var buf=new Uint8Array(length);FS.read(stream,buf,0,length,0);if(opts.encoding==="utf8"){buf=UTF8ArrayToString(buf)}FS.close(stream);return buf},writeFile(path,data,opts={}){opts.flags=opts.flags||577;var stream=FS.open(path,opts.flags,opts.mode);if(typeof data=="string"){data=new Uint8Array(intArrayFromString(data,true))}if(ArrayBuffer.isView(data)){FS.write(stream,data,0,data.byteLength,undefined,opts.canOwn)}else{abort("Unsupported data type")}FS.close(stream)},cwd:()=>FS.currentPath,chdir(path){var lookup=FS.lookupPath(path,{follow:true});if(lookup.node===null){throw new FS.ErrnoError(44)}if(!FS.isDir(lookup.node.mode)){throw new FS.ErrnoError(54)}var errCode=FS.nodePermissions(lookup.node,"x");if(errCode){throw new FS.ErrnoError(errCode)}FS.currentPath=lookup.path},createDefaultDirectories(){FS.mkdir("/tmp");FS.mkdir("/home");FS.mkdir("/home/web_user")},createDefaultDevices(){FS.mkdir("/dev");FS.registerDevice(FS.makedev(1,3),{read:()=>0,write:(stream,buffer,offset,length,pos)=>length,llseek:()=>0});FS.mkdev("/dev/null",FS.makedev(1,3));TTY.register(FS.makedev(5,0),TTY.default_tty_ops);TTY.register(FS.makedev(6,0),TTY.default_tty1_ops);FS.mkdev("/dev/tty",FS.makedev(5,0));FS.mkdev("/dev/tty1",FS.makedev(6,0));var randomBuffer=new Uint8Array(1024),randomLeft=0;var randomByte=()=>{if(randomLeft===0){randomFill(randomBuffer);randomLeft=randomBuffer.byteLength}return randomBuffer[--randomLeft]};FS.createDevice("/dev","random",randomByte);FS.createDevice("/dev","urandom",randomByte);FS.mkdir("/dev/shm");FS.mkdir("/dev/shm/tmp")},createSpecialDirectories(){FS.mkdir("/proc");var proc_self=FS.mkdir("/proc/self");FS.mkdir("/proc/self/fd");FS.mount({mount(){var node=FS.createNode(proc_self,"fd",16895,73);node.stream_ops={llseek:MEMFS.stream_ops.llseek};node.node_ops={lookup(parent,name){var fd=+name;var stream=FS.getStreamChecked(fd);var ret={parent:null,mount:{mountpoint:"fake"},node_ops:{readlink:()=>stream.path},id:fd+1};ret.parent=ret;return ret},readdir(){return Array.from(FS.streams.entries()).filter(([k,v])=>v).map(([k,v])=>k.toString())}};return node}},{},"/proc/self/fd")},createStandardStreams(input,output,error){if(input){FS.createDevice("/dev","stdin",input)}else{FS.symlink("/dev/tty","/dev/stdin")}if(output){FS.createDevice("/dev","stdout",null,output)}else{FS.symlink("/dev/tty","/dev/stdout")}if(error){FS.createDevice("/dev","stderr",null,error)}else{FS.symlink("/dev/tty1","/dev/stderr")}var stdin=FS.open("/dev/stdin",0);var stdout=FS.open("/dev/stdout",1);var stderr=FS.open("/dev/stderr",1)},staticInit(){FS.nameTable=new Array(4096);FS.mount(MEMFS,{},"/");FS.createDefaultDirectories();FS.createDefaultDevices();FS.createSpecialDirectories();FS.filesystems={MEMFS}},init(input,output,error){FS.initialized=true;input??=Module["stdin"];output??=Module["stdout"];error??=Module["stderr"];FS.createStandardStreams(input,output,error)},quit(){FS.initialized=false;for(var stream of FS.streams){if(stream){FS.close(stream)}}},findObject(path,dontResolveLastLink){var ret=FS.analyzePath(path,dontResolveLastLink);if(!ret.exists){return null}return ret.object},analyzePath(path,dontResolveLastLink){try{var lookup=FS.lookupPath(path,{follow:!dontResolveLastLink});path=lookup.path}catch(e){}var ret={isRoot:false,exists:false,error:0,name:null,path:null,object:null,parentExists:false,parentPath:null,parentObject:null};try{var lookup=FS.lookupPath(path,{parent:true});ret.parentExists=true;ret.parentPath=lookup.path;ret.parentObject=lookup.node;ret.name=PATH.basename(path);lookup=FS.lookupPath(path,{follow:!dontResolveLastLink});ret.exists=true;ret.path=lookup.path;ret.object=lookup.node;ret.name=lookup.node.name;ret.isRoot=lookup.path==="/"}catch(e){ret.error=e.errno}return ret},createPath(parent,path,canRead,canWrite){parent=typeof parent=="string"?parent:FS.getPath(parent);var parts=path.split("/").reverse();while(parts.length){var part=parts.pop();if(!part)continue;var current=PATH.join2(parent,part);try{FS.mkdir(current)}catch(e){if(e.errno!=20)throw e}parent=current}return current},createFile(parent,name,properties,canRead,canWrite){var path=PATH.join2(typeof parent=="string"?parent:FS.getPath(parent),name);var mode=FS_getMode(canRead,canWrite);return FS.create(path,mode)},createDataFile(parent,name,data,canRead,canWrite,canOwn){var path=name;if(parent){parent=typeof parent=="string"?parent:FS.getPath(parent);path=name?PATH.join2(parent,name):parent}var mode=FS_getMode(canRead,canWrite);var node=FS.create(path,mode);if(data){if(typeof data=="string"){var arr=new Array(data.length);for(var i=0,len=data.length;i<len;++i)arr[i]=data.charCodeAt(i);data=arr}FS.chmod(node,mode|146);var stream=FS.open(node,577);FS.write(stream,data,0,data.length,0,canOwn);FS.close(stream);FS.chmod(node,mode)}},createDevice(parent,name,input,output){var path=PATH.join2(typeof parent=="string"?parent:FS.getPath(parent),name);var mode=FS_getMode(!!input,!!output);FS.createDevice.major??=64;var dev=FS.makedev(FS.createDevice.major++,0);FS.registerDevice(dev,{open(stream){stream.seekable=false},close(stream){if(output?.buffer?.length){output(10)}},read(stream,buffer,offset,length,pos){var bytesRead=0;for(var i=0;i<length;i++){var result;try{result=input()}catch(e){throw new FS.ErrnoError(29)}if(result===undefined&&bytesRead===0){throw new FS.ErrnoError(6)}if(result===null||result===undefined)break;bytesRead++;buffer[offset+i]=result}if(bytesRead){stream.node.atime=Date.now()}return bytesRead},write(stream,buffer,offset,length,pos){for(var i=0;i<length;i++){try{output(buffer[offset+i])}catch(e){throw new FS.ErrnoError(29)}}if(length){stream.node.mtime=stream.node.ctime=Date.now()}return i}});return FS.mkdev(path,mode,dev)},forceLoadFile(obj){if(obj.isDevice||obj.isFolder||obj.link||obj.contents)return true;if(globalThis.XMLHttpRequest){abort("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")}else{try{obj.contents=readBinary(obj.url)}catch(e){throw new FS.ErrnoError(29)}}},createLazyFile(parent,name,url,canRead,canWrite){class LazyUint8Array{lengthKnown=false;chunks=[];get(idx){if(idx>this.length-1||idx<0){return undefined}var chunkOffset=idx%this.chunkSize;var chunkNum=idx/this.chunkSize|0;return this.getter(chunkNum)[chunkOffset]}setDataGetter(getter){this.getter=getter}cacheLength(){var xhr=new XMLHttpRequest;xhr.open("HEAD",url,false);xhr.send(null);if(!(xhr.status>=200&&xhr.status<300||xhr.status===304))abort("Couldn\'t load "+url+". Status: "+xhr.status);var datalength=Number(xhr.getResponseHeader("Content-length"));var header;var hasByteServing=(header=xhr.getResponseHeader("Accept-Ranges"))&&header==="bytes";var usesGzip=(header=xhr.getResponseHeader("Content-Encoding"))&&header==="gzip";var chunkSize=1024*1024;if(!hasByteServing)chunkSize=datalength;var doXHR=(from,to)=>{if(from>to)abort("invalid range ("+from+", "+to+") or no bytes requested!");if(to>datalength-1)abort("only "+datalength+" bytes available! programmer error!");var xhr=new XMLHttpRequest;xhr.open("GET",url,false);if(datalength!==chunkSize)xhr.setRequestHeader("Range","bytes="+from+"-"+to);xhr.responseType="arraybuffer";if(xhr.overrideMimeType){xhr.overrideMimeType("text/plain; charset=x-user-defined")}xhr.send(null);if(!(xhr.status>=200&&xhr.status<300||xhr.status===304))abort("Couldn\'t load "+url+". Status: "+xhr.status);if(xhr.response!==undefined){return new Uint8Array(xhr.response||[])}return intArrayFromString(xhr.responseText||"",true)};var lazyArray=this;lazyArray.setDataGetter(chunkNum=>{var start=chunkNum*chunkSize;var end=(chunkNum+1)*chunkSize-1;end=Math.min(end,datalength-1);if(typeof lazyArray.chunks[chunkNum]=="undefined"){lazyArray.chunks[chunkNum]=doXHR(start,end)}if(typeof lazyArray.chunks[chunkNum]=="undefined")abort("doXHR failed!");return lazyArray.chunks[chunkNum]});if(usesGzip||!datalength){chunkSize=datalength=1;datalength=this.getter(0).length;chunkSize=datalength;out("LazyFiles on gzip forces download of the whole file when length is accessed")}this._length=datalength;this._chunkSize=chunkSize;this.lengthKnown=true}get length(){if(!this.lengthKnown){this.cacheLength()}return this._length}get chunkSize(){if(!this.lengthKnown){this.cacheLength()}return this._chunkSize}}if(globalThis.XMLHttpRequest){if(!ENVIRONMENT_IS_WORKER)abort("Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc");var lazyArray=new LazyUint8Array;var properties={isDevice:false,contents:lazyArray}}else{var properties={isDevice:false,url}}var node=FS.createFile(parent,name,properties,canRead,canWrite);if(properties.contents){node.contents=properties.contents}else if(properties.url){node.contents=null;node.url=properties.url}Object.defineProperties(node,{usedBytes:{get:function(){return this.contents.length}}});var stream_ops={};for(const[key,fn]of Object.entries(node.stream_ops)){stream_ops[key]=(...args)=>{FS.forceLoadFile(node);return fn(...args)}}function writeChunks(stream,buffer,offset,length,position){var contents=stream.node.contents;if(position>=contents.length)return 0;var size=Math.min(contents.length-position,length);if(contents.slice){for(var i=0;i<size;i++){buffer[offset+i]=contents[position+i]}}else{for(var i=0;i<size;i++){buffer[offset+i]=contents.get(position+i)}}return size}stream_ops.read=(stream,buffer,offset,length,position)=>{FS.forceLoadFile(node);return writeChunks(stream,buffer,offset,length,position)};stream_ops.mmap=(stream,length,position,prot,flags)=>{FS.forceLoadFile(node);var ptr=mmapAlloc(length);if(!ptr){throw new FS.ErrnoError(48)}writeChunks(stream,(growMemViews(),HEAP8),ptr,length,position);return{ptr,allocated:true}};node.stream_ops=stream_ops;return node}};var UTF8ToString=(ptr,maxBytesToRead,ignoreNul)=>ptr?UTF8ArrayToString((growMemViews(),HEAPU8),ptr,maxBytesToRead,ignoreNul):"";var SYSCALLS={DEFAULT_POLLMASK:5,calculateAt(dirfd,path,allowEmpty){if(PATH.isAbs(path)){return path}var dir;if(dirfd===-100){dir=FS.cwd()}else{var dirstream=SYSCALLS.getStreamFromFD(dirfd);dir=dirstream.path}if(path.length==0){if(!allowEmpty){throw new FS.ErrnoError(44)}return dir}return dir+"/"+path},writeStat(buf,stat){(growMemViews(),HEAPU32)[buf/4]=stat.dev;(growMemViews(),HEAPU32)[(buf+4)/4]=stat.mode;(growMemViews(),HEAPU64)[(buf+8)/8]=BigInt(stat.nlink);(growMemViews(),HEAPU32)[(buf+16)/4]=stat.uid;(growMemViews(),HEAPU32)[(buf+20)/4]=stat.gid;(growMemViews(),HEAPU32)[(buf+24)/4]=stat.rdev;(growMemViews(),HEAP64)[(buf+32)/8]=BigInt(stat.size);(growMemViews(),HEAP32)[(buf+40)/4]=4096;(growMemViews(),HEAP32)[(buf+44)/4]=stat.blocks;var atime=stat.atime.getTime();var mtime=stat.mtime.getTime();var ctime=stat.ctime.getTime();(growMemViews(),HEAP64)[(buf+48)/8]=BigInt(Math.floor(atime/1e3));(growMemViews(),HEAPU64)[(buf+56)/8]=BigInt(atime%1e3*1e3*1e3);(growMemViews(),HEAP64)[(buf+64)/8]=BigInt(Math.floor(mtime/1e3));(growMemViews(),HEAPU64)[(buf+72)/8]=BigInt(mtime%1e3*1e3*1e3);(growMemViews(),HEAP64)[(buf+80)/8]=BigInt(Math.floor(ctime/1e3));(growMemViews(),HEAPU64)[(buf+88)/8]=BigInt(ctime%1e3*1e3*1e3);(growMemViews(),HEAP64)[(buf+96)/8]=BigInt(stat.ino);return 0},writeStatFs(buf,stats){(growMemViews(),HEAPU32)[(buf+8)/4]=stats.bsize;(growMemViews(),HEAPU32)[(buf+72)/4]=stats.bsize;(growMemViews(),HEAP64)[(buf+16)/8]=BigInt(stats.blocks);(growMemViews(),HEAP64)[(buf+24)/8]=BigInt(stats.bfree);(growMemViews(),HEAP64)[(buf+32)/8]=BigInt(stats.bavail);(growMemViews(),HEAP64)[(buf+40)/8]=BigInt(stats.files);(growMemViews(),HEAP64)[(buf+48)/8]=BigInt(stats.ffree);(growMemViews(),HEAPU32)[(buf+56)/4]=stats.fsid;(growMemViews(),HEAPU32)[(buf+80)/4]=stats.flags;(growMemViews(),HEAPU32)[(buf+64)/4]=stats.namelen},doMsync(addr,stream,len,flags,offset){if(!FS.isFile(stream.node.mode)){throw new FS.ErrnoError(43)}if(flags&2){return 0}var buffer=(growMemViews(),HEAPU8).slice(addr,addr+len);FS.msync(stream,buffer,offset,len,flags)},getStreamFromFD(fd){var stream=FS.getStreamChecked(fd);return stream},varargs:undefined,getStr(ptr){var ret=UTF8ToString(ptr);return ret}};function ___syscall_fcntl64(fd,cmd,varargs){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(3,0,1,fd,cmd,varargs);varargs=bigintToI53Checked(varargs);SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD(fd);switch(cmd){case 0:{var arg=syscallGetVarargI();if(arg<0){return-28}while(FS.streams[arg]){arg++}var newStream;newStream=FS.dupStream(stream,arg);return newStream.fd}case 1:case 2:return 0;case 3:return stream.flags;case 4:{var arg=syscallGetVarargI();stream.flags|=arg;return 0}case 5:{var arg=syscallGetVarargP();var offset=0;(growMemViews(),HEAP16)[(arg+offset)/2]=2;return 0}case 6:case 7:return 0}return-28}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_fstat64(fd,buf){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(4,0,1,fd,buf);buf=bigintToI53Checked(buf);try{return SYSCALLS.writeStat(buf,FS.fstat(fd))}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}var stringToUTF8=(str,outPtr,maxBytesToWrite)=>stringToUTF8Array(str,(growMemViews(),HEAPU8),outPtr,maxBytesToWrite);function ___syscall_getcwd(buf,size){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(5,0,1,buf,size);buf=bigintToI53Checked(buf);size=bigintToI53Checked(size);try{if(size===0)return-28;var cwd=FS.cwd();var cwdLengthInBytes=lengthBytesUTF8(cwd)+1;if(size<cwdLengthInBytes)return-68;stringToUTF8(cwd,buf,size);return cwdLengthInBytes}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_getdents64(fd,dirp,count){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(6,0,1,fd,dirp,count);dirp=bigintToI53Checked(dirp);count=bigintToI53Checked(count);try{var stream=SYSCALLS.getStreamFromFD(fd);stream.getdents||=FS.readdir(stream.path);var struct_size=280;var pos=0;var off=FS.llseek(stream,0,1);var startIdx=Math.floor(off/struct_size);var endIdx=Math.min(stream.getdents.length,startIdx+Math.floor(count/struct_size));for(var idx=startIdx;idx<endIdx;idx++){var id;var type;var name=stream.getdents[idx];if(name==="."){id=stream.node.id;type=4}else if(name===".."){var lookup=FS.lookupPath(stream.path,{parent:true});id=lookup.node.id;type=4}else{var child;try{child=FS.lookupNode(stream.node,name)}catch(e){if(e?.errno===28){continue}throw e}id=child.id;type=FS.isChrdev(child.mode)?2:FS.isDir(child.mode)?4:FS.isLink(child.mode)?10:8}(growMemViews(),HEAP64)[(dirp+pos)/8]=BigInt(id);(growMemViews(),HEAP64)[(dirp+pos+8)/8]=BigInt((idx+1)*struct_size);(growMemViews(),HEAP16)[(dirp+pos+16)/2]=280;(growMemViews(),HEAP8)[dirp+pos+18]=type;stringToUTF8(name,dirp+pos+19,256);pos+=struct_size}FS.llseek(stream,idx*struct_size,0);return pos}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_ioctl(fd,op,varargs){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(7,0,1,fd,op,varargs);varargs=bigintToI53Checked(varargs);SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD(fd);switch(op){case 21509:{if(!stream.tty)return-59;return 0}case 21505:{if(!stream.tty)return-59;if(stream.tty.ops.ioctl_tcgets){var termios=stream.tty.ops.ioctl_tcgets(stream);var argp=syscallGetVarargP();(growMemViews(),HEAP32)[argp/4]=termios.c_iflag||0;(growMemViews(),HEAP32)[(argp+4)/4]=termios.c_oflag||0;(growMemViews(),HEAP32)[(argp+8)/4]=termios.c_cflag||0;(growMemViews(),HEAP32)[(argp+12)/4]=termios.c_lflag||0;for(var i=0;i<32;i++){(growMemViews(),HEAP8)[argp+i+17]=termios.c_cc[i]||0}return 0}return 0}case 21510:case 21511:case 21512:{if(!stream.tty)return-59;return 0}case 21506:case 21507:case 21508:{if(!stream.tty)return-59;if(stream.tty.ops.ioctl_tcsets){var argp=syscallGetVarargP();var c_iflag=(growMemViews(),HEAP32)[argp/4];var c_oflag=(growMemViews(),HEAP32)[(argp+4)/4];var c_cflag=(growMemViews(),HEAP32)[(argp+8)/4];var c_lflag=(growMemViews(),HEAP32)[(argp+12)/4];var c_cc=[];for(var i=0;i<32;i++){c_cc.push((growMemViews(),HEAP8)[argp+i+17])}return stream.tty.ops.ioctl_tcsets(stream.tty,op,{c_iflag,c_oflag,c_cflag,c_lflag,c_cc})}return 0}case 21519:{if(!stream.tty)return-59;var argp=syscallGetVarargP();(growMemViews(),HEAP32)[argp/4]=0;return 0}case 21520:{if(!stream.tty)return-59;return-28}case 21537:case 21531:{var argp=syscallGetVarargP();return FS.ioctl(stream,op,argp)}case 21523:{if(!stream.tty)return-59;if(stream.tty.ops.ioctl_tiocgwinsz){var winsize=stream.tty.ops.ioctl_tiocgwinsz(stream.tty);var argp=syscallGetVarargP();(growMemViews(),HEAP16)[argp/2]=winsize[0];(growMemViews(),HEAP16)[(argp+2)/2]=winsize[1]}return 0}case 21524:{if(!stream.tty)return-59;return 0}case 21515:{if(!stream.tty)return-59;return 0}default:return-28}}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_lstat64(path,buf){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(8,0,1,path,buf);path=bigintToI53Checked(path);buf=bigintToI53Checked(buf);try{path=SYSCALLS.getStr(path);return SYSCALLS.writeStat(buf,FS.lstat(path))}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_newfstatat(dirfd,path,buf,flags){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(9,0,1,dirfd,path,buf,flags);path=bigintToI53Checked(path);buf=bigintToI53Checked(buf);try{path=SYSCALLS.getStr(path);var nofollow=flags&256;var allowEmpty=flags&4096;flags=flags&~6400;path=SYSCALLS.calculateAt(dirfd,path,allowEmpty);return SYSCALLS.writeStat(buf,nofollow?FS.lstat(path):FS.stat(path))}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_openat(dirfd,path,flags,varargs){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(10,0,1,dirfd,path,flags,varargs);path=bigintToI53Checked(path);varargs=bigintToI53Checked(varargs);SYSCALLS.varargs=varargs;try{path=SYSCALLS.getStr(path);path=SYSCALLS.calculateAt(dirfd,path);var mode=varargs?syscallGetVarargI():0;return FS.open(path,flags,mode).fd}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_stat64(path,buf){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(11,0,1,path,buf);path=bigintToI53Checked(path);buf=bigintToI53Checked(buf);try{path=SYSCALLS.getStr(path);return SYSCALLS.writeStat(buf,FS.stat(path))}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}var __abort_js=()=>abort("");function __emscripten_init_main_thread_js(tb){tb=bigintToI53Checked(tb);__emscripten_thread_init(tb,!ENVIRONMENT_IS_WORKER,1,!ENVIRONMENT_IS_WEB,65536,false);PThread.threadInitTLS()}var handleException=e=>{if(e instanceof ExitStatus||e=="unwind"){return EXITSTATUS}quit_(1,e)};var maybeExit=()=>{if(!keepRuntimeAlive()){try{if(ENVIRONMENT_IS_PTHREAD){if(_pthread_self())__emscripten_thread_exit(EXITSTATUS);return}_exit(EXITSTATUS)}catch(e){handleException(e)}}};var callUserCallback=func=>{if(ABORT){return}try{func();maybeExit()}catch(e){handleException(e)}};function __emscripten_thread_mailbox_await(pthread_ptr){pthread_ptr=bigintToI53Checked(pthread_ptr);if(Atomics.waitAsync){var wait=Atomics.waitAsync((growMemViews(),HEAP32),pthread_ptr/4,pthread_ptr);wait.value.then(checkMailbox);var waitingAsync=pthread_ptr+228;Atomics.store((growMemViews(),HEAP32),waitingAsync/4,1)}}var checkMailbox=()=>callUserCallback(()=>{var pthread_ptr=_pthread_self();if(pthread_ptr){__emscripten_thread_mailbox_await(pthread_ptr);__emscripten_check_mailbox()}});function __emscripten_notify_mailbox_postmessage(targetThread,currThreadId){targetThread=bigintToI53Checked(targetThread);currThreadId=bigintToI53Checked(currThreadId);if(targetThread==currThreadId){setTimeout(checkMailbox)}else if(ENVIRONMENT_IS_PTHREAD){postMessage({targetThread,cmd:"checkMailbox"})}else{var worker=PThread.pthreads[targetThread];if(!worker){return}worker.postMessage({cmd:"checkMailbox"})}}var proxiedJSCallArgs=[];function __emscripten_receive_on_main_thread_js(funcIndex,emAsmAddr,callingThread,numCallArgs,args){emAsmAddr=bigintToI53Checked(emAsmAddr);callingThread=bigintToI53Checked(callingThread);args=bigintToI53Checked(args);numCallArgs/=2;proxiedJSCallArgs.length=numCallArgs;var b=args/8;for(var i=0;i<numCallArgs;i++){if((growMemViews(),HEAP64)[b+2*i]){proxiedJSCallArgs[i]=(growMemViews(),HEAP64)[b+2*i+1]}else{proxiedJSCallArgs[i]=(growMemViews(),HEAPF64)[b+2*i+1]}}var func=proxiedFunctionTable[funcIndex];PThread.currentProxiedOperationCallerThread=callingThread;var rtn=func(...proxiedJSCallArgs);PThread.currentProxiedOperationCallerThread=0;if(typeof rtn=="bigint"){rtn=bigintToI53Checked(rtn)}return rtn}function __emscripten_thread_cleanup(thread){thread=bigintToI53Checked(thread);if(!ENVIRONMENT_IS_PTHREAD)cleanupThread(thread);else postMessage({cmd:"cleanupThread",thread})}function __emscripten_thread_set_strongref(thread){thread=bigintToI53Checked(thread);if(ENVIRONMENT_IS_NODE){PThread.pthreads[thread].ref()}}function __mmap_js(len,prot,flags,fd,offset,allocated,addr){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(12,0,1,len,prot,flags,fd,offset,allocated,addr);len=bigintToI53Checked(len);offset=bigintToI53Checked(offset);allocated=bigintToI53Checked(allocated);addr=bigintToI53Checked(addr);try{var stream=SYSCALLS.getStreamFromFD(fd);var res=FS.mmap(stream,len,offset,prot,flags);var ptr=res.ptr;(growMemViews(),HEAP32)[allocated/4]=res.allocated;(growMemViews(),HEAPU64)[addr/8]=BigInt(ptr);return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function __munmap_js(addr,len,prot,flags,fd,offset){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(13,0,1,addr,len,prot,flags,fd,offset);addr=bigintToI53Checked(addr);len=bigintToI53Checked(len);offset=bigintToI53Checked(offset);try{var stream=SYSCALLS.getStreamFromFD(fd);if(prot&2){SYSCALLS.doMsync(addr,stream,len,flags,offset)}}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}var __tzset_js=function(timezone,daylight,std_name,dst_name){timezone=bigintToI53Checked(timezone);daylight=bigintToI53Checked(daylight);std_name=bigintToI53Checked(std_name);dst_name=bigintToI53Checked(dst_name);var currentYear=(new Date).getFullYear();var winter=new Date(currentYear,0,1);var summer=new Date(currentYear,6,1);var winterOffset=winter.getTimezoneOffset();var summerOffset=summer.getTimezoneOffset();var stdTimezoneOffset=Math.max(winterOffset,summerOffset);(growMemViews(),HEAPU64)[timezone/8]=BigInt(stdTimezoneOffset*60);(growMemViews(),HEAP32)[daylight/4]=Number(winterOffset!=summerOffset);var extractZone=timezoneOffset=>{var sign=timezoneOffset>=0?"-":"+";var absOffset=Math.abs(timezoneOffset);var hours=String(Math.floor(absOffset/60)).padStart(2,"0");var minutes=String(absOffset%60).padStart(2,"0");return`UTC${sign}${hours}${minutes}`};var winterName=extractZone(winterOffset);var summerName=extractZone(summerOffset);if(summerOffset<winterOffset){stringToUTF8(winterName,std_name,17);stringToUTF8(summerName,dst_name,17)}else{stringToUTF8(winterName,dst_name,17);stringToUTF8(summerName,std_name,17)}};var _emscripten_get_now=()=>performance.timeOrigin+performance.now();var _emscripten_date_now=()=>Date.now();var nowIsMonotonic=1;var checkWasiClock=clock_id=>clock_id>=0&&clock_id<=3;function _clock_time_get(clk_id,ignored_precision,ptime){ignored_precision=bigintToI53Checked(ignored_precision);ptime=bigintToI53Checked(ptime);if(!checkWasiClock(clk_id)){return 28}var now;if(clk_id===0){now=_emscripten_date_now()}else if(nowIsMonotonic){now=_emscripten_get_now()}else{return 52}var nsec=Math.round(now*1e3*1e3);(growMemViews(),HEAP64)[ptime/8]=BigInt(nsec);return 0}var _emscripten_check_blocking_allowed=()=>{};var runtimeKeepalivePush=()=>{runtimeKeepaliveCounter+=1};var _emscripten_exit_with_live_runtime=()=>{runtimeKeepalivePush();throw"unwind"};var jsStackTrace=()=>(new Error).stack.toString();var getCallstack=flags=>{var callstack=jsStackTrace();var lines=callstack.split("\\n");callstack="";var firefoxRe=new RegExp("\\\\s*(.*?)@(.*?):([0-9]+):([0-9]+)");var chromeRe=new RegExp("\\\\s*at (.*?) \\\\((.*):(.*):(.*)\\\\)");for(var line of lines){var symbolName="";var file="";var lineno=0;var column=0;var parts=chromeRe.exec(line);if(parts?.length==5){symbolName=parts[1];file=parts[2];lineno=parts[3];column=parts[4]}else{parts=firefoxRe.exec(line);if(parts?.length>=4){symbolName=parts[1];file=parts[2];lineno=parts[3];column=parts[4]|0}else{callstack+=line+"\\n";continue}}if(symbolName=="_emscripten_log"||symbolName=="_emscripten_get_callstack"){callstack="";continue}if(flags&24){if(flags&64){file=file.substring(file.replace(/\\\\/g,"/").lastIndexOf("/")+1)}callstack+=`    at ${symbolName} (${file}:${lineno}:${column})\\n`}}callstack=callstack.replace(/\\s+$/,"");return callstack};function _emscripten_get_callstack(flags,str,maxbytes){str=bigintToI53Checked(str);var callstack=getCallstack(flags);if(!str||maxbytes<=0){return lengthBytesUTF8(callstack)+1}var bytesWrittenExcludingNull=stringToUTF8(callstack,str,maxbytes);return bytesWrittenExcludingNull+1}var getHeapMax=()=>4294967296;var _emscripten_get_heap_max=()=>BigInt(getHeapMax());var _emscripten_has_asyncify=()=>2;var _emscripten_num_logical_cores=()=>ENVIRONMENT_IS_NODE?require("os").cpus().length:navigator["hardwareConcurrency"];var growMemory=size=>{var oldHeapSize=wasmMemory.buffer.byteLength;var pages=(size-oldHeapSize+65535)/65536|0;try{wasmMemory.grow(BigInt(pages));updateMemoryViews();return 1}catch(e){}};function _emscripten_resize_heap(requestedSize){requestedSize=bigintToI53Checked(requestedSize);var oldSize=(growMemViews(),HEAPU8).length;if(requestedSize<=oldSize){return false}var maxHeapSize=getHeapMax();if(requestedSize>maxHeapSize){return false}for(var cutDown=1;cutDown<=4;cutDown*=2){var overGrownHeapSize=oldSize*(1+.2/cutDown);overGrownHeapSize=Math.min(overGrownHeapSize,requestedSize+100663296);var newSize=Math.min(maxHeapSize,alignMemory(Math.max(requestedSize,overGrownHeapSize),65536));var replacement=growMemory(newSize);if(replacement){return true}}return false}var stringToUTF8OnStack=str=>{var size=lengthBytesUTF8(str)+1;var ret=stackAlloc(size);stringToUTF8(str,ret,size);return ret};var writeI53ToI64=(ptr,num)=>{(growMemViews(),HEAPU32)[ptr/4]=num;var lower=(growMemViews(),HEAPU32)[ptr/4];(growMemViews(),HEAPU32)[(ptr+4)/4]=(num-lower)/4294967296};var stringToNewUTF8=str=>{var size=lengthBytesUTF8(str)+1;var ret=_malloc(size);if(ret)stringToUTF8(str,ret,size);return ret};var readI53FromI64=ptr=>(growMemViews(),HEAPU32)[ptr/4]+(growMemViews(),HEAP32)[(ptr+4)/4]*4294967296;var WebGPU={Internals:{jsObjects:[],jsObjectInsert:(ptr,jsObject)=>{WebGPU.Internals.jsObjects[ptr]=jsObject},bufferOnUnmaps:[],futures:[],futureInsert:(futureId,promise)=>{WebGPU.Internals.futures[futureId]=new Promise(resolve=>promise.finally(()=>resolve(futureId)))}},getJsObject:ptr=>{if(!ptr)return undefined;return WebGPU.Internals.jsObjects[ptr]},importJsAdapter:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateAdapter(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsBindGroup:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateBindGroup(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsBindGroupLayout:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateBindGroupLayout(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsBuffer:(buffer,parentPtr=0)=>{assert(buffer.mapState==="unmapped");var bufferPtr=_emwgpuCreateBuffer(parentPtr);WebGPU.Internals.jsObjectInsert(bufferPtr,buffer);return bufferPtr},importJsCommandBuffer:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateCommandBuffer(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsCommandEncoder:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateCommandEncoder(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsComputePassEncoder:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateComputePassEncoder(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsComputePipeline:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateComputePipeline(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsDevice:(device,parentPtr=0)=>{var queuePtr=_emwgpuCreateQueue(parentPtr);var devicePtr=_emwgpuCreateDevice(parentPtr,queuePtr);WebGPU.Internals.jsObjectInsert(queuePtr,device.queue);WebGPU.Internals.jsObjectInsert(devicePtr,device);return devicePtr},importJsExternalTexture:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateExternalTexture(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsPipelineLayout:(obj,parentPtr=0)=>{var ptr=_emwgpuCreatePipelineLayout(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsQuerySet:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateQuerySet(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsQueue:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateQueue(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsRenderBundle:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateRenderBundle(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsRenderBundleEncoder:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateRenderBundleEncoder(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsRenderPassEncoder:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateRenderPassEncoder(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsRenderPipeline:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateRenderPipeline(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsSampler:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateSampler(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsShaderModule:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateShaderModule(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsSurface:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateSurface(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsTexture:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateTexture(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsTextureView:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateTextureView(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},errorCallback:(callback,type,message,userdata)=>{var sp=stackSave();var messagePtr=stringToUTF8OnStack(message);((a1,a2,a3)=>getWasmTableEntry(callback).call(null,a1,BigInt(a2),BigInt(a3)))(type,BigInt(messagePtr),userdata);stackRestore(sp)},iterateExtensions:(root,handlers)=>{for(var ptr=Number((growMemViews(),HEAPU64)[root/8]);ptr;ptr=Number((growMemViews(),HEAPU64)[ptr/8])){var sType=(growMemViews(),HEAP32)[(ptr+8)/4];var handler=handlers[sType](ptr)}},setStringView:(ptr,data,length)=>{(growMemViews(),HEAPU64)[ptr/8]=BigInt(data);(growMemViews(),HEAPU64)[(ptr+8)/8]=BigInt(length)},makeStringFromStringView:stringViewPtr=>{var ptr=Number((growMemViews(),HEAPU64)[stringViewPtr/8]);var length=Number((growMemViews(),HEAPU64)[(stringViewPtr+8)/8]);return UTF8ToString(ptr,length)},makeStringFromOptionalStringView:stringViewPtr=>{var ptr=Number((growMemViews(),HEAPU64)[stringViewPtr/8]);var length=Number((growMemViews(),HEAPU64)[(stringViewPtr+8)/8]);if(!ptr){if(length===0){return""}return undefined}return UTF8ToString(ptr,length)},makeColor:ptr=>({r:(growMemViews(),HEAPF64)[ptr/8],g:(growMemViews(),HEAPF64)[(ptr+8)/8],b:(growMemViews(),HEAPF64)[(ptr+16)/8],a:(growMemViews(),HEAPF64)[(ptr+24)/8]}),makeExtent3D:ptr=>({width:(growMemViews(),HEAPU32)[ptr/4],height:(growMemViews(),HEAPU32)[(ptr+4)/4],depthOrArrayLayers:(growMemViews(),HEAPU32)[(ptr+8)/4]}),makeOrigin3D:ptr=>({x:(growMemViews(),HEAPU32)[ptr/4],y:(growMemViews(),HEAPU32)[(ptr+4)/4],z:(growMemViews(),HEAPU32)[(ptr+8)/4]}),makeTexelCopyTextureInfo:ptr=>({texture:WebGPU.getJsObject(Number((growMemViews(),HEAPU64)[ptr/8])),mipLevel:(growMemViews(),HEAPU32)[(ptr+8)/4],origin:WebGPU.makeOrigin3D(ptr+12),aspect:WebGPU.TextureAspect[(growMemViews(),HEAP32)[(ptr+24)/4]]}),makeTexelCopyBufferLayout:ptr=>{var bytesPerRow=(growMemViews(),HEAPU32)[(ptr+8)/4];var rowsPerImage=(growMemViews(),HEAPU32)[(ptr+12)/4];return{offset:readI53FromI64(ptr),bytesPerRow:bytesPerRow===4294967295?undefined:bytesPerRow,rowsPerImage:rowsPerImage===4294967295?undefined:rowsPerImage}},makeTexelCopyBufferInfo:ptr=>{var layoutPtr=ptr+0;var bufferCopyView=WebGPU.makeTexelCopyBufferLayout(layoutPtr);bufferCopyView["buffer"]=WebGPU.getJsObject(Number((growMemViews(),HEAPU64)[(ptr+16)/8]));return bufferCopyView},makePassTimestampWrites:ptr=>{if(ptr===0)return undefined;return{querySet:WebGPU.getJsObject(Number((growMemViews(),HEAPU64)[(ptr+8)/8])),beginningOfPassWriteIndex:(growMemViews(),HEAPU32)[(ptr+16)/4],endOfPassWriteIndex:(growMemViews(),HEAPU32)[(ptr+20)/4]}},makePipelineConstants:(constantCount,constantsPtr)=>{if(!constantCount)return;var constants={};for(var i=0;i<constantCount;++i){var entryPtr=constantsPtr+32*i;var key=WebGPU.makeStringFromStringView(entryPtr+8);constants[key]=(growMemViews(),HEAPF64)[(entryPtr+24)/8]}return constants},makePipelineLayout:layoutPtr=>{if(!layoutPtr)return"auto";return WebGPU.getJsObject(layoutPtr)},makeComputeState:ptr=>{if(!ptr)return undefined;var desc={module:WebGPU.getJsObject(Number((growMemViews(),HEAPU64)[(ptr+8)/8])),constants:WebGPU.makePipelineConstants(Number((growMemViews(),HEAPU64)[(ptr+32)/8]),Number((growMemViews(),HEAPU64)[(ptr+40)/8])),entryPoint:WebGPU.makeStringFromOptionalStringView(ptr+16)};return desc},makeComputePipelineDesc:descriptor=>{var desc={label:WebGPU.makeStringFromOptionalStringView(descriptor+8),layout:WebGPU.makePipelineLayout(Number((growMemViews(),HEAPU64)[(descriptor+24)/8])),compute:WebGPU.makeComputeState(descriptor+32)};return desc},makeRenderPipelineDesc:descriptor=>{function makePrimitiveState(psPtr){if(!psPtr)return undefined;return{topology:WebGPU.PrimitiveTopology[(growMemViews(),HEAP32)[(psPtr+8)/4]],stripIndexFormat:WebGPU.IndexFormat[(growMemViews(),HEAP32)[(psPtr+12)/4]],frontFace:WebGPU.FrontFace[(growMemViews(),HEAP32)[(psPtr+16)/4]],cullMode:WebGPU.CullMode[(growMemViews(),HEAP32)[(psPtr+20)/4]],unclippedDepth:!!(growMemViews(),HEAPU32)[(psPtr+24)/4]}}function makeBlendComponent(bdPtr){if(!bdPtr)return undefined;return{operation:WebGPU.BlendOperation[(growMemViews(),HEAP32)[bdPtr/4]],srcFactor:WebGPU.BlendFactor[(growMemViews(),HEAP32)[(bdPtr+4)/4]],dstFactor:WebGPU.BlendFactor[(growMemViews(),HEAP32)[(bdPtr+8)/4]]}}function makeBlendState(bsPtr){if(!bsPtr)return undefined;return{alpha:makeBlendComponent(bsPtr+12),color:makeBlendComponent(bsPtr+0)}}function makeColorState(csPtr){var format=WebGPU.TextureFormat[(growMemViews(),HEAP32)[(csPtr+8)/4]];return format?{format,blend:makeBlendState(Number((growMemViews(),HEAPU64)[(csPtr+16)/8])),writeMask:(growMemViews(),HEAPU32)[(csPtr+24)/4]}:undefined}function makeColorStates(count,csArrayPtr){var states=[];for(var i=0;i<count;++i){states.push(makeColorState(csArrayPtr+32*i))}return states}function makeStencilStateFace(ssfPtr){return{compare:WebGPU.CompareFunction[(growMemViews(),HEAP32)[ssfPtr/4]],failOp:WebGPU.StencilOperation[(growMemViews(),HEAP32)[(ssfPtr+4)/4]],depthFailOp:WebGPU.StencilOperation[(growMemViews(),HEAP32)[(ssfPtr+8)/4]],passOp:WebGPU.StencilOperation[(growMemViews(),HEAP32)[(ssfPtr+12)/4]]}}function makeDepthStencilState(dssPtr){if(!dssPtr)return undefined;return{format:WebGPU.TextureFormat[(growMemViews(),HEAP32)[(dssPtr+8)/4]],depthWriteEnabled:!!(growMemViews(),HEAPU32)[(dssPtr+12)/4],depthCompare:WebGPU.CompareFunction[(growMemViews(),HEAP32)[(dssPtr+16)/4]],stencilFront:makeStencilStateFace(dssPtr+20),stencilBack:makeStencilStateFace(dssPtr+36),stencilReadMask:(growMemViews(),HEAPU32)[(dssPtr+52)/4],stencilWriteMask:(growMemViews(),HEAPU32)[(dssPtr+56)/4],depthBias:(growMemViews(),HEAP32)[(dssPtr+60)/4],depthBiasSlopeScale:(growMemViews(),HEAPF32)[(dssPtr+64)/4],depthBiasClamp:(growMemViews(),HEAPF32)[(dssPtr+68)/4]}}function makeVertexAttribute(vaPtr){return{format:WebGPU.VertexFormat[(growMemViews(),HEAP32)[(vaPtr+8)/4]],offset:readI53FromI64(vaPtr+16),shaderLocation:(growMemViews(),HEAPU32)[(vaPtr+24)/4]}}function makeVertexAttributes(count,vaArrayPtr){var vas=[];for(var i=0;i<count;++i){vas.push(makeVertexAttribute(vaArrayPtr+i*32))}return vas}function makeVertexBuffer(vbPtr){if(!vbPtr)return undefined;var stepMode=WebGPU.VertexStepMode[(growMemViews(),HEAP32)[(vbPtr+8)/4]];var attributeCount=Number((growMemViews(),HEAPU64)[(vbPtr+24)/8]);if(!stepMode&&!attributeCount){return null}return{arrayStride:readI53FromI64(vbPtr+16),stepMode,attributes:makeVertexAttributes(attributeCount,Number((growMemViews(),HEAPU64)[(vbPtr+32)/8]))}}function makeVertexBuffers(count,vbArrayPtr){if(!count)return undefined;var vbs=[];for(var i=0;i<count;++i){vbs.push(makeVertexBuffer(vbArrayPtr+i*40))}return vbs}function makeVertexState(viPtr){if(!viPtr)return undefined;var desc={module:WebGPU.getJsObject(Number((growMemViews(),HEAPU64)[(viPtr+8)/8])),constants:WebGPU.makePipelineConstants(Number((growMemViews(),HEAPU64)[(viPtr+32)/8]),Number((growMemViews(),HEAPU64)[(viPtr+40)/8])),buffers:makeVertexBuffers(Number((growMemViews(),HEAPU64)[(viPtr+48)/8]),Number((growMemViews(),HEAPU64)[(viPtr+56)/8])),entryPoint:WebGPU.makeStringFromOptionalStringView(viPtr+16)};return desc}function makeMultisampleState(msPtr){if(!msPtr)return undefined;return{count:(growMemViews(),HEAPU32)[(msPtr+8)/4],mask:(growMemViews(),HEAPU32)[(msPtr+12)/4],alphaToCoverageEnabled:!!(growMemViews(),HEAPU32)[(msPtr+16)/4]}}function makeFragmentState(fsPtr){if(!fsPtr)return undefined;var desc={module:WebGPU.getJsObject(Number((growMemViews(),HEAPU64)[(fsPtr+8)/8])),constants:WebGPU.makePipelineConstants(Number((growMemViews(),HEAPU64)[(fsPtr+32)/8]),Number((growMemViews(),HEAPU64)[(fsPtr+40)/8])),targets:makeColorStates(Number((growMemViews(),HEAPU64)[(fsPtr+48)/8]),Number((growMemViews(),HEAPU64)[(fsPtr+56)/8])),entryPoint:WebGPU.makeStringFromOptionalStringView(fsPtr+16)};return desc}var desc={label:WebGPU.makeStringFromOptionalStringView(descriptor+8),layout:WebGPU.makePipelineLayout(Number((growMemViews(),HEAPU64)[(descriptor+24)/8])),vertex:makeVertexState(descriptor+32),primitive:makePrimitiveState(descriptor+96),depthStencil:makeDepthStencilState(Number((growMemViews(),HEAPU64)[(descriptor+128)/8])),multisample:makeMultisampleState(descriptor+136),fragment:makeFragmentState(Number((growMemViews(),HEAPU64)[(descriptor+160)/8]))};return desc},fillLimitStruct:(limits,limitsOutPtr)=>{var nextInChainPtr=Number((growMemViews(),HEAPU64)[limitsOutPtr/8]);function setLimitValueU32(name,basePtr,limitOffset,fallbackValue=0){var limitValue=limits[name]??fallbackValue;(growMemViews(),HEAPU32)[(basePtr+limitOffset)/4]=limitValue}function setLimitValueU64(name,basePtr,limitOffset,fallbackValue=0){var limitValue=limits[name]??fallbackValue;writeI53ToI64(basePtr+limitOffset,limitValue)}setLimitValueU32("maxTextureDimension1D",limitsOutPtr,8);setLimitValueU32("maxTextureDimension2D",limitsOutPtr,12);setLimitValueU32("maxTextureDimension3D",limitsOutPtr,16);setLimitValueU32("maxTextureArrayLayers",limitsOutPtr,20);setLimitValueU32("maxBindGroups",limitsOutPtr,24);setLimitValueU32("maxBindGroupsPlusVertexBuffers",limitsOutPtr,28);setLimitValueU32("maxBindingsPerBindGroup",limitsOutPtr,32);setLimitValueU32("maxDynamicUniformBuffersPerPipelineLayout",limitsOutPtr,36);setLimitValueU32("maxDynamicStorageBuffersPerPipelineLayout",limitsOutPtr,40);setLimitValueU32("maxSampledTexturesPerShaderStage",limitsOutPtr,44);setLimitValueU32("maxSamplersPerShaderStage",limitsOutPtr,48);setLimitValueU32("maxStorageBuffersPerShaderStage",limitsOutPtr,52);setLimitValueU32("maxStorageTexturesPerShaderStage",limitsOutPtr,56);setLimitValueU32("maxUniformBuffersPerShaderStage",limitsOutPtr,60);setLimitValueU32("minUniformBufferOffsetAlignment",limitsOutPtr,80);setLimitValueU32("minStorageBufferOffsetAlignment",limitsOutPtr,84);setLimitValueU64("maxUniformBufferBindingSize",limitsOutPtr,64);setLimitValueU64("maxStorageBufferBindingSize",limitsOutPtr,72);setLimitValueU32("maxVertexBuffers",limitsOutPtr,88);setLimitValueU64("maxBufferSize",limitsOutPtr,96);setLimitValueU32("maxVertexAttributes",limitsOutPtr,104);setLimitValueU32("maxVertexBufferArrayStride",limitsOutPtr,108);setLimitValueU32("maxInterStageShaderVariables",limitsOutPtr,112);setLimitValueU32("maxColorAttachments",limitsOutPtr,116);setLimitValueU32("maxColorAttachmentBytesPerSample",limitsOutPtr,120);setLimitValueU32("maxComputeWorkgroupStorageSize",limitsOutPtr,124);setLimitValueU32("maxComputeInvocationsPerWorkgroup",limitsOutPtr,128);setLimitValueU32("maxComputeWorkgroupSizeX",limitsOutPtr,132);setLimitValueU32("maxComputeWorkgroupSizeY",limitsOutPtr,136);setLimitValueU32("maxComputeWorkgroupSizeZ",limitsOutPtr,140);setLimitValueU32("maxComputeWorkgroupsPerDimension",limitsOutPtr,144);setLimitValueU32("maxImmediateSize",limitsOutPtr,148);if(nextInChainPtr!==0){var sType=(growMemViews(),HEAP32)[(nextInChainPtr+8)/4];var compatibilityModeLimitsPtr=nextInChainPtr;setLimitValueU32("maxStorageBuffersInVertexStage",compatibilityModeLimitsPtr,16,limits.maxStorageBuffersPerShaderStage);setLimitValueU32("maxStorageBuffersInFragmentStage",compatibilityModeLimitsPtr,24,limits.maxStorageBuffersPerShaderStage);setLimitValueU32("maxStorageTexturesInVertexStage",compatibilityModeLimitsPtr,20,limits.maxStorageTexturesPerShaderStage);setLimitValueU32("maxStorageTexturesInFragmentStage",compatibilityModeLimitsPtr,28,limits.maxStorageTexturesPerShaderStage)}},fillAdapterInfoStruct:(info,infoStruct)=>{(growMemViews(),HEAPU32)[(infoStruct+88)/4]=info.subgroupMinSize;(growMemViews(),HEAPU32)[(infoStruct+92)/4]=info.subgroupMaxSize;var strs=info.vendor+info.architecture+info.device+info.description;var strPtr=stringToNewUTF8(strs);var vendorLen=lengthBytesUTF8(info.vendor);WebGPU.setStringView(infoStruct+8,strPtr,vendorLen);strPtr+=vendorLen;var architectureLen=lengthBytesUTF8(info.architecture);WebGPU.setStringView(infoStruct+24,strPtr,architectureLen);strPtr+=architectureLen;var deviceLen=lengthBytesUTF8(info.device);WebGPU.setStringView(infoStruct+40,strPtr,deviceLen);strPtr+=deviceLen;var descriptionLen=lengthBytesUTF8(info.description);WebGPU.setStringView(infoStruct+56,strPtr,descriptionLen);strPtr+=descriptionLen;(growMemViews(),HEAP32)[(infoStruct+72)/4]=2;var adapterType=info.isFallbackAdapter?3:4;(growMemViews(),HEAP32)[(infoStruct+76)/4]=adapterType;(growMemViews(),HEAPU32)[(infoStruct+80)/4]=0;(growMemViews(),HEAPU32)[(infoStruct+84)/4]=0},AddressMode:[,"clamp-to-edge","repeat","mirror-repeat"],BlendFactor:[,"zero","one","src","one-minus-src","src-alpha","one-minus-src-alpha","dst","one-minus-dst","dst-alpha","one-minus-dst-alpha","src-alpha-saturated","constant","one-minus-constant","src1","one-minus-src1","src1-alpha","one-minus-src1-alpha"],BlendOperation:[,"add","subtract","reverse-subtract","min","max"],BufferBindingType:[,,"uniform","storage","read-only-storage"],BufferMapState:[,"unmapped","pending","mapped"],CompareFunction:[,"never","less","equal","less-equal","greater","not-equal","greater-equal","always"],CompilationInfoRequestStatus:[,"success","callback-cancelled"],ComponentSwizzle:[,"0","1","r","g","b","a"],CompositeAlphaMode:[,"opaque","premultiplied","unpremultiplied","inherit"],CullMode:[,"none","front","back"],ErrorFilter:[,"validation","out-of-memory","internal"],FeatureLevel:[,"compatibility","core"],FeatureName:{1:"core-features-and-limits",2:"depth-clip-control",3:"depth32float-stencil8",4:"texture-compression-bc",5:"texture-compression-bc-sliced-3d",6:"texture-compression-etc2",7:"texture-compression-astc",8:"texture-compression-astc-sliced-3d",9:"timestamp-query",10:"indirect-first-instance",11:"shader-f16",12:"rg11b10ufloat-renderable",13:"bgra8unorm-storage",14:"float32-filterable",15:"float32-blendable",16:"clip-distances",17:"dual-source-blending",18:"subgroups",19:"texture-formats-tier1",20:"texture-formats-tier2",21:"primitive-index",22:"texture-component-swizzle",327692:"chromium-experimental-unorm16-texture-formats",327729:"chromium-experimental-multi-draw-indirect"},FilterMode:[,"nearest","linear"],FrontFace:[,"ccw","cw"],IndexFormat:[,"uint16","uint32"],InstanceFeatureName:[,"timed-wait-any","shader-source-spirv","multiple-devices-per-adapter"],LoadOp:[,"load","clear"],MipmapFilterMode:[,"nearest","linear"],OptionalBool:["false","true"],PowerPreference:[,"low-power","high-performance"],PredefinedColorSpace:[,"srgb","display-p3"],PrimitiveTopology:[,"point-list","line-list","line-strip","triangle-list","triangle-strip"],QueryType:[,"occlusion","timestamp"],SamplerBindingType:[,,"filtering","non-filtering","comparison"],Status:[,"success","error"],StencilOperation:[,"keep","zero","replace","invert","increment-clamp","decrement-clamp","increment-wrap","decrement-wrap"],StorageTextureAccess:[,,"write-only","read-only","read-write"],StoreOp:[,"store","discard"],SurfaceGetCurrentTextureStatus:[,"success-optimal","success-suboptimal","timeout","outdated","lost","error"],TextureAspect:[,"all","stencil-only","depth-only"],TextureDimension:[,"1d","2d","3d"],TextureFormat:[,"r8unorm","r8snorm","r8uint","r8sint","r16unorm","r16snorm","r16uint","r16sint","r16float","rg8unorm","rg8snorm","rg8uint","rg8sint","r32float","r32uint","r32sint","rg16unorm","rg16snorm","rg16uint","rg16sint","rg16float","rgba8unorm","rgba8unorm-srgb","rgba8snorm","rgba8uint","rgba8sint","bgra8unorm","bgra8unorm-srgb","rgb10a2uint","rgb10a2unorm","rg11b10ufloat","rgb9e5ufloat","rg32float","rg32uint","rg32sint","rgba16unorm","rgba16snorm","rgba16uint","rgba16sint","rgba16float","rgba32float","rgba32uint","rgba32sint","stencil8","depth16unorm","depth24plus","depth24plus-stencil8","depth32float","depth32float-stencil8","bc1-rgba-unorm","bc1-rgba-unorm-srgb","bc2-rgba-unorm","bc2-rgba-unorm-srgb","bc3-rgba-unorm","bc3-rgba-unorm-srgb","bc4-r-unorm","bc4-r-snorm","bc5-rg-unorm","bc5-rg-snorm","bc6h-rgb-ufloat","bc6h-rgb-float","bc7-rgba-unorm","bc7-rgba-unorm-srgb","etc2-rgb8unorm","etc2-rgb8unorm-srgb","etc2-rgb8a1unorm","etc2-rgb8a1unorm-srgb","etc2-rgba8unorm","etc2-rgba8unorm-srgb","eac-r11unorm","eac-r11snorm","eac-rg11unorm","eac-rg11snorm","astc-4x4-unorm","astc-4x4-unorm-srgb","astc-5x4-unorm","astc-5x4-unorm-srgb","astc-5x5-unorm","astc-5x5-unorm-srgb","astc-6x5-unorm","astc-6x5-unorm-srgb","astc-6x6-unorm","astc-6x6-unorm-srgb","astc-8x5-unorm","astc-8x5-unorm-srgb","astc-8x6-unorm","astc-8x6-unorm-srgb","astc-8x8-unorm","astc-8x8-unorm-srgb","astc-10x5-unorm","astc-10x5-unorm-srgb","astc-10x6-unorm","astc-10x6-unorm-srgb","astc-10x8-unorm","astc-10x8-unorm-srgb","astc-10x10-unorm","astc-10x10-unorm-srgb","astc-12x10-unorm","astc-12x10-unorm-srgb","astc-12x12-unorm","astc-12x12-unorm-srgb"],TextureSampleType:[,,"float","unfilterable-float","depth","sint","uint"],TextureViewDimension:[,"1d","2d","2d-array","cube","cube-array","3d"],ToneMappingMode:[,"standard","extended"],VertexFormat:[,"uint8","uint8x2","uint8x4","sint8","sint8x2","sint8x4","unorm8","unorm8x2","unorm8x4","snorm8","snorm8x2","snorm8x4","uint16","uint16x2","uint16x4","sint16","sint16x2","sint16x4","unorm16","unorm16x2","unorm16x4","snorm16","snorm16x2","snorm16x4","float16","float16x2","float16x4","float32","float32x2","float32x3","float32x4","uint32","uint32x2","uint32x3","uint32x4","sint32","sint32x2","sint32x3","sint32x4","unorm10-10-10-2","unorm8x4-bgra"],VertexStepMode:[,"vertex","instance"],WGSLLanguageFeatureName:[,"readonly_and_readwrite_storage_textures","packed_4x8_integer_dot_product","unrestricted_pointer_parameters","pointer_composite_access","uniform_buffer_standard_layout","subgroup_id","texture_and_sampler_let","subgroup_uniformity","texture_formats_tier1"]};var emwgpuStringToInt_DeviceLostReason={undefined:1,unknown:1,destroyed:2};var runtimeKeepalivePop=()=>{runtimeKeepaliveCounter-=1};function _emwgpuAdapterRequestDevice(adapterPtr,futureId,deviceLostFutureId,devicePtr,queuePtr,descriptor){adapterPtr=bigintToI53Checked(adapterPtr);futureId=bigintToI53Checked(futureId);deviceLostFutureId=bigintToI53Checked(deviceLostFutureId);devicePtr=bigintToI53Checked(devicePtr);queuePtr=bigintToI53Checked(queuePtr);descriptor=bigintToI53Checked(descriptor);var adapter=WebGPU.getJsObject(adapterPtr);var desc={};if(descriptor){var requiredFeatureCount=Number((growMemViews(),HEAPU64)[(descriptor+24)/8]);if(requiredFeatureCount){var requiredFeaturesPtr=Number((growMemViews(),HEAPU64)[(descriptor+32)/8]);desc["requiredFeatures"]=Array.from((growMemViews(),HEAPU32).subarray(requiredFeaturesPtr/4,(requiredFeaturesPtr+requiredFeatureCount*4)/4),feature=>WebGPU.FeatureName[feature])}var limitsPtr=Number((growMemViews(),HEAPU64)[(descriptor+40)/8]);if(limitsPtr){var nextInChainPtr=Number((growMemViews(),HEAPU64)[limitsPtr/8]);var requiredLimits={};function setLimitU32IfDefined(name,basePtr,limitOffset,ignoreIfZero=false){var ptr=basePtr+limitOffset;var value=(growMemViews(),HEAPU32)[ptr/4];if(value!=4294967295&&(!ignoreIfZero||value!=0)){requiredLimits[name]=value}}function setLimitU64IfDefined(name,basePtr,limitOffset){var ptr=basePtr+limitOffset;var limitPart1=(growMemViews(),HEAPU32)[ptr/4];var limitPart2=(growMemViews(),HEAPU32)[(ptr+4)/4];if(limitPart1!=4294967295||limitPart2!=4294967295){requiredLimits[name]=readI53FromI64(ptr)}}setLimitU32IfDefined("maxTextureDimension1D",limitsPtr,8);setLimitU32IfDefined("maxTextureDimension2D",limitsPtr,12);setLimitU32IfDefined("maxTextureDimension3D",limitsPtr,16);setLimitU32IfDefined("maxTextureArrayLayers",limitsPtr,20);setLimitU32IfDefined("maxBindGroups",limitsPtr,24);setLimitU32IfDefined("maxBindGroupsPlusVertexBuffers",limitsPtr,28);setLimitU32IfDefined("maxBindingsPerBindGroup",limitsPtr,32);setLimitU32IfDefined("maxDynamicUniformBuffersPerPipelineLayout",limitsPtr,36);setLimitU32IfDefined("maxDynamicStorageBuffersPerPipelineLayout",limitsPtr,40);setLimitU32IfDefined("maxSampledTexturesPerShaderStage",limitsPtr,44);setLimitU32IfDefined("maxSamplersPerShaderStage",limitsPtr,48);setLimitU32IfDefined("maxStorageBuffersPerShaderStage",limitsPtr,52);setLimitU32IfDefined("maxStorageTexturesPerShaderStage",limitsPtr,56);setLimitU32IfDefined("maxUniformBuffersPerShaderStage",limitsPtr,60);setLimitU32IfDefined("minUniformBufferOffsetAlignment",limitsPtr,80);setLimitU32IfDefined("minStorageBufferOffsetAlignment",limitsPtr,84);setLimitU64IfDefined("maxUniformBufferBindingSize",limitsPtr,64);setLimitU64IfDefined("maxStorageBufferBindingSize",limitsPtr,72);setLimitU32IfDefined("maxVertexBuffers",limitsPtr,88);setLimitU64IfDefined("maxBufferSize",limitsPtr,96);setLimitU32IfDefined("maxVertexAttributes",limitsPtr,104);setLimitU32IfDefined("maxVertexBufferArrayStride",limitsPtr,108);setLimitU32IfDefined("maxInterStageShaderVariables",limitsPtr,112);setLimitU32IfDefined("maxColorAttachments",limitsPtr,116);setLimitU32IfDefined("maxColorAttachmentBytesPerSample",limitsPtr,120);setLimitU32IfDefined("maxComputeWorkgroupStorageSize",limitsPtr,124);setLimitU32IfDefined("maxComputeInvocationsPerWorkgroup",limitsPtr,128);setLimitU32IfDefined("maxComputeWorkgroupSizeX",limitsPtr,132);setLimitU32IfDefined("maxComputeWorkgroupSizeY",limitsPtr,136);setLimitU32IfDefined("maxComputeWorkgroupSizeZ",limitsPtr,140);setLimitU32IfDefined("maxComputeWorkgroupsPerDimension",limitsPtr,144);setLimitU32IfDefined("maxImmediateSize",limitsPtr,148,true);if(nextInChainPtr!==0){var sType=(growMemViews(),HEAP32)[(nextInChainPtr+8)/4];var compatibilityModeLimitsPtr=nextInChainPtr;if("maxStorageBuffersInVertexStage"in GPUSupportedLimits.prototype){setLimitU32IfDefined("maxStorageBuffersInVertexStage",compatibilityModeLimitsPtr,16);setLimitU32IfDefined("maxStorageTexturesInVertexStage",compatibilityModeLimitsPtr,20);setLimitU32IfDefined("maxStorageBuffersInFragmentStage",compatibilityModeLimitsPtr,24);setLimitU32IfDefined("maxStorageTexturesInFragmentStage",compatibilityModeLimitsPtr,28)}}desc["requiredLimits"]=requiredLimits}var defaultQueuePtr=Number((growMemViews(),HEAPU64)[(descriptor+48)/8]);if(defaultQueuePtr){var defaultQueueDesc={label:WebGPU.makeStringFromOptionalStringView(defaultQueuePtr+8)};desc["defaultQueue"]=defaultQueueDesc}desc["label"]=WebGPU.makeStringFromOptionalStringView(descriptor+8)}runtimeKeepalivePush();WebGPU.Internals.futureInsert(futureId,adapter.requestDevice(desc).then(device=>{runtimeKeepalivePop();callUserCallback(()=>{WebGPU.Internals.jsObjectInsert(queuePtr,device.queue);WebGPU.Internals.jsObjectInsert(devicePtr,device);devicePtr=BigInt(devicePtr);WebGPU.Internals.futureInsert(deviceLostFutureId,device.lost.then(info=>{callUserCallback(()=>{device.onuncapturederror=ev=>{};var sp=stackSave();var messagePtr=stringToUTF8OnStack(info.message);_emwgpuOnDeviceLostCompleted(deviceLostFutureId,emwgpuStringToInt_DeviceLostReason[info.reason],BigInt(messagePtr));stackRestore(sp)})}));device.onuncapturederror=ev=>{var type=5;if(ev.error instanceof GPUValidationError)type=2;else if(ev.error instanceof GPUOutOfMemoryError)type=3;else if(ev.error instanceof GPUInternalError)type=4;var sp=stackSave();var messagePtr=stringToUTF8OnStack(ev.error.message);_emwgpuOnUncapturedError(BigInt(devicePtr),type,BigInt(messagePtr));stackRestore(sp)};_emwgpuOnRequestDeviceCompleted(futureId,1,BigInt(devicePtr),0n)})},ex=>{runtimeKeepalivePop();callUserCallback(()=>{var sp=stackSave();var messagePtr=stringToUTF8OnStack(ex.message);_emwgpuOnRequestDeviceCompleted(futureId,3,BigInt(devicePtr),BigInt(messagePtr));if(deviceLostFutureId){_emwgpuOnDeviceLostCompleted(deviceLostFutureId,4,BigInt(messagePtr))}stackRestore(sp)})}))}function _emwgpuBufferDestroy(bufferPtr){bufferPtr=bigintToI53Checked(bufferPtr);var buffer=WebGPU.getJsObject(bufferPtr);var onUnmap=WebGPU.Internals.bufferOnUnmaps[bufferPtr];if(onUnmap){for(var i=0;i<onUnmap.length;++i){onUnmap[i]()}delete WebGPU.Internals.bufferOnUnmaps[bufferPtr]}buffer.destroy()}var warnOnce=text=>{warnOnce.shown||={};if(!warnOnce.shown[text]){warnOnce.shown[text]=1;if(ENVIRONMENT_IS_NODE)text="warning: "+text;err(text)}};var _emwgpuBufferGetConstMappedRange=function(bufferPtr,offset,size){bufferPtr=bigintToI53Checked(bufferPtr);offset=bigintToI53Checked(offset);size=bigintToI53Checked(size);var ret=(()=>{var buffer=WebGPU.getJsObject(bufferPtr);if(size==-1)size=undefined;var mapped;try{mapped=buffer.getMappedRange(offset,size)}catch(ex){return 0n}var data=_memalign(16,mapped.byteLength);(growMemViews(),HEAPU8).set(new Uint8Array(mapped),data);WebGPU.Internals.bufferOnUnmaps[bufferPtr].push(()=>_free(data));return data})();return BigInt(ret)};var _emwgpuBufferMapAsync=function(bufferPtr,futureId,mode,offset,size){bufferPtr=bigintToI53Checked(bufferPtr);futureId=bigintToI53Checked(futureId);mode=bigintToI53Checked(mode);offset=bigintToI53Checked(offset);size=bigintToI53Checked(size);var buffer=WebGPU.getJsObject(bufferPtr);WebGPU.Internals.bufferOnUnmaps[bufferPtr]=[];if(size==-1)size=undefined;runtimeKeepalivePush();WebGPU.Internals.futureInsert(futureId,buffer.mapAsync(mode,offset,size).then(()=>{runtimeKeepalivePop();callUserCallback(()=>{_emwgpuOnMapAsyncCompleted(futureId,1,0n)})},ex=>{runtimeKeepalivePop();callUserCallback(()=>{var sp=stackSave();var messagePtr=stringToUTF8OnStack(ex.message);var status=ex.name==="AbortError"?4:ex.name==="OperationError"?3:0;_emwgpuOnMapAsyncCompleted(futureId,status,BigInt(messagePtr));delete WebGPU.Internals.bufferOnUnmaps[bufferPtr]})}))};function _emwgpuBufferUnmap(bufferPtr){bufferPtr=bigintToI53Checked(bufferPtr);var buffer=WebGPU.getJsObject(bufferPtr);var onUnmap=WebGPU.Internals.bufferOnUnmaps[bufferPtr];if(!onUnmap){return}for(var i=0;i<onUnmap.length;++i){onUnmap[i]()}delete WebGPU.Internals.bufferOnUnmaps[bufferPtr];buffer.unmap()}function _emwgpuDelete(ptr){ptr=bigintToI53Checked(ptr);delete WebGPU.Internals.jsObjects[ptr]}function _emwgpuDeviceCreateBuffer(devicePtr,descriptor,bufferPtr){devicePtr=bigintToI53Checked(devicePtr);descriptor=bigintToI53Checked(descriptor);bufferPtr=bigintToI53Checked(bufferPtr);var mappedAtCreation=!!(growMemViews(),HEAPU32)[(descriptor+40)/4];var desc={label:WebGPU.makeStringFromOptionalStringView(descriptor+8),usage:(growMemViews(),HEAPU32)[(descriptor+24)/4],size:readI53FromI64(descriptor+32),mappedAtCreation};var device=WebGPU.getJsObject(devicePtr);var buffer;try{buffer=device.createBuffer(desc)}catch(ex){return false}WebGPU.Internals.jsObjectInsert(bufferPtr,buffer);if(mappedAtCreation){WebGPU.Internals.bufferOnUnmaps[bufferPtr]=[]}return true}function _emwgpuDeviceCreateShaderModule(devicePtr,descriptor,shaderModulePtr){devicePtr=bigintToI53Checked(devicePtr);descriptor=bigintToI53Checked(descriptor);shaderModulePtr=bigintToI53Checked(shaderModulePtr);var nextInChainPtr=Number((growMemViews(),HEAPU64)[descriptor/8]);var sType=(growMemViews(),HEAP32)[(nextInChainPtr+8)/4];var desc={label:WebGPU.makeStringFromOptionalStringView(descriptor+8),code:""};switch(sType){case 2:{desc["code"]=WebGPU.makeStringFromStringView(nextInChainPtr+16);break}}var device=WebGPU.getJsObject(devicePtr);WebGPU.Internals.jsObjectInsert(shaderModulePtr,device.createShaderModule(desc))}var _emwgpuDeviceDestroy=devicePtr=>{const device=WebGPU.getJsObject(devicePtr);device.onuncapturederror=null;device.destroy()};function _emwgpuInstanceRequestAdapter(instancePtr,futureId,options,adapterPtr){instancePtr=bigintToI53Checked(instancePtr);futureId=bigintToI53Checked(futureId);options=bigintToI53Checked(options);adapterPtr=bigintToI53Checked(adapterPtr);var opts;if(options){opts={featureLevel:WebGPU.FeatureLevel[(growMemViews(),HEAP32)[(options+8)/4]],powerPreference:WebGPU.PowerPreference[(growMemViews(),HEAP32)[(options+12)/4]],forceFallbackAdapter:!!(growMemViews(),HEAPU32)[(options+16)/4]};var nextInChainPtr=Number((growMemViews(),HEAPU64)[options/8]);if(nextInChainPtr!==0){var sType=(growMemViews(),HEAP32)[(nextInChainPtr+8)/4];var webxrOptions=nextInChainPtr;opts.xrCompatible=!!(growMemViews(),HEAPU32)[(webxrOptions+16)/4]}}if(!("gpu"in navigator)){var sp=stackSave();var messagePtr=stringToUTF8OnStack("WebGPU not available on this browser (navigator.gpu is not available)");_emwgpuOnRequestAdapterCompleted(futureId,3,BigInt(adapterPtr),BigInt(messagePtr));stackRestore(sp);return}runtimeKeepalivePush();WebGPU.Internals.futureInsert(futureId,navigator.gpu.requestAdapter(opts).then(adapter=>{runtimeKeepalivePop();callUserCallback(()=>{if(adapter){WebGPU.Internals.jsObjectInsert(adapterPtr,adapter);_emwgpuOnRequestAdapterCompleted(futureId,1,BigInt(adapterPtr),0n)}else{var sp=stackSave();var messagePtr=stringToUTF8OnStack("WebGPU not available on this browser (requestAdapter returned null)");_emwgpuOnRequestAdapterCompleted(futureId,3,BigInt(adapterPtr),BigInt(messagePtr));stackRestore(sp)}})},ex=>{runtimeKeepalivePop();callUserCallback(()=>{var sp=stackSave();var messagePtr=stringToUTF8OnStack(ex.message);_emwgpuOnRequestAdapterCompleted(futureId,4,BigInt(adapterPtr),BigInt(messagePtr));stackRestore(sp)})}))}var _emwgpuQueueOnSubmittedWorkDone=function(queuePtr,futureId){queuePtr=bigintToI53Checked(queuePtr);futureId=bigintToI53Checked(futureId);var queue=WebGPU.getJsObject(queuePtr);runtimeKeepalivePush();WebGPU.Internals.futureInsert(futureId,queue.onSubmittedWorkDone().then(()=>{runtimeKeepalivePop();callUserCallback(()=>{_emwgpuOnWorkDoneCompleted(futureId,1)})}))};var _emwgpuWaitAny=function(futurePtr,futureCount,timeoutMSPtr){futurePtr=bigintToI53Checked(futurePtr);futureCount=bigintToI53Checked(futureCount);timeoutMSPtr=bigintToI53Checked(timeoutMSPtr);return Asyncify.handleAsync(async()=>{var promises=[];if(timeoutMSPtr){var timeoutMS=(growMemViews(),HEAP32)[timeoutMSPtr/4];promises.length=futureCount+1;promises[futureCount]=new Promise(resolve=>setTimeout(resolve,timeoutMS,0))}else{promises.length=futureCount}for(var i=0;i<futureCount;++i){var futureId=readI53FromI64(futurePtr+i*8);if(!(futureId in WebGPU.Internals.futures)){return futureId}promises[i]=WebGPU.Internals.futures[futureId]}const firstResolvedFuture=await Promise.race(promises);delete WebGPU.Internals.futures[firstResolvedFuture];return firstResolvedFuture})};_emwgpuWaitAny.isAsync=true;var ENV={};var getExecutableName=()=>thisProgram||"./this.program";var getEnvStrings=()=>{if(!getEnvStrings.strings){var lang=(typeof navigator=="object"&&navigator.language||"C").replace("-","_")+".UTF-8";var env={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:lang,_:getExecutableName()};for(var x in ENV){if(ENV[x]===undefined)delete env[x];else env[x]=ENV[x]}var strings=[];for(var x in env){strings.push(`${x}=${env[x]}`)}getEnvStrings.strings=strings}return getEnvStrings.strings};function _environ_get(__environ,environ_buf){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(14,0,1,__environ,environ_buf);__environ=bigintToI53Checked(__environ);environ_buf=bigintToI53Checked(environ_buf);var bufSize=0;var envp=0;for(var string of getEnvStrings()){var ptr=environ_buf+bufSize;(growMemViews(),HEAPU64)[(__environ+envp)/8]=BigInt(ptr);bufSize+=stringToUTF8(string,ptr,Infinity)+1;envp+=8}return 0}function _environ_sizes_get(penviron_count,penviron_buf_size){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(15,0,1,penviron_count,penviron_buf_size);penviron_count=bigintToI53Checked(penviron_count);penviron_buf_size=bigintToI53Checked(penviron_buf_size);var strings=getEnvStrings();(growMemViews(),HEAPU64)[penviron_count/8]=BigInt(strings.length);var bufSize=0;for(var string of strings){bufSize+=lengthBytesUTF8(string)+1}(growMemViews(),HEAPU64)[penviron_buf_size/8]=BigInt(bufSize);return 0}function _fd_close(fd){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(16,0,1,fd);try{var stream=SYSCALLS.getStreamFromFD(fd);FS.close(stream);return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return e.errno}}var doReadv=(stream,iov,iovcnt,offset)=>{var ret=0;for(var i=0;i<iovcnt;i++){var ptr=Number((growMemViews(),HEAPU64)[iov/8]);var len=Number((growMemViews(),HEAPU64)[(iov+8)/8]);iov+=16;var curr=FS.read(stream,(growMemViews(),HEAP8),ptr,len,offset);if(curr<0)return-1;ret+=curr;if(curr<len)break;if(typeof offset!="undefined"){offset+=curr}}return ret};function _fd_read(fd,iov,iovcnt,pnum){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(17,0,1,fd,iov,iovcnt,pnum);iov=bigintToI53Checked(iov);iovcnt=bigintToI53Checked(iovcnt);pnum=bigintToI53Checked(pnum);try{var stream=SYSCALLS.getStreamFromFD(fd);var num=doReadv(stream,iov,iovcnt);(growMemViews(),HEAPU64)[pnum/8]=BigInt(num);return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return e.errno}}function _fd_seek(fd,offset,whence,newOffset){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(18,0,1,fd,offset,whence,newOffset);offset=bigintToI53Checked(offset);newOffset=bigintToI53Checked(newOffset);try{if(isNaN(offset))return 61;var stream=SYSCALLS.getStreamFromFD(fd);FS.llseek(stream,offset,whence);(growMemViews(),HEAP64)[newOffset/8]=BigInt(stream.position);if(stream.getdents&&offset===0&&whence===0)stream.getdents=null;return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return e.errno}}var doWritev=(stream,iov,iovcnt,offset)=>{var ret=0;for(var i=0;i<iovcnt;i++){var ptr=Number((growMemViews(),HEAPU64)[iov/8]);var len=Number((growMemViews(),HEAPU64)[(iov+8)/8]);iov+=16;var curr=FS.write(stream,(growMemViews(),HEAP8),ptr,len,offset);if(curr<0)return-1;ret+=curr;if(curr<len){break}if(typeof offset!="undefined"){offset+=curr}}return ret};function _fd_write(fd,iov,iovcnt,pnum){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(19,0,1,fd,iov,iovcnt,pnum);iov=bigintToI53Checked(iov);iovcnt=bigintToI53Checked(iovcnt);pnum=bigintToI53Checked(pnum);try{var stream=SYSCALLS.getStreamFromFD(fd);var num=doWritev(stream,iov,iovcnt);(growMemViews(),HEAPU64)[pnum/8]=BigInt(num);return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return e.errno}}function _random_get(buffer,size){buffer=bigintToI53Checked(buffer);size=bigintToI53Checked(size);try{randomFill((growMemViews(),HEAPU8).subarray(buffer,buffer+size));return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return e.errno}}function _wgpuAdapterGetInfo(adapterPtr,info){adapterPtr=bigintToI53Checked(adapterPtr);info=bigintToI53Checked(info);var adapter=WebGPU.getJsObject(adapterPtr);WebGPU.fillAdapterInfoStruct(adapter.info,info);return 1}function _wgpuAdapterGetLimits(adapterPtr,limitsOutPtr){adapterPtr=bigintToI53Checked(adapterPtr);limitsOutPtr=bigintToI53Checked(limitsOutPtr);var adapter=WebGPU.getJsObject(adapterPtr);WebGPU.fillLimitStruct(adapter.limits,limitsOutPtr);return 1}function _wgpuAdapterHasFeature(adapterPtr,featureEnumValue){adapterPtr=bigintToI53Checked(adapterPtr);var adapter=WebGPU.getJsObject(adapterPtr);return adapter.features.has(WebGPU.FeatureName[featureEnumValue])}var _wgpuBufferGetSize=function(bufferPtr){bufferPtr=bigintToI53Checked(bufferPtr);var ret=(()=>{var buffer=WebGPU.getJsObject(bufferPtr);return buffer.size})();return BigInt(ret)};var _wgpuCommandEncoderBeginComputePass=function(encoderPtr,descriptor){encoderPtr=bigintToI53Checked(encoderPtr);descriptor=bigintToI53Checked(descriptor);var ret=(()=>{var desc;if(descriptor){desc={label:WebGPU.makeStringFromOptionalStringView(descriptor+8),timestampWrites:WebGPU.makePassTimestampWrites(Number((growMemViews(),HEAPU64)[(descriptor+24)/8]))}}var commandEncoder=WebGPU.getJsObject(encoderPtr);var ptr=_emwgpuCreateComputePassEncoder(0n);WebGPU.Internals.jsObjectInsert(ptr,commandEncoder.beginComputePass(desc));return ptr})();return BigInt(ret)};function _wgpuCommandEncoderCopyBufferToBuffer(encoderPtr,srcPtr,srcOffset,dstPtr,dstOffset,size){encoderPtr=bigintToI53Checked(encoderPtr);srcPtr=bigintToI53Checked(srcPtr);srcOffset=bigintToI53Checked(srcOffset);dstPtr=bigintToI53Checked(dstPtr);dstOffset=bigintToI53Checked(dstOffset);size=bigintToI53Checked(size);var commandEncoder=WebGPU.getJsObject(encoderPtr);var src=WebGPU.getJsObject(srcPtr);var dst=WebGPU.getJsObject(dstPtr);commandEncoder.copyBufferToBuffer(src,srcOffset,dst,dstOffset,size)}var _wgpuCommandEncoderFinish=function(encoderPtr,descriptor){encoderPtr=bigintToI53Checked(encoderPtr);descriptor=bigintToI53Checked(descriptor);var ret=(()=>{var commandEncoder=WebGPU.getJsObject(encoderPtr);var ptr=_emwgpuCreateCommandBuffer(0n);WebGPU.Internals.jsObjectInsert(ptr,commandEncoder.finish());return ptr})();return BigInt(ret)};function _wgpuComputePassEncoderDispatchWorkgroups(passPtr,x,y,z){passPtr=bigintToI53Checked(passPtr);var pass=WebGPU.getJsObject(passPtr);pass.dispatchWorkgroups(x,y,z)}function _wgpuComputePassEncoderEnd(passPtr){passPtr=bigintToI53Checked(passPtr);var pass=WebGPU.getJsObject(passPtr);pass.end()}function _wgpuComputePassEncoderSetBindGroup(passPtr,groupIndex,groupPtr,dynamicOffsetCount,dynamicOffsetsPtr){passPtr=bigintToI53Checked(passPtr);groupPtr=bigintToI53Checked(groupPtr);dynamicOffsetCount=bigintToI53Checked(dynamicOffsetCount);dynamicOffsetsPtr=bigintToI53Checked(dynamicOffsetsPtr);var pass=WebGPU.getJsObject(passPtr);var group=WebGPU.getJsObject(groupPtr);if(dynamicOffsetCount==0){pass.setBindGroup(groupIndex,group)}else{pass.setBindGroup(groupIndex,group,(growMemViews(),HEAPU32),dynamicOffsetsPtr/4,dynamicOffsetCount)}}function _wgpuComputePassEncoderSetPipeline(passPtr,pipelinePtr){passPtr=bigintToI53Checked(passPtr);pipelinePtr=bigintToI53Checked(pipelinePtr);var pass=WebGPU.getJsObject(passPtr);var pipeline=WebGPU.getJsObject(pipelinePtr);pass.setPipeline(pipeline)}var _wgpuComputePipelineGetBindGroupLayout=function(pipelinePtr,groupIndex){pipelinePtr=bigintToI53Checked(pipelinePtr);var ret=(()=>{var pipeline=WebGPU.getJsObject(pipelinePtr);var ptr=_emwgpuCreateBindGroupLayout(0n);WebGPU.Internals.jsObjectInsert(ptr,pipeline.getBindGroupLayout(groupIndex));return ptr})();return BigInt(ret)};var _wgpuDeviceCreateBindGroup=function(devicePtr,descriptor){devicePtr=bigintToI53Checked(devicePtr);descriptor=bigintToI53Checked(descriptor);var ret=(()=>{function makeEntry(entryPtr){var bufferPtr=Number((growMemViews(),HEAPU64)[(entryPtr+16)/8]);var samplerPtr=Number((growMemViews(),HEAPU64)[(entryPtr+40)/8]);var textureViewPtr=Number((growMemViews(),HEAPU64)[(entryPtr+48)/8]);var externalTexturePtr=0;WebGPU.iterateExtensions(entryPtr,{327681:ptr=>{externalTexturePtr=Number((growMemViews(),HEAPU64)[(ptr+16)/8])}});var resource;if(bufferPtr){var size=readI53FromI64(entryPtr+32);if(size==-1)size=undefined;resource={buffer:WebGPU.getJsObject(bufferPtr),offset:readI53FromI64(entryPtr+24),size}}else{resource=WebGPU.getJsObject(samplerPtr||textureViewPtr||externalTexturePtr)}return{binding:(growMemViews(),HEAPU32)[(entryPtr+8)/4],resource}}function makeEntries(count,entriesPtrs){var entries=[];for(var i=0;i<count;++i){entries.push(makeEntry(entriesPtrs+56*i))}return entries}var desc={label:WebGPU.makeStringFromOptionalStringView(descriptor+8),layout:WebGPU.getJsObject(Number((growMemViews(),HEAPU64)[(descriptor+24)/8])),entries:makeEntries(Number((growMemViews(),HEAPU64)[(descriptor+32)/8]),Number((growMemViews(),HEAPU64)[(descriptor+40)/8]))};var device=WebGPU.getJsObject(devicePtr);var ptr=_emwgpuCreateBindGroup(0n);WebGPU.Internals.jsObjectInsert(ptr,device.createBindGroup(desc));return ptr})();return BigInt(ret)};var _wgpuDeviceCreateCommandEncoder=function(devicePtr,descriptor){devicePtr=bigintToI53Checked(devicePtr);descriptor=bigintToI53Checked(descriptor);var ret=(()=>{var desc;if(descriptor){desc={label:WebGPU.makeStringFromOptionalStringView(descriptor+8)}}var device=WebGPU.getJsObject(devicePtr);var ptr=_emwgpuCreateCommandEncoder(0n);WebGPU.Internals.jsObjectInsert(ptr,device.createCommandEncoder(desc));return ptr})();return BigInt(ret)};var _wgpuDeviceCreateComputePipeline=function(devicePtr,descriptor){devicePtr=bigintToI53Checked(devicePtr);descriptor=bigintToI53Checked(descriptor);var ret=(()=>{var desc=WebGPU.makeComputePipelineDesc(descriptor);var device=WebGPU.getJsObject(devicePtr);var ptr=_emwgpuCreateComputePipeline(0n);WebGPU.Internals.jsObjectInsert(ptr,device.createComputePipeline(desc));return ptr})();return BigInt(ret)};function _wgpuInstanceHasWGSLLanguageFeature(instance,featureEnumValue){instance=bigintToI53Checked(instance);if(!("wgslLanguageFeatures"in navigator.gpu)){return false}return navigator.gpu.wgslLanguageFeatures.has(WebGPU.WGSLLanguageFeatureName[featureEnumValue])}var _wgpuQueueSubmit=function(queuePtr,commandCount,commands){queuePtr=bigintToI53Checked(queuePtr);commandCount=bigintToI53Checked(commandCount);commands=bigintToI53Checked(commands);var queue=WebGPU.getJsObject(queuePtr);var cmds=Array.from((growMemViews(),HEAP64).subarray(commands/8,(commands+commandCount*8)/8),id=>WebGPU.getJsObject(id));queue.submit(cmds)};function _wgpuQueueWriteBuffer(queuePtr,bufferPtr,bufferOffset,data,size){queuePtr=bigintToI53Checked(queuePtr);bufferPtr=bigintToI53Checked(bufferPtr);bufferOffset=bigintToI53Checked(bufferOffset);data=bigintToI53Checked(data);size=bigintToI53Checked(size);var queue=WebGPU.getJsObject(queuePtr);var buffer=WebGPU.getJsObject(bufferPtr);var subarray=(growMemViews(),HEAPU8).subarray(data,data+size);queue.writeBuffer(buffer,bufferOffset,subarray,0,size)}var Asyncify={instrumentWasmImports(imports){var importPattern=/^(invoke_.*|__asyncjs__.*)$/;for(let[x,original]of Object.entries(imports)){if(typeof original=="function"){let isAsyncifyImport=original.isAsync||importPattern.test(x);if(isAsyncifyImport){imports[x]=original=new WebAssembly.Suspending(original)}}}},instrumentFunction(original){var wrapper=(...args)=>original(...args);return wrapper},instrumentWasmExports(exports){var exportPattern=/^(wllama_start|wllama_action|main|__main_argc_argv)$/;Asyncify.asyncExports=new Set;var ret={};for(let[x,original]of Object.entries(exports)){if(typeof original=="function"){let isAsyncifyExport=exportPattern.test(x);if(isAsyncifyExport){Asyncify.asyncExports.add(original);original=Asyncify.makeAsyncFunction(original)}var wrapper=Asyncify.instrumentFunction(original);ret[x]=wrapper}else{ret[x]=original}}return ret},asyncExports:null,isAsyncExport(func){return Asyncify.asyncExports?.has(func)},handleAsync:async startAsync=>{runtimeKeepalivePush();try{return await startAsync()}finally{runtimeKeepalivePop()}},handleSleep:startAsync=>Asyncify.handleAsync(()=>new Promise(startAsync)),makeAsyncFunction(original){return WebAssembly.promising(original)}};var getCFunc=ident=>{var func=Module["_"+ident];return func};var writeArrayToMemory=(array,buffer)=>{(growMemViews(),HEAP8).set(array,buffer)};var ccall=(ident,returnType,argTypes,args,opts)=>{var toC={pointer:p=>BigInt(p),string:str=>{var ret=0;if(str!==null&&str!==undefined&&str!==0){ret=stringToUTF8OnStack(str)}return BigInt(ret)},array:arr=>{var ret=stackAlloc(arr.length);writeArrayToMemory(arr,ret);return BigInt(ret)}};function convertReturnValue(ret){if(returnType==="string"){return UTF8ToString(Number(ret))}if(returnType==="pointer")return Number(ret);if(returnType==="boolean")return Boolean(ret);return ret}var func=getCFunc(ident);var cArgs=[];var stack=0;if(args){for(var i=0;i<args.length;i++){var converter=toC[argTypes[i]];if(converter){if(stack===0)stack=stackSave();cArgs[i]=converter(args[i])}else{cArgs[i]=args[i]}}}var ret=func(...cArgs);function onDone(ret){if(stack!==0)stackRestore(stack);return convertReturnValue(ret)}var asyncMode=opts?.async;if(asyncMode)return ret.then(onDone);ret=onDone(ret);return ret};var cwrap=(ident,returnType,argTypes,opts)=>{var numericArgs=!argTypes||argTypes.every(type=>type==="number"||type==="boolean");var numericRet=returnType!=="string";if(numericRet&&numericArgs&&!opts){return getCFunc(ident)}return(...args)=>ccall(ident,returnType,argTypes,args,opts)};var FS_createPath=(...args)=>FS.createPath(...args);var FS_unlink=(...args)=>FS.unlink(...args);var FS_createLazyFile=(...args)=>FS.createLazyFile(...args);var FS_createDevice=(...args)=>FS.createDevice(...args);PThread.init();FS.createPreloadedFile=FS_createPreloadedFile;FS.preloadFile=FS_preloadFile;FS.staticInit();{initMemory();if(Module["noExitRuntime"])noExitRuntime=Module["noExitRuntime"];if(Module["preloadPlugins"])preloadPlugins=Module["preloadPlugins"];if(Module["print"])out=Module["print"];if(Module["printErr"])err=Module["printErr"];if(Module["wasmBinary"])wasmBinary=Module["wasmBinary"];if(Module["arguments"])arguments_=Module["arguments"];if(Module["thisProgram"])thisProgram=Module["thisProgram"];if(Module["preInit"]){if(typeof Module["preInit"]=="function")Module["preInit"]=[Module["preInit"]];while(Module["preInit"].length>0){Module["preInit"].shift()()}}}Module["ENV"]=ENV;Module["mmapAlloc"]=mmapAlloc;Module["wasmMemory"]=wasmMemory;Module["addRunDependency"]=addRunDependency;Module["removeRunDependency"]=removeRunDependency;Module["ccall"]=ccall;Module["cwrap"]=cwrap;Module["FS_preloadFile"]=FS_preloadFile;Module["FS_unlink"]=FS_unlink;Module["FS_createPath"]=FS_createPath;Module["FS_createDevice"]=FS_createDevice;Module["FS"]=FS;Module["FS_createDataFile"]=FS_createDataFile;Module["FS_createLazyFile"]=FS_createLazyFile;Module["MEMFS"]=MEMFS;var proxiedFunctionTable=[_proc_exit,exitOnMainThread,pthreadCreateProxied,___syscall_fcntl64,___syscall_fstat64,___syscall_getcwd,___syscall_getdents64,___syscall_ioctl,___syscall_lstat64,___syscall_newfstatat,___syscall_openat,___syscall_stat64,__mmap_js,__munmap_js,_environ_get,_environ_sizes_get,_fd_close,_fd_read,_fd_seek,_fd_write];function __asyncjs__js_file_read(path_ptr,offset,req_size,out_ptr){return Asyncify.handleAsync(async()=>await _wllama_js_file_read(UTF8ToString(Number(path_ptr)),Number(offset),Number(req_size),Number(out_ptr)))}__asyncjs__js_file_read.sig="jjjjj";var _malloc,_free,_wllama_malloc,_wllama_start,_wllama_action,_wllama_exit,_wllama_debug,_main,_emwgpuCreateBindGroup,_emwgpuCreateBindGroupLayout,_emwgpuCreateCommandBuffer,_emwgpuCreateCommandEncoder,_emwgpuCreateComputePassEncoder,_emwgpuCreateComputePipeline,_emwgpuCreateExternalTexture,_emwgpuCreatePipelineLayout,_emwgpuCreateQuerySet,_emwgpuCreateRenderBundle,_emwgpuCreateRenderBundleEncoder,_emwgpuCreateRenderPassEncoder,_emwgpuCreateRenderPipeline,_emwgpuCreateSampler,_emwgpuCreateSurface,_emwgpuCreateTexture,_emwgpuCreateTextureView,_emwgpuCreateAdapter,_emwgpuCreateBuffer,_emwgpuCreateDevice,_emwgpuCreateQueue,_emwgpuCreateShaderModule,_emwgpuOnDeviceLostCompleted,_emwgpuOnMapAsyncCompleted,_emwgpuOnRequestAdapterCompleted,_emwgpuOnRequestDeviceCompleted,_emwgpuOnWorkDoneCompleted,_emwgpuOnUncapturedError,__emscripten_tls_init,_pthread_self,_emscripten_builtin_memalign,__emscripten_thread_init,__emscripten_thread_crashed,__emscripten_run_js_on_main_thread,__emscripten_thread_free_data,__emscripten_thread_exit,__emscripten_check_mailbox,_memalign,___trap,_emscripten_stack_set_limits,__emscripten_stack_restore,__emscripten_stack_alloc,_emscripten_stack_get_current,__indirect_function_table,wasmTable;function assignWasmExports(wasmExports){_malloc=wasmExports["malloc"];_free=wasmExports["free"];_wllama_malloc=Module["_wllama_malloc"]=wasmExports["wllama_malloc"];_wllama_start=Module["_wllama_start"]=wasmExports["wllama_start"];_wllama_action=Module["_wllama_action"]=wasmExports["wllama_action"];_wllama_exit=Module["_wllama_exit"]=wasmExports["wllama_exit"];_wllama_debug=Module["_wllama_debug"]=wasmExports["wllama_debug"];_main=Module["_main"]=wasmExports["main"];_emwgpuCreateBindGroup=wasmExports["emwgpuCreateBindGroup"];_emwgpuCreateBindGroupLayout=wasmExports["emwgpuCreateBindGroupLayout"];_emwgpuCreateCommandBuffer=wasmExports["emwgpuCreateCommandBuffer"];_emwgpuCreateCommandEncoder=wasmExports["emwgpuCreateCommandEncoder"];_emwgpuCreateComputePassEncoder=wasmExports["emwgpuCreateComputePassEncoder"];_emwgpuCreateComputePipeline=wasmExports["emwgpuCreateComputePipeline"];_emwgpuCreateExternalTexture=wasmExports["emwgpuCreateExternalTexture"];_emwgpuCreatePipelineLayout=wasmExports["emwgpuCreatePipelineLayout"];_emwgpuCreateQuerySet=wasmExports["emwgpuCreateQuerySet"];_emwgpuCreateRenderBundle=wasmExports["emwgpuCreateRenderBundle"];_emwgpuCreateRenderBundleEncoder=wasmExports["emwgpuCreateRenderBundleEncoder"];_emwgpuCreateRenderPassEncoder=wasmExports["emwgpuCreateRenderPassEncoder"];_emwgpuCreateRenderPipeline=wasmExports["emwgpuCreateRenderPipeline"];_emwgpuCreateSampler=wasmExports["emwgpuCreateSampler"];_emwgpuCreateSurface=wasmExports["emwgpuCreateSurface"];_emwgpuCreateTexture=wasmExports["emwgpuCreateTexture"];_emwgpuCreateTextureView=wasmExports["emwgpuCreateTextureView"];_emwgpuCreateAdapter=wasmExports["emwgpuCreateAdapter"];_emwgpuCreateBuffer=wasmExports["emwgpuCreateBuffer"];_emwgpuCreateDevice=wasmExports["emwgpuCreateDevice"];_emwgpuCreateQueue=wasmExports["emwgpuCreateQueue"];_emwgpuCreateShaderModule=wasmExports["emwgpuCreateShaderModule"];_emwgpuOnDeviceLostCompleted=wasmExports["emwgpuOnDeviceLostCompleted"];_emwgpuOnMapAsyncCompleted=wasmExports["emwgpuOnMapAsyncCompleted"];_emwgpuOnRequestAdapterCompleted=wasmExports["emwgpuOnRequestAdapterCompleted"];_emwgpuOnRequestDeviceCompleted=wasmExports["emwgpuOnRequestDeviceCompleted"];_emwgpuOnWorkDoneCompleted=wasmExports["emwgpuOnWorkDoneCompleted"];_emwgpuOnUncapturedError=wasmExports["emwgpuOnUncapturedError"];__emscripten_tls_init=wasmExports["_emscripten_tls_init"];_pthread_self=wasmExports["pthread_self"];_emscripten_builtin_memalign=wasmExports["emscripten_builtin_memalign"];__emscripten_thread_init=wasmExports["_emscripten_thread_init"];__emscripten_thread_crashed=wasmExports["_emscripten_thread_crashed"];__emscripten_run_js_on_main_thread=wasmExports["_emscripten_run_js_on_main_thread"];__emscripten_thread_free_data=wasmExports["_emscripten_thread_free_data"];__emscripten_thread_exit=wasmExports["_emscripten_thread_exit"];__emscripten_check_mailbox=wasmExports["_emscripten_check_mailbox"];_memalign=wasmExports["memalign"];___trap=wasmExports["__trap"];_emscripten_stack_set_limits=wasmExports["emscripten_stack_set_limits"];__emscripten_stack_restore=wasmExports["_emscripten_stack_restore"];__emscripten_stack_alloc=wasmExports["_emscripten_stack_alloc"];_emscripten_stack_get_current=wasmExports["emscripten_stack_get_current"];__indirect_function_table=wasmTable=wasmExports["__indirect_function_table"]}var wasmImports;function assignWasmImports(){wasmImports={__asyncjs__js_file_read,__pthread_create_js:___pthread_create_js,__syscall_fcntl64:___syscall_fcntl64,__syscall_getcwd:___syscall_getcwd,__syscall_getdents64:___syscall_getdents64,__syscall_ioctl:___syscall_ioctl,__syscall_openat:___syscall_openat,__syscall_stat64:___syscall_stat64,_abort_js:__abort_js,_emscripten_init_main_thread_js:__emscripten_init_main_thread_js,_emscripten_notify_mailbox_postmessage:__emscripten_notify_mailbox_postmessage,_emscripten_receive_on_main_thread_js:__emscripten_receive_on_main_thread_js,_emscripten_thread_cleanup:__emscripten_thread_cleanup,_emscripten_thread_mailbox_await:__emscripten_thread_mailbox_await,_emscripten_thread_set_strongref:__emscripten_thread_set_strongref,_mmap_js:__mmap_js,_munmap_js:__munmap_js,_tzset_js:__tzset_js,clock_time_get:_clock_time_get,emscripten_check_blocking_allowed:_emscripten_check_blocking_allowed,emscripten_date_now:_emscripten_date_now,emscripten_exit_with_live_runtime:_emscripten_exit_with_live_runtime,emscripten_get_callstack:_emscripten_get_callstack,emscripten_get_heap_max:_emscripten_get_heap_max,emscripten_get_now:_emscripten_get_now,emscripten_has_asyncify:_emscripten_has_asyncify,emscripten_num_logical_cores:_emscripten_num_logical_cores,emscripten_resize_heap:_emscripten_resize_heap,emwgpuAdapterRequestDevice:_emwgpuAdapterRequestDevice,emwgpuBufferDestroy:_emwgpuBufferDestroy,emwgpuBufferGetConstMappedRange:_emwgpuBufferGetConstMappedRange,emwgpuBufferMapAsync:_emwgpuBufferMapAsync,emwgpuBufferUnmap:_emwgpuBufferUnmap,emwgpuDelete:_emwgpuDelete,emwgpuDeviceCreateBuffer:_emwgpuDeviceCreateBuffer,emwgpuDeviceCreateShaderModule:_emwgpuDeviceCreateShaderModule,emwgpuDeviceDestroy:_emwgpuDeviceDestroy,emwgpuInstanceRequestAdapter:_emwgpuInstanceRequestAdapter,emwgpuQueueOnSubmittedWorkDone:_emwgpuQueueOnSubmittedWorkDone,emwgpuWaitAny:_emwgpuWaitAny,environ_get:_environ_get,environ_sizes_get:_environ_sizes_get,exit:_exit,fd_close:_fd_close,fd_read:_fd_read,fd_seek:_fd_seek,fd_write:_fd_write,memory:wasmMemory,random_get:_random_get,wgpuAdapterGetInfo:_wgpuAdapterGetInfo,wgpuAdapterGetLimits:_wgpuAdapterGetLimits,wgpuAdapterHasFeature:_wgpuAdapterHasFeature,wgpuBufferGetSize:_wgpuBufferGetSize,wgpuCommandEncoderBeginComputePass:_wgpuCommandEncoderBeginComputePass,wgpuCommandEncoderCopyBufferToBuffer:_wgpuCommandEncoderCopyBufferToBuffer,wgpuCommandEncoderFinish:_wgpuCommandEncoderFinish,wgpuComputePassEncoderDispatchWorkgroups:_wgpuComputePassEncoderDispatchWorkgroups,wgpuComputePassEncoderEnd:_wgpuComputePassEncoderEnd,wgpuComputePassEncoderSetBindGroup:_wgpuComputePassEncoderSetBindGroup,wgpuComputePassEncoderSetPipeline:_wgpuComputePassEncoderSetPipeline,wgpuComputePipelineGetBindGroupLayout:_wgpuComputePipelineGetBindGroupLayout,wgpuDeviceCreateBindGroup:_wgpuDeviceCreateBindGroup,wgpuDeviceCreateCommandEncoder:_wgpuDeviceCreateCommandEncoder,wgpuDeviceCreateComputePipeline:_wgpuDeviceCreateComputePipeline,wgpuInstanceHasWGSLLanguageFeature:_wgpuInstanceHasWGSLLanguageFeature,wgpuQueueSubmit:_wgpuQueueSubmit,wgpuQueueWriteBuffer:_wgpuQueueWriteBuffer}}function applySignatureConversions(wasmExports){wasmExports=Object.assign({},wasmExports);var makeWrapper_pp=f=>a0=>Number(f(BigInt(a0)));var makeWrapper__p=f=>a0=>f(BigInt(a0));var makeWrapper___PP=f=>(a0,a1,a2)=>f(a0,BigInt(a1?a1:0),BigInt(a2?a2:0));var makeWrapper_p=f=>()=>Number(f());var makeWrapper_ppp=f=>(a0,a1)=>Number(f(BigInt(a0),BigInt(a1)));var makeWrapper__p_____=f=>(a0,a1,a2,a3,a4,a5)=>f(BigInt(a0),a1,a2,a3,a4,a5);var makeWrapper___p_p_=f=>(a0,a1,a2,a3,a4)=>f(a0,BigInt(a1),a2,BigInt(a3),a4);var makeWrapper__pp=f=>(a0,a1)=>f(BigInt(a0),BigInt(a1));wasmExports["malloc"]=makeWrapper_pp(wasmExports["malloc"]);wasmExports["free"]=makeWrapper__p(wasmExports["free"]);wasmExports["main"]=makeWrapper___PP(wasmExports["main"]);wasmExports["pthread_self"]=makeWrapper_p(wasmExports["pthread_self"]);wasmExports["emscripten_builtin_memalign"]=makeWrapper_ppp(wasmExports["emscripten_builtin_memalign"]);wasmExports["_emscripten_thread_init"]=makeWrapper__p_____(wasmExports["_emscripten_thread_init"]);wasmExports["_emscripten_run_js_on_main_thread"]=makeWrapper___p_p_(wasmExports["_emscripten_run_js_on_main_thread"]);wasmExports["_emscripten_thread_free_data"]=makeWrapper__p(wasmExports["_emscripten_thread_free_data"]);wasmExports["_emscripten_thread_exit"]=makeWrapper__p(wasmExports["_emscripten_thread_exit"]);wasmExports["memalign"]=makeWrapper_ppp(wasmExports["memalign"]);wasmExports["emscripten_stack_set_limits"]=makeWrapper__pp(wasmExports["emscripten_stack_set_limits"]);wasmExports["_emscripten_stack_restore"]=makeWrapper__p(wasmExports["_emscripten_stack_restore"]);wasmExports["_emscripten_stack_alloc"]=makeWrapper_pp(wasmExports["_emscripten_stack_alloc"]);wasmExports["emscripten_stack_get_current"]=makeWrapper_p(wasmExports["emscripten_stack_get_current"]);return wasmExports}async function callMain(){var entryFunction=_main;var argc=0;var argv=0;try{var ret=entryFunction(argc,BigInt(argv));ret=await ret;exitJS(ret,true);return ret}catch(e){return handleException(e)}}function run(){if(runDependencies>0){dependenciesFulfilled=run;return}if(ENVIRONMENT_IS_PTHREAD){initRuntime();return}preRun();if(runDependencies>0){dependenciesFulfilled=run;return}async function doRun(){Module["calledRun"]=true;if(ABORT)return;initRuntime();preMain();Module["onRuntimeInitialized"]?.();var noInitialRun=Module["noInitialRun"]||false;if(!noInitialRun)await callMain();postRun()}if(Module["setStatus"]){Module["setStatus"]("Running...");setTimeout(()=>{setTimeout(()=>Module["setStatus"](""),1);doRun()},1)}else{doRun()}}var wasmExports;if(!ENVIRONMENT_IS_PTHREAD){createWasm();run()}\n';

// src/worker.ts
var FILE_READ_REQ_EVENT = "fs.read_req";
var JSPI_STUB = `
if (!WebAssembly.Suspending) {
  // JSPI not available - stubs that keep the import/export tables valid.
  // Suspending wraps imports: identity is fine since async imports won't be called.
  WebAssembly.Suspending = function (fn) {
    // console.log(fn.toString());
    return fn;
  };
  // promising wraps exports: must return a Promise so ccall's ret.then() works.
  WebAssembly.promising = function (fn) {
    return function (...args) {
      try {
        return Promise.resolve(fn(...args));
      } catch (e) {
        return Promise.reject(e);
      }
    };
  };
}
`;
var ProxyToWorker = class {
  // filename -> Blob for async reads
  constructor(resources, nbThread, suppressNativeLog, logger) {
    __publicField(this, "resources");
    __publicField(this, "logger");
    __publicField(this, "suppressNativeLog");
    __publicField(this, "taskQueue", []);
    __publicField(this, "taskId", 1);
    __publicField(this, "resultQueue", []);
    __publicField(this, "actionInFlight", false);
    __publicField(this, "worker");
    __publicField(this, "multiThread");
    __publicField(this, "nbThread");
    __publicField(this, "useAsyncFile");
    __publicField(this, "fileBlobs", /* @__PURE__ */ new Map());
    this.resources = resources;
    this.nbThread = nbThread;
    this.multiThread = nbThread > 0;
    this.logger = logger;
    this.suppressNativeLog = suppressNativeLog;
    this.useAsyncFile = canUseAsyncFileRead(resources.compat);
  }
  getModuleCode() {
    return __async(this, null, function* () {
      if (!this.resources.jsPath) {
        if (this.resources.compat) {
          throw new Error(
            "compat mode is enabled but no jsPath was provided. Pass a worker JS via setCompat() or install @wllama/wllama-compat."
          );
        }
        return WLLAMA_EMSCRIPTEN_CODE;
      } else if (this.resources.jsPath.code) {
        return this.resources.jsPath.code;
      } else if (isString(this.resources.jsPath)) {
        const response = yield fetch(this.resources.jsPath);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch worker code from ${this.resources.jsPath}`
          );
        }
        return yield response.text();
      } else {
        throw new Error("No JS code provided for worker");
      }
    });
  }
  moduleInit(ggufFiles) {
    return __async(this, null, function* () {
      let moduleCode = JSPI_STUB + (yield this.getModuleCode());
      let mainModuleCode = moduleCode.replace("var Module", "var ___Module");
      const runOptions = {
        pathConfig: {
          "wllama.wasm": this.resources.wasmPath
        },
        nbThread: this.nbThread,
        compat: this.resources.compat
      };
      const completeCode = [
        `const RUN_OPTIONS = ${JSON.stringify(runOptions)};`,
        `function wModuleInit() { ${mainModuleCode}; return Module; }`,
        LLAMA_CPP_WORKER_CODE
      ].join(";\n\n");
      this.worker = createWorker(completeCode);
      this.worker.onmessage = this.onRecvMsg.bind(this);
      this.worker.onerror = this.logger.error;
      const res = yield this.pushTask({
        verb: "module.init",
        args: [
          new Blob([moduleCode], { type: "text/javascript" }),
          this.useAsyncFile
        ],
        callbackId: this.taskId++
      });
      const nativeFiles = [];
      for (const file of ggufFiles) {
        const needAllocBuffer = !this.useAsyncFile;
        const id = yield this.fileAlloc(
          file.name,
          file.blob.size,
          needAllocBuffer
        );
        nativeFiles.push(__spreadValues({ id }, file));
        if (this.useAsyncFile) {
          this.fileBlobs.set(file.name, file.blob);
        }
      }
      if (!this.useAsyncFile) {
        yield Promise.all(
          nativeFiles.map((file) => {
            return this.fileWrite(file.id, file.blob);
          })
        );
      }
      return res;
    });
  }
  wllamaStart() {
    return __async(this, null, function* () {
      const result = yield this.pushTask({
        verb: "wllama.start",
        args: [],
        callbackId: this.taskId++
      });
      const parsedResult = this.parseResult(result);
      return parsedResult;
    });
  }
  wllamaAction(name, body) {
    return __async(this, null, function* () {
      const encodedMsg = glueSerialize(body);
      const result = yield this.pushTask({
        verb: "wllama.action",
        args: [name, encodedMsg],
        callbackId: this.taskId++
      });
      const parsedResult = glueDeserialize(result);
      return parsedResult;
    });
  }
  wllamaExit() {
    return __async(this, null, function* () {
      if (this.worker) {
        this.worker.terminate();
      }
    });
  }
  wllamaDebug() {
    return __async(this, null, function* () {
      const result = yield this.pushTask({
        verb: "wllama.debug",
        args: [],
        callbackId: this.taskId++
      });
      return JSON.parse(result);
    });
  }
  ///////////////////////////////////////
  /**
   * Allocate a new file in heapfs
   * @returns fileId, to be used by fileWrite()
   */
  fileAlloc(fileName, size, allocBuffer) {
    return __async(this, null, function* () {
      const result = yield this.pushTask({
        verb: "fs.alloc",
        args: [fileName, size, allocBuffer],
        callbackId: this.taskId++
      });
      return result.fileId;
    });
  }
  /**
   * Write a Blob to heapfs
   */
  fileWrite(fileId, blob) {
    return __async(this, null, function* () {
      const reader = blob.stream().getReader();
      let offset = 0;
      while (true) {
        const { done, value } = yield reader.read();
        if (done) break;
        const size = value.byteLength;
        yield this.pushTask(
          {
            verb: "fs.write",
            args: [fileId, value, offset],
            callbackId: this.taskId++
          },
          // @ts-ignore Type 'ArrayBufferLike' is not assignable to type 'ArrayBuffer'
          [value.buffer]
        );
        offset += size;
      }
    });
  }
  fileReadResponse(name, offset, size) {
    return __async(this, null, function* () {
      var _a;
      try {
        const blob = this.fileBlobs.get(name);
        if (!blob) {
          throw new Error(`blob not found for name="${name}"`);
        }
        const chunk = blob.slice(offset, offset + size);
        const buffer = yield chunk.arrayBuffer();
        this.worker.postMessage(
          { verb: "fs.read_res", args: [buffer] },
          { transfer: [buffer] }
        );
      } catch (err) {
        this.logger.error("fileReadResponse failed, terminating worker:", err);
        (_a = this.worker) == null ? void 0 : _a.terminate();
        this.worker = void 0;
        this.abort(`File read failed: ${err}`, err.stack || "");
      }
    });
  }
  /**
   * Parse JSON result returned by cpp code.
   * Throw new Error if "__exception" is present in the response
   *
   * TODO: get rid of this function once everything is migrated to Glue
   */
  parseResult(result) {
    const parsedResult = JSON.parse(result);
    if (parsedResult && parsedResult["error"]) {
      throw new WllamaRuntimeError("Unknown error, please see console.log", "");
    }
    return parsedResult;
  }
  /**
   * Push a new task to taskQueue
   */
  pushTask(param, buffers) {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ resolve, reject, param, buffers });
      this.runTaskLoop();
    });
  }
  /**
   * Main loop for processing tasks
   */
  runTaskLoop() {
    return __async(this, null, function* () {
      var _a;
      if (this.actionInFlight) {
        return;
      }
      const task = this.taskQueue.shift();
      if (!task) return;
      this.resultQueue.push(task);
      this.actionInFlight = true;
      this.worker.postMessage(
        task.param,
        isSafariMobile() ? void 0 : {
          transfer: (_a = task.buffers) != null ? _a : []
        }
      );
    });
  }
  /**
   * Handle messages from worker
   */
  onRecvMsg(e) {
    if (!e.data) return;
    const { verb, args } = e.data;
    const isCompatBuild = this.resources.compat;
    if (verb && verb.startsWith("console.")) {
      if (this.suppressNativeLog) {
        return;
      }
      if (verb.endsWith("debug")) this.logger.debug(...args);
      if (verb.endsWith("log")) this.logger.log(...args);
      if (verb.endsWith("warn")) this.logger.warn(...args);
      if (verb.endsWith("error")) this.logger.error(...args);
      return;
    } else if (verb === "signal.abort") {
      const [signalType, message, rawStack, originalErr] = args;
      if (originalErr) {
        this.logger.error(originalErr);
      }
      (() => __async(this, null, function* () {
        let stack = "";
        let newMsg = message.replace(
          "Build with -sASSERTIONS for more info.",
          ""
        );
        if (signalType === "abort") {
          newMsg = `(ABORT) ${newMsg}`;
          stack = rawStack.replace(/\|/g, "\n");
        } else if (signalType === "exception") {
          stack = rawStack;
        }
        const decoded = yield Debug.decodeStackTrace(stack, isCompatBuild);
        this.logger.error(`Stack trace (${signalType}):
` + decoded);
        this.abort(newMsg, decoded);
      }))();
      return;
    }
    if (verb === FILE_READ_REQ_EVENT) {
      const [name, offset, size] = args;
      this.fileReadResponse(name, offset, size).catch(() => {
      });
      return;
    }
    const { callbackId, result, err } = e.data;
    if (callbackId) {
      const idx = this.resultQueue.findIndex(
        (t) => t.param.callbackId === callbackId
      );
      if (idx !== -1) {
        const waitingTask = this.resultQueue.splice(idx, 1)[0];
        this.actionInFlight = false;
        if (err) waitingTask.reject(err);
        else waitingTask.resolve(result);
      } else {
        this.actionInFlight = false;
        this.logger.error(
          `Cannot find waiting task with callbackId = ${callbackId}`
        );
      }
      this.runTaskLoop();
    }
  }
  abort(text, stack) {
    const error = new WllamaRuntimeError(
      text.length == 0 ? "(unknown error)" : text,
      stack
    );
    this.actionInFlight = false;
    while (this.resultQueue.length > 0) {
      const waitingTask = this.resultQueue.pop();
      if (!waitingTask) break;
      waitingTask.reject(error);
    }
    while (this.taskQueue.length > 0) {
      const pendingTask = this.taskQueue.pop();
      if (!pendingTask) break;
      pendingTask.reject(error);
    }
  }
};

// src/storage/opfs.ts
var OPFSBackend = class {
  read(key) {
    return __async(this, null, function* () {
      try {
        const cacheDir = yield getCacheDir();
        const fileHandle = yield cacheDir.getFileHandle(key);
        return yield fileHandle.getFile();
      } catch (e) {
        return null;
      }
    });
  }
  write(key, stream) {
    return __async(this, null, function* () {
      const writable = yield openWritable(key);
      yield writable.truncate(0);
      const reader = stream.getReader();
      try {
        while (true) {
          const { done, value } = yield reader.read();
          if (done) break;
          yield writable.write(value);
        }
      } finally {
        yield writable.close();
      }
    });
  }
  getSize(key) {
    return __async(this, null, function* () {
      try {
        const cacheDir = yield getCacheDir();
        const fileHandle = yield cacheDir.getFileHandle(key);
        const file = yield fileHandle.getFile();
        return file.size;
      } catch (e) {
        return -1;
      }
    });
  }
  list() {
    return __async(this, null, function* () {
      const cacheDir = yield getCacheDir();
      const result = [];
      try {
        for (var iter = __forAwait(cacheDir.entries()), more, temp, error; more = !(temp = yield iter.next()).done; more = false) {
          const [name, handle] = temp.value;
          if (handle.kind === "file") {
            const file = yield handle.getFile();
            result.push({ key: name, size: file.size });
          }
        }
      } catch (temp) {
        error = [temp];
      } finally {
        try {
          more && (temp = iter.return) && (yield temp.call(iter));
        } finally {
          if (error)
            throw error[0];
        }
      }
      return result;
    });
  }
  delete(key) {
    return __async(this, null, function* () {
      try {
        const cacheDir = yield getCacheDir();
        yield cacheDir.removeEntry(key);
      } catch (e) {
        if ((e == null ? void 0 : e.name) !== "NotFoundError") throw e;
      }
    });
  }
};
function getCacheDir() {
  return __async(this, null, function* () {
    const opfsRoot = yield navigator.storage.getDirectory();
    return opfsRoot.getDirectoryHandle("cache", { create: true });
  });
}
function openWritable(fileName) {
  return __async(this, null, function* () {
    const worker = createWorker(OPFS_UTILS_WORKER_CODE);
    let pResolve;
    let pReject;
    worker.onmessage = (e) => {
      if (e.data.ok) pResolve(null);
      else if (e.data.err) pReject(e.data.err);
    };
    worker.onerror = (e) => {
      var _a;
      return pReject == null ? void 0 : pReject((_a = e.message) != null ? _a : e);
    };
    const workerExec = (data) => new Promise((resolve, reject) => {
      pResolve = resolve;
      pReject = reject;
      worker.postMessage(
        data,
        isSafariMobile() ? void 0 : { transfer: "buf" in data && data.buf ? [data.buf.buffer] : [] }
      );
    });
    yield workerExec({ action: "open", filename: fileName });
    return {
      truncate: () => __async(this, null, function* () {
      }),
      write: (value) => workerExec({ action: "write", buf: value }),
      close: () => __async(this, null, function* () {
        yield workerExec({ action: "close" });
        worker.terminate();
      })
    };
  });
}

// src/cache-manager.ts
var PREFIX_METADATA = "__metadata__";
var POLYFILL_ETAG = "polyfill_for_older_version";
var CacheManager = class {
  constructor(backend = new OPFSBackend()) {
    __publicField(this, "sb");
    this.sb = backend;
  }
  /**
   * Convert a given URL into a storage key.
   *
   * Format: `${hashSHA1(fullURL)}_${fileName}`
   */
  getNameFromURL(url) {
    return __async(this, null, function* () {
      return urlToFileName(url, "");
    });
  }
  /**
   * @deprecated Use `download()` instead
   *
   * Write a new file to cache. This will overwrite existing file.
   *
   * @param name The file name returned by `getNameFromURL()` or `list()`
   */
  write(name, stream, metadata) {
    return __async(this, null, function* () {
      yield this.sb.write(name, stream);
      yield this.writeMetadata(name, metadata);
    });
  }
  download(_0) {
    return __async(this, arguments, function* (url, options = {}) {
      var _a;
      const fileKey = yield urlToFileName(url, "");
      const response = yield fetch(url, __spreadValues(__spreadValues({}, options.headers ? { headers: options.headers } : {}), options.signal ? { signal: options.signal } : {}));
      if (!response.ok || !response.body) {
        throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
      }
      const contentLength = response.headers.get("content-length");
      const etag = (response.headers.get("etag") || "").replace(
        /[^A-Za-z0-9]/g,
        ""
      );
      const total = parseInt(contentLength != null ? contentLength : "0", 10);
      const progressCallback = options.progressCallback;
      let loaded = 0;
      let lastProgressAt = 0;
      const progressStream = new TransformStream({
        transform(chunk, controller) {
          loaded += chunk.byteLength;
          if (progressCallback) {
            const now = Date.now();
            if (now - lastProgressAt > 100) {
              lastProgressAt = now;
              progressCallback({ loaded, total });
            }
          }
          controller.enqueue(chunk);
        },
        flush() {
          progressCallback == null ? void 0 : progressCallback({ loaded, total: total || loaded });
        }
      });
      yield this.sb.write(fileKey, response.body.pipeThrough(progressStream));
      yield this.writeMetadata(fileKey, __spreadValues({
        originalURL: url,
        originalSize: total,
        etag
      }, (_a = options.metadataAdditional) != null ? _a : {}));
    });
  }
  /**
   * Open a file in cache for reading
   *
   * @param nameOrURL The file name returned by `getNameFromURL()` or `list()`, or the original URL of the remote file
   * @returns Blob, or null if file does not exist
   */
  open(nameOrURL) {
    return __async(this, null, function* () {
      const direct = yield this.sb.read(nameOrURL);
      if (direct) return direct;
      const key = yield urlToFileName(nameOrURL, "");
      return this.sb.read(key);
    });
  }
  /**
   * Get the size of a file in stored cache
   *
   * NOTE: in case the download is stopped mid-way (i.e. user close browser tab), the file maybe corrupted, size maybe different from `metadata.originalSize`
   *
   * @param name The file name returned by `getNameFromURL()` or `list()`
   * @returns number of bytes, or -1 if file does not exist
   */
  getSize(name) {
    return __async(this, null, function* () {
      return this.sb.getSize(name);
    });
  }
  /**
   * Get metadata of a cached file
   */
  getMetadata(name) {
    return __async(this, null, function* () {
      const blob = yield this.sb.read(`${PREFIX_METADATA}${name}`);
      const cachedSize = yield this.sb.getSize(name);
      if (!blob) {
        return cachedSize > 0 ? (
          // files created by older version of wllama don't have metadata; polyfill it
          {
            etag: POLYFILL_ETAG,
            originalSize: cachedSize,
            originalURL: ""
          }
        ) : (
          // cached file not found
          null
        );
      }
      try {
        return yield new Response(blob).json();
      } catch (e) {
        return null;
      }
    });
  }
  /**
   * List all files currently in cache
   */
  list() {
    return __async(this, null, function* () {
      const all = yield this.sb.list();
      const metadataMap = {};
      for (const { key } of all) {
        if (key.startsWith(PREFIX_METADATA)) {
          const blob = yield this.sb.read(key);
          if (blob) {
            const meta = yield new Response(blob).json().catch(() => null);
            metadataMap[key.slice(PREFIX_METADATA.length)] = meta;
          }
        }
      }
      const result = [];
      for (const { key, size } of all) {
        if (!key.startsWith(PREFIX_METADATA)) {
          result.push({
            name: key,
            size,
            metadata: metadataMap[key] || {
              originalSize: size,
              originalURL: "",
              etag: ""
            }
          });
        }
      }
      return result;
    });
  }
  /**
   * Clear all files currently in cache
   */
  clear() {
    return __async(this, null, function* () {
      yield this.deleteMany(() => true);
    });
  }
  /**
   * Delete a single file in cache
   *
   * @param nameOrURL Can be either an URL or a name returned by `getNameFromURL()` or `list()`
   */
  delete(nameOrURL) {
    return __async(this, null, function* () {
      const name2 = yield this.getNameFromURL(nameOrURL);
      yield this.deleteMany(
        (entry) => entry.name === nameOrURL || entry.name === name2
      );
    });
  }
  /**
   * Delete multiple files in cache.
   *
   * @param predicate A predicate like `array.filter(item => boolean)`
   */
  deleteMany(predicate) {
    return __async(this, null, function* () {
      const list = yield this.list();
      for (const item of list) {
        if (predicate(item)) {
          yield this.sb.delete(item.name);
          yield this.sb.delete(`${PREFIX_METADATA}${item.name}`);
        }
      }
    });
  }
  /**
   * Write the metadata of the file to disk.
   */
  writeMetadata(name, metadata) {
    return __async(this, null, function* () {
      const blob = new Blob([JSON.stringify(metadata)], { type: "text/plain" });
      yield this.sb.write(`${PREFIX_METADATA}${name}`, blob.stream());
    });
  }
};
var cache_manager_default = CacheManager;
function urlToFileName(url, prefix) {
  return __async(this, null, function* () {
    const hashBuffer = yield crypto.subtle.digest(
      "SHA-1",
      new TextEncoder().encode(url)
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${prefix}${hashHex}_${url.split("/").pop()}`;
  });
}

// src/model-manager.ts
var DEFAULT_PARALLEL_DOWNLOADS = 3;
var ModelValidationStatus = /* @__PURE__ */ ((ModelValidationStatus2) => {
  ModelValidationStatus2["VALID"] = "valid";
  ModelValidationStatus2["INVALID"] = "invalid";
  ModelValidationStatus2["DELETED"] = "deleted";
  return ModelValidationStatus2;
})(ModelValidationStatus || {});
var Model = class {
  constructor(modelManager, url, mmprojUrl, savedFiles) {
    __publicField(this, "modelManager");
    /**
     * URL to the GGUF file (in case it contains multiple shards, the URL should point to the first shard)
     *
     * This URL will be used to identify the model in the cache. There can't be 2 models with the same URL.
     */
    __publicField(this, "url");
    /**
     * URL to mmproj file, if exists
     */
    __publicField(this, "mmprojUrl");
    /**
     * Size in bytes (total size of all shards).
     *
     * A value of -1 means the model is deleted from the cache. You must call `ModelManager.downloadModel` to re-download the model.
     */
    __publicField(this, "size");
    /**
     * List of all shards in the cache, sorted by original URL (ascending order)
     */
    __publicField(this, "files");
    this.modelManager = modelManager;
    this.url = url;
    this.mmprojUrl = mmprojUrl;
    if (savedFiles) {
      this.files = this.getAllFiles(savedFiles);
      this.size = sumArr(this.files.map((f) => f.metadata.originalSize));
    } else {
      this.files = [];
      this.size = 0;
    }
  }
  /**
   * Open and get a list of all shards as Blobs
   */
  open() {
    return __async(this, null, function* () {
      if (this.size === -1) {
        throw new WllamaError(
          `Model is deleted from the cache; Call ModelManager.downloadModel to re-download the model`,
          "load_error"
        );
      }
      const blobs = [];
      for (const file of this.files) {
        const blob = yield this.modelManager.cacheManager.open(file.name);
        if (!blob) {
          throw new Error(
            `Failed to open file ${file.name}; Hint: the model may be invalid, please refresh it`
          );
        }
        blobs.push(blob);
      }
      return blobs;
    });
  }
  /**
   * Validate the model files.
   *
   * If the model is invalid, the model manager will not be able to use it. You must call `refresh` to re-download the model.
   *
   * Cases that model is invalid:
   * - The model is deleted from the cache
   * - The model files are missing (or the download is interrupted)
   */
  validate() {
    let nbShards = ModelManager.parseModelUrl(this.url).length;
    if (this.mmprojUrl) {
      nbShards += 1;
    }
    if (this.size === -1) {
      return "deleted" /* DELETED */;
    }
    if (this.size < 16 || this.files.length !== nbShards) {
      return "invalid" /* INVALID */;
    }
    for (const file of this.files) {
      if (!file.metadata || file.metadata.originalSize !== file.size) {
        return "invalid" /* INVALID */;
      }
    }
    return "valid" /* VALID */;
  }
  /**
   * In case the model is invalid, call this function to re-download the model
   */
  refresh() {
    return __async(this, arguments, function* (options = {}) {
      var _a;
      const urls = ModelManager.parseModelUrl(this.url);
      if (this.mmprojUrl) {
        urls.push(this.mmprojUrl);
      }
      const works = urls.map((url, index) => ({
        url,
        index
      }));
      this.modelManager.logger.debug("Downloading model files:", urls);
      const nParallel = (_a = this.modelManager.params.parallelDownloads) != null ? _a : DEFAULT_PARALLEL_DOWNLOADS;
      const totalSize = yield this.getTotalDownloadSize(urls);
      const loadedSize = [];
      const worker = () => __async(this, null, function* () {
        while (works.length > 0) {
          const w = works.shift();
          if (!w) break;
          yield this.modelManager.cacheManager.download(w.url, __spreadProps(__spreadValues({}, options), {
            metadataAdditional: {
              originalURL: w.url,
              mmprojURL: this.mmprojUrl
            },
            progressCallback: ({ loaded }) => {
              var _a2;
              loadedSize[w.index] = loaded;
              (_a2 = options.progressCallback) == null ? void 0 : _a2.call(options, {
                loaded: sumArr(loadedSize),
                total: totalSize
              });
            }
          }));
        }
      });
      const promises = [];
      for (let i = 0; i < nParallel; i++) {
        promises.push(worker());
        loadedSize.push(0);
      }
      yield Promise.all(promises);
      this.files = this.getAllFiles(yield this.modelManager.cacheManager.list());
      this.size = this.files.reduce((acc, f) => acc + f.metadata.originalSize, 0);
    });
  }
  /**
   * Remove the model from the cache
   */
  remove() {
    return __async(this, null, function* () {
      this.files = this.getAllFiles(yield this.modelManager.cacheManager.list());
      yield this.modelManager.cacheManager.deleteMany(
        (f) => !!this.files.find((file) => file.name === f.name)
      );
      this.size = -1;
    });
  }
  getAllFiles(savedFiles) {
    const allUrls = new Set(ModelManager.parseModelUrl(this.url));
    if (this.mmprojUrl) {
      allUrls.add(this.mmprojUrl);
    }
    const allFiles = [];
    for (const url of allUrls) {
      const file = savedFiles.find((f) => f.metadata.originalURL === url);
      if (!file) {
        throw new Error(`Model file not found: ${url}`);
      }
      allFiles.push(file);
    }
    allFiles.sort(
      (a, b) => a.metadata.originalURL.localeCompare(b.metadata.originalURL)
    );
    return allFiles;
  }
  getTotalDownloadSize(urls) {
    return __async(this, null, function* () {
      const responses = yield Promise.all(
        urls.map((url) => fetch(url, { method: "HEAD" }))
      );
      const sizes = responses.map(
        (res) => Number(res.headers.get("content-length") || "0")
      );
      return sumArr(sizes);
    });
  }
};
var ModelManager = class _ModelManager {
  constructor(params = {}) {
    // The CacheManager singleton, can be accessed by user
    __publicField(this, "cacheManager");
    __publicField(this, "params");
    __publicField(this, "logger");
    this.cacheManager = params.cacheManager || new cache_manager_default();
    this.params = params;
    this.logger = params.logger || console;
  }
  /**
   * Parses a model URL and returns an array of URLs based on the following patterns:
   * - If the input URL is an array, it returns the array itself.
   * - If the input URL is a string in the `gguf-split` format, it returns an array containing the URL of each shard in ascending order.
   * - Otherwise, it returns an array containing the input URL as a single element array.
   * @param modelUrl URL or list of URLs
   */
  static parseModelUrl(modelUrl) {
    var _a;
    if (Array.isArray(modelUrl)) {
      return modelUrl;
    }
    const urlPartsRegex = /-(\d{5})-of-(\d{5})\.gguf(?:\?.*)?$/;
    const queryMatch = modelUrl.match(/\.gguf(\?.*)?$/);
    const queryParams = (_a = queryMatch == null ? void 0 : queryMatch[1]) != null ? _a : "";
    const matches = modelUrl.match(urlPartsRegex);
    if (!matches) {
      return [modelUrl];
    }
    const baseURL = modelUrl.replace(urlPartsRegex, "");
    const total = matches[2];
    const paddedShardIds = Array.from(
      { length: Number(total) },
      (_, index) => (index + 1).toString().padStart(5, "0")
    );
    return paddedShardIds.map(
      (current) => `${baseURL}-${current}-of-${total}.gguf${queryParams}`
    );
  }
  /**
   * Get all models in the cache
   */
  getModels() {
    return __async(this, arguments, function* (opts = {}) {
      const cachedFiles = yield this.cacheManager.list();
      let models = [];
      for (const file of cachedFiles) {
        const shards = _ModelManager.parseModelUrl(file.metadata.originalURL);
        const mmprojUrl = file.metadata.mmprojURL;
        const isFirstShard = shards.length === 1 || shards[0] === file.metadata.originalURL;
        if (isFirstShard) {
          models.push(
            new Model(this, file.metadata.originalURL, mmprojUrl, cachedFiles)
          );
        }
      }
      if (!opts.includeInvalid) {
        models = models.filter(
          (m) => m.validate() === "valid" /* VALID */
        );
      }
      return models;
    });
  }
  /**
   * Download a model from the given URL.
   *
   * The URL must end with `.gguf`
   */
  downloadModel(_0) {
    return __async(this, arguments, function* (sourceOrURL, options = {}) {
      const source = isString(sourceOrURL) ? { url: sourceOrURL } : sourceOrURL;
      if (!isValidGgufFile(source.url)) {
        throw new WllamaError(
          `Invalid model URL: ${source.url}; URL must ends with ".gguf"`,
          "download_error"
        );
      }
      const model = new Model(this, source.url, source.mmprojUrl);
      const validity = model.validate();
      if (validity !== "valid" /* VALID */) {
        yield model.refresh(options);
      }
      return model;
    });
  }
  /**
   * Get a model from the cache or download it if it's not available.
   */
  getModelOrDownload(_0) {
    return __async(this, arguments, function* (source, options = {}) {
      var _a;
      const models = yield this.getModels();
      const model = models.find((m) => m.url === source.url);
      if (model) {
        (_a = options.progressCallback) == null ? void 0 : _a.call(options, { loaded: model.size, total: model.size });
        return model;
      }
      return this.downloadModel(source, options);
    });
  }
  /**
   * Remove all models from the cache
   */
  clear() {
    return __async(this, null, function* () {
      yield this.cacheManager.clear();
    });
  }
};

// src/types/types.ts
var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2[LogLevel2["DEBUG"] = 1] = "DEBUG";
  LogLevel2[LogLevel2["INFO"] = 2] = "INFO";
  LogLevel2[LogLevel2["WARN"] = 3] = "WARN";
  LogLevel2[LogLevel2["ERROR"] = 4] = "ERROR";
  return LogLevel2;
})(LogLevel || {});

// src/huggingface.ts
var HF_BASE = "https://huggingface.co";
var DEFAULT_QUANTS = ["Q4_K_M", "Q8_0"];
function fetchRepoFiles(repo, token) {
  return __async(this, null, function* () {
    var _a;
    const url = `${HF_BASE}/api/models/${repo}/tree/main?recursive=true`;
    const headers = { Accept: "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = yield fetch(url, { headers });
    if (!res.ok) {
      let msg = res.statusText;
      try {
        msg = (_a = (yield res.json()).error) != null ? _a : msg;
      } catch (e) {
      }
      throw new Error(`HF API error (${res.status}): ${msg}`);
    }
    return res.json();
  });
}
function firstShardPath(files, path) {
  const m = path.match(/^(.+)-(\d{5})-of-(\d{5})\.gguf$/i);
  if (!m) return path;
  const first = `${m[1]}-00001-of-${m[3]}.gguf`;
  return files.some((f) => f.path === first) ? first : path;
}
function selectFile(files, quant, mmprojOnly) {
  const candidates = files.filter((f) => {
    if (f.type !== "file" || !f.path.toLowerCase().endsWith(".gguf"))
      return false;
    const ismmproj = f.path.toLowerCase().includes("mmproj");
    return mmprojOnly ? ismmproj : !ismmproj;
  });
  if (candidates.length === 0) return null;
  if (quant) {
    const upper = quant.toUpperCase();
    const match = candidates.find((f) => f.path.toUpperCase().includes(upper));
    if (match) return firstShardPath(candidates, match.path);
    return null;
  }
  for (const q of DEFAULT_QUANTS) {
    const match = candidates.find((f) => f.path.toUpperCase().includes(q));
    if (match) return firstShardPath(candidates, match.path);
  }
  return firstShardPath(candidates, candidates[0].path);
}
function getHFModelSource(config) {
  return __async(this, null, function* () {
    const { repo, file, quant, mmprojFile, mmprojQuant, hfToken } = config;
    const files = yield fetchRepoFiles(repo, hfToken);
    const modelPath = file != null ? file : selectFile(files, quant, false);
    if (!modelPath) {
      throw new Error(`No GGUF file found in repo "${repo}"`);
    }
    const source = {
      url: `${HF_BASE}/${repo}/resolve/main/${modelPath}`
    };
    if (mmprojFile || mmprojQuant !== void 0) {
      const mmpath = mmprojFile != null ? mmprojFile : selectFile(files, mmprojQuant, true);
      if (mmpath) {
        source.mmprojUrl = `${HF_BASE}/${repo}/resolve/main/${mmpath}`;
      }
    }
    if (hfToken) {
      const params = new URLSearchParams({ token: hfToken });
      source.url += `?${params}`;
      if (source.mmprojUrl) {
        source.mmprojUrl += `?${params}`;
      }
    }
    return source;
  });
}

// src/wasm-from-cdn.ts
var WasmCompatFromCDN = {
  worker: "https://cdn.jsdelivr.net/npm/@wllama/wllama-compat@3.4.1/wasm/wllama.js",
  wasm: "https://cdn.jsdelivr.net/npm/@wllama/wllama-compat@3.4.1/wasm/wllama.wasm"
};

// src/wllama.ts
var LoggerWithoutDebug = __spreadProps(__spreadValues({}, console), {
  debug: () => {
  }
});
var WllamaError = class extends Error {
  constructor(message, type = "unknown_error") {
    super(message);
    __publicField(this, "type");
    this.type = type;
  }
};
var WllamaAbortError = class extends Error {
  constructor() {
    super("Operation aborted");
    __publicField(this, "name", "AbortError");
  }
};
var WllamaRuntimeError = class extends Error {
  constructor(message, stack) {
    super(message);
    __publicField(this, "name", "RuntimeError");
    __publicField(this, "stack");
    this.stack = stack;
  }
};
var Wllama = class {
  constructor(pathConfig, wllamaConfig = {}) {
    // The CacheManager and ModelManager are singleton, can be accessed by user
    __publicField(this, "cacheManager");
    __publicField(this, "modelManager");
    __publicField(this, "compat", null);
    __publicField(this, "proxy", null);
    __publicField(this, "config");
    __publicField(this, "pathConfig");
    __publicField(this, "useMultiThread", false);
    __publicField(this, "nbThreads", 1);
    __publicField(this, "useEmbeddings", false);
    __publicField(this, "useRerank", false);
    // available when loaded
    __publicField(this, "loadedContextInfo", null);
    __publicField(this, "seed");
    __publicField(this, "bosToken", -1);
    __publicField(this, "eosToken", -1);
    __publicField(this, "eotToken", -1);
    __publicField(this, "eogTokens", /* @__PURE__ */ new Set());
    __publicField(this, "addBosToken", false);
    __publicField(this, "addEosToken", false);
    __publicField(this, "mediaMarker");
    __publicField(this, "chatTemplate");
    __publicField(this, "metadata");
    __publicField(this, "hasEncoder", false);
    __publicField(this, "decoderStartToken", -1);
    // note: we overlay instead of using llama-server default_template_kwargs, because we cannot transfer complex data structure via GLUE
    // overlay allow mixed data type or nested structure for kwargs
    __publicField(this, "chatTemplateKwargs", {});
    var _a, _b, _c;
    checkEnvironmentCompatible();
    if (!pathConfig) throw new WllamaError("AssetsPathConfig is required");
    this.pathConfig = pathConfig;
    this.config = wllamaConfig;
    this.cacheManager = (_a = wllamaConfig.cacheManager) != null ? _a : new cache_manager_default();
    this.modelManager = (_c = wllamaConfig.modelManager) != null ? _c : new ModelManager({
      cacheManager: this.cacheManager,
      logger: (_b = wllamaConfig.logger) != null ? _b : console,
      parallelDownloads: wllamaConfig.parallelDownloads,
      allowOffline: wllamaConfig.allowOffline
    });
    this.setCompat("default");
  }
  logger() {
    var _a;
    return (_a = this.config.logger) != null ? _a : console;
  }
  checkModelLoaded() {
    if (!this.isModelLoaded()) {
      throw new WllamaError(
        "loadModel() is not yet called",
        "model_not_loaded"
      );
    }
  }
  /**
   * Get the libllama version string, e.g. "b6327-4d74393".
   *
   * @returns version string embedded at build time.
   */
  static getLibllamaVersion() {
    return LIBLLAMA_VERSION;
  }
  /**
   * Set compatibility options for Wllama.
   * @param compat Set to null to disable compatibility, or 'default' to use the default compat resources from CDN.
   * @param mode 'safari' by default; If set to 'firefox_safari', the compat mode will **also** be enabled on Firefox, which will significantly degrade the performance but allow using WebGPU on Firefox.
   */
  setCompat(compat, mode = "safari") {
    if (mode === "safari") {
      if (isFirefox()) {
        this.compat = null;
        return;
      }
    }
    this.compat = compat === "default" ? WasmCompatFromCDN : compat;
  }
  /**
   * Check if the model is loaded via `loadModel()`
   */
  isModelLoaded() {
    return !!this.proxy && !!this.metadata;
  }
  /**
   * Get token ID associated to BOS (begin of sentence) token.
   *
   * NOTE: This can only being used after `loadModel` is called.
   *
   * @returns -1 if the model is not loaded.
   */
  getBOS() {
    return this.bosToken;
  }
  /**
   * Get token ID associated to EOS (end of sentence) token.
   *
   * NOTE: This can only being used after `loadModel` is called.
   *
   * @returns -1 if the model is not loaded.
   */
  getEOS() {
    return this.eosToken;
  }
  /**
   * Get token ID associated to EOT (end of turn) token.
   *
   * NOTE: This can only being used after `loadModel` is called.
   *
   * @returns -1 if the model is not loaded.
   */
  getEOT() {
    return this.eotToken;
  }
  /**
   * Check if a given token is end-of-generation token (e.g. EOS, EOT, etc.)
   *
   * @param token the token ID to be checked
   * @returns true if the token is EOS, EOT, or any other end-of-generation tokens
   */
  isTokenEOG(token) {
    return token === this.eosToken || token === this.eotToken || this.eogTokens.has(token);
  }
  /**
   * Get token ID associated to token used by decoder, to start generating output sequence(only usable for encoder-decoder architecture). In other words, encoder uses normal BOS and decoder uses this token.
   *
   * NOTE: This can only being used after `loadModel` is called.
   *
   * @returns -1 if the model is not loaded.
   */
  getDecoderStartToken() {
    return this.decoderStartToken;
  }
  /**
   * Get model hyper-parameters and metadata
   *
   * NOTE: This can only being used after `loadModel` is called.
   *
   * @returns ModelMetadata
   */
  getModelMetadata() {
    this.checkModelLoaded();
    return this.metadata;
  }
  /**
   * Check if we're currently using multi-thread build.
   *
   * NOTE: This can only being used after `loadModel` is called.
   *
   * @returns true if multi-thread is used.
   */
  isMultithread() {
    this.checkModelLoaded();
    return this.useMultiThread;
  }
  /**
   * Get number of threads used in the current context.
   *
   * NOTE: This can only being used after `loadModel` is called.
   *
   * @returns number of threads
   */
  getNumThreads() {
    this.checkModelLoaded();
    return this.useMultiThread ? this.nbThreads : 1;
  }
  /**
   * Check if the current model uses encoder-decoder architecture
   *
   * NOTE: This can only being used after `loadModel` is called.
   *
   * @returns true if multi-thread is used.
   */
  isEncoderDecoderArchitecture() {
    this.checkModelLoaded();
    return this.hasEncoder;
  }
  /**
   * Must we add BOS token to the tokenized sequence?
   *
   * NOTE: This can only being used after `loadModel` is called.
   *
   * @returns true if BOS token must be added to the sequence
   */
  mustAddBosToken() {
    this.checkModelLoaded();
    return this.addBosToken;
  }
  /**
   * Must we add EOS token to the tokenized sequence?
   *
   * NOTE: This can only being used after `loadModel` is called.
   *
   * @returns true if EOS token must be added to the sequence
   */
  mustAddEosToken() {
    this.checkModelLoaded();
    return this.addEosToken;
  }
  /**
   * Get the jinja chat template comes with the model. It only available if the original model (before converting to gguf) has the template in `tokenizer_config.json`
   *
   * NOTE: This can only being used after `loadModel` is called.
   *
   * @returns the jinja template. null if there is no template in gguf
   */
  getChatTemplate() {
    var _a;
    this.checkModelLoaded();
    return (_a = this.chatTemplate) != null ? _a : null;
  }
  /**
   * Check if WebGPU is supported by the current environment.
   * @returns true if WebGPU is supported
   */
  isSupportWebGPU() {
    return isSupportWebGPU();
  }
  /**
   * Load model from a given URL (or a list of URLs, in case the model is splitted into smaller files)
   * - If the model already been downloaded (via `downloadModel()`), then we will use the cached model
   * - Else, we download the model from internet
   * @param modelSourceOrURL
   * @param params
   */
  loadModelFromUrl(_0) {
    return __async(this, arguments, function* (modelSourceOrURL, params = {}) {
      var _a;
      const source = isString(modelSourceOrURL) ? { url: modelSourceOrURL } : modelSourceOrURL;
      const useCache = (_a = params.useCache) != null ? _a : true;
      const model = useCache ? yield this.modelManager.getModelOrDownload(source, params) : yield this.modelManager.downloadModel(source, params);
      const blobs = yield model.open();
      return yield this.loadModel(blobs, params);
    });
  }
  /**
   * Load model from a given Hugging Face model ID and file path.
   *
   * @param hfOptions
   * @param params
   */
  loadModelFromHF(_0) {
    return __async(this, arguments, function* (hfOptions, params = {}) {
      const source = yield getHFModelSource(hfOptions);
      return yield this.loadModelFromUrl(source, params);
    });
  }
  /**
   * Load model from a given list of Blob.
   *
   * You can pass multiple buffers into the function (in case the model contains multiple shards).
   *
   * @param ggufBlobsOrModel Can be either list of Blobs (in case you use local file), or a Model object (in case you use ModelManager)
   * @param params LoadModelParams
   */
  loadModel(_0) {
    return __async(this, arguments, function* (ggufBlobsOrModel, params = {}) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i;
      const blobs = ggufBlobsOrModel instanceof Model ? yield ggufBlobsOrModel.open() : [...ggufBlobsOrModel];
      if (blobs.some((b) => b.size === 0)) {
        throw new WllamaError(
          "Input model (or splits) must be non-empty Blob or File",
          "load_error"
        );
      }
      if (!this.pathConfig["default"]) {
        throw new WllamaError(
          '"default" is missing from pathConfig',
          "load_error"
        );
      }
      if (this.proxy) {
        throw new WllamaError("Module is already initialized", "load_error");
      }
      const supportMultiThread = yield isSupportMultiThread();
      const hwConccurency = Math.floor((navigator.hardwareConcurrency || 1) / 2);
      const nbThreads = (_a = params.n_threads) != null ? _a : hwConccurency;
      this.nbThreads = nbThreads;
      this.useMultiThread = supportMultiThread && nbThreads > 1;
      const workerResources = this.getWorkerResources();
      this.proxy = new ProxyToWorker(
        workerResources,
        this.useMultiThread ? nbThreads : 0,
        // 0 means disable pthread
        (_b = this.config.suppressNativeLog) != null ? _b : false,
        this.logger()
      );
      let logLevel = (_c = params.log_level) != null ? _c : 2 /* INFO */;
      if (this.config.suppressNativeLog) {
        logLevel = 9999;
      }
      const modelFiles = yield prepareBlobs(blobs);
      yield this.proxy.moduleInit(modelFiles.all);
      this.logger().debug("Calling wllamaStart...");
      const startResult = yield this.proxy.wllamaStart();
      if (!startResult.success) {
        throw new WllamaError(
          `Error while calling start function, result = ${startResult}`
        );
      }
      this.logger().debug("Loading model...");
      const loadResult = yield this.proxy.wllamaAction("load", {
        _name: "load_req",
        log_level: logLevel,
        // if async read is not supported, use mmap; refer to README-dev.md for more details
        use_mmap: !canUseAsyncFileRead(workerResources.compat),
        use_mlock: false,
        n_gpu_layers: (_d = params.n_gpu_layers) != null ? _d : 99999,
        n_ctx: (_e = params.n_ctx) != null ? _e : 1024,
        n_threads: this.useMultiThread ? nbThreads : 1,
        n_ctx_auto: false,
        // not supported for now
        mmproj_path: modelFiles.mmproj ? `/models/${MMPROJ_FILE_NAME}` : void 0,
        model_paths: modelFiles.llm.map((f) => `models/${f.name}`),
        embeddings: params.embeddings,
        offload_kqv: params.offload_kqv,
        n_batch: params.n_batch,
        pooling_type: params.pooling_type,
        rope_scaling_type: params.rope_scaling_type,
        rope_freq_base: params.rope_freq_base,
        rope_freq_scale: params.rope_freq_scale,
        yarn_ext_factor: params.yarn_ext_factor,
        yarn_attn_factor: params.yarn_attn_factor,
        yarn_beta_fast: params.yarn_beta_fast,
        yarn_beta_slow: params.yarn_beta_slow,
        yarn_orig_ctx: params.yarn_orig_ctx,
        cache_type_k: params.cache_type_k,
        cache_type_v: params.cache_type_v,
        n_parallel: (_f = params.n_parallel) != null ? _f : 1,
        kv_unified: false,
        // TODO: support kv unified cache
        flash_attn: params.flash_attn,
        swa_full: params.swa_full,
        chat_template: params.chat_template,
        jinja: params.jinja,
        reasoning: params.reasoning,
        image_min_tokens: params.image_min_tokens,
        image_max_tokens: params.image_max_tokens,
        warmup: params.warmup,
        no_kv_offload: params.no_kv_offload,
        mmproj_offload: params.mmproj_offload,
        cont_batching: params.cont_batching,
        n_keep: params.n_keep,
        ctx_shift: params.ctx_shift,
        cache_idle_slots: params.cache_idle_slots,
        n_cache_reuse: params.n_cache_reuse,
        lora_paths: (_g = params.lora_adapters) == null ? void 0 : _g.map((a) => a.path),
        lora_scales: (_h = params.lora_adapters) == null ? void 0 : _h.map((a) => {
          var _a2;
          return (_a2 = a.scale) != null ? _a2 : 1;
        }),
        lora_init_without_apply: params.lora_init_without_apply,
        spec_draft_model: params.spec_draft_model,
        spec_draft_ngl: params.spec_draft_ngl,
        spec_draft_n_max: params.spec_draft_n_max,
        spec_draft_n_min: params.spec_draft_n_min,
        spec_draft_p_min: params.spec_draft_p_min,
        spec_draft_threads: params.spec_draft_threads,
        spec_draft_threads_batch: params.spec_draft_threads_batch,
        kv_overrides_keys: params.kv_overrides ? Object.keys(params.kv_overrides) : void 0,
        kv_overrides_vals: params.kv_overrides ? Object.values(params.kv_overrides) : void 0,
        reasoning_budget_tokens: params.reasoning_budget_tokens,
        reasoning_budget_message: params.reasoning_budget_message,
        reasoning_format: params.reasoning_format,
        skip_chat_parsing: params.skip_chat_parsing,
        prefill_assistant: params.prefill_assistant
      });
      const loadedCtxInfo = __spreadProps(__spreadValues({}, loadResult), {
        metadata: {}
      });
      for (let i = 0; i < loadResult.metadata_key.length; i++) {
        loadedCtxInfo.metadata[loadResult.metadata_key[i]] = loadResult.metadata_val[i];
      }
      this.seed = params.seed;
      this.bosToken = loadedCtxInfo.token_bos;
      this.eosToken = loadedCtxInfo.token_eos;
      this.eotToken = loadedCtxInfo.token_eot;
      this.useEmbeddings = !!params.embeddings;
      this.useRerank = params.pooling_type == "rank";
      this.metadata = {
        hparams: {
          nVocab: loadedCtxInfo.n_vocab,
          nCtxTrain: loadedCtxInfo.n_ctx_train,
          nEmbd: loadedCtxInfo.n_embd,
          nLayer: loadedCtxInfo.n_layer
        },
        meta: loadedCtxInfo.metadata
      };
      this.hasEncoder = !!loadedCtxInfo.has_encoder;
      this.decoderStartToken = loadedCtxInfo.token_decoder_start;
      this.addBosToken = loadedCtxInfo.add_bos_token;
      this.addEosToken = loadedCtxInfo.add_eos_token;
      this.chatTemplate = loadedCtxInfo.metadata["tokenizer.chat_template"];
      this.loadedContextInfo = loadedCtxInfo;
      this.eogTokens = new Set(loadedCtxInfo.list_tokens_eog);
      this.mediaMarker = loadedCtxInfo.media_marker;
      this.chatTemplateKwargs = (_i = params.default_template_kwargs) != null ? _i : {};
      this.logger().debug({ loadedCtxInfo });
    });
  }
  getLoadedContextInfo() {
    this.checkModelLoaded();
    if (!this.loadedContextInfo) {
      throw new WllamaError("Loaded context info is not available");
    }
    return __spreadValues({}, this.loadedContextInfo);
  }
  //////////////////////////////////////////////
  // High level API
  /**
   * Calculate embedding vector for a given text.
   * By default, BOS and EOS tokens will be added automatically. You can use the "skipBOS" and "skipEOS" option to disable it.
   * @param options OAI-compatible embedding creation options
   * @returns OAI-compatible embedding response
   */
  createEmbedding(options) {
    return __async(this, null, function* () {
      this.checkModelLoaded();
      if (!this.useEmbeddings) {
        throw new WllamaError(
          "Embeddings is not enabled. Please set it via LoadModelParams.embeddings"
        );
      }
      const result = yield this.proxy.wllamaAction(
        "embedding",
        {
          _name: "embd_req",
          data_json: JSON.stringify(options),
          files: []
          // TODO: support file input
        }
      );
      if (!result.success) {
        throw new WllamaError(
          "Model failed to start inference",
          "inference_error"
        );
      }
      return yield this.getResponse(options, false, result.request_id);
    });
  }
  /**
   * Rerank a list of documents against a query.
   * Requires the model to be loaded with embeddings: true and pooling_type: 'rank'.
   * @param options Reranking options (query, documents, top_n)
   * @returns Reranking response with relevance scores sorted highest first
   */
  createRerank(options) {
    return __async(this, null, function* () {
      var _a, _b;
      this.checkModelLoaded();
      if (!this.useEmbeddings || !this.useRerank) {
        throw new WllamaError(
          "Rerank is not enabled. Please set it via LoadModelParams: embeddings = true and pooling_type = rank"
        );
      }
      const top_n = (_a = options.top_n) != null ? _a : options.documents.length;
      let totalTokens = 0;
      const rawResults = [];
      for (let i = 0; i < options.documents.length; i++) {
        const result = yield this.proxy.wllamaAction("rerank", {
          _name: "rrnk_req",
          data_json: JSON.stringify({
            query: options.query,
            document: options.documents[i]
          })
        });
        if (!result.success) {
          throw new WllamaError(
            "Model failed to start reranking",
            "inference_error"
          );
        }
        const { score, tokens_evaluated } = yield this.getRerankResult(
          result.request_id
        );
        totalTokens += tokens_evaluated;
        rawResults.push({ index: i, score });
      }
      rawResults.sort((a, b) => b.score - a.score);
      return {
        model: (_b = this.getModelMetadata().meta["general.name"]) != null ? _b : "",
        object: "list",
        usage: { prompt_tokens: totalTokens, total_tokens: totalTokens },
        results: rawResults.slice(0, top_n).map(({ index, score }) => ({
          index,
          relevance_score: score
        }))
      };
    });
  }
  createChatCompletion(options) {
    return __async(this, null, function* () {
      var _a;
      if (Object.keys(this.chatTemplateKwargs).length > 0) {
        options = __spreadProps(__spreadValues({}, options), {
          chat_template_kwargs: __spreadValues(__spreadValues({}, this.chatTemplateKwargs), (_a = options.chat_template_kwargs) != null ? _a : {})
        });
      }
      if (options.stream && options.onData) {
        yield this.createCompletionImpl(options);
      } else if (options.stream) {
        return yield this.createCompletionGenerator(options);
      } else {
        return yield this.createCompletionImpl(__spreadProps(__spreadValues({}, options), { stream: false }));
      }
    });
  }
  createCompletion(options) {
    return __async(this, null, function* () {
      if (options.stream && options.onData) {
        yield this.createCompletionImpl(options);
      } else if (options.stream) {
        return yield this.createCompletionGenerator(options);
      } else {
        return yield this.createCompletionImpl(__spreadProps(__spreadValues({}, options), { stream: false }));
      }
    });
  }
  /**
   * Private implementation of createCompletion
   */
  createCompletionImpl(options) {
    return __async(this, null, function* () {
      this.checkModelLoaded();
      const isStream = !!options.stream;
      const isChat = !!options.messages;
      const customOpt = {};
      if (this.seed !== void 0) {
        customOpt.seed = this.seed;
      }
      let files = [];
      if (isChat) {
        const tmp = this.prepareMultimodalInput(
          options
        );
        options = tmp.params;
        files = tmp.files;
      }
      const result = yield this.proxy.wllamaAction(
        "completion",
        {
          _name: "cmpl_req",
          is_chat: isChat,
          data_json: JSON.stringify(__spreadValues(__spreadValues({}, options), customOpt)),
          files: files.map((f) => new Uint8Array(f))
        }
      );
      if (!result.success) {
        throw new WllamaError(
          "Model failed to start inference",
          "inference_error"
        );
      }
      return yield this.getResponse(
        options,
        isStream,
        result.request_id
      );
    });
  }
  /**
   * Same with `createCompletion`, but returns an async iterator instead.
   * Only called when stream=true and no onData is provided.
   */
  createCompletionGenerator(options) {
    return new Promise((resolve) => {
      const createGenerator = cbToAsyncIter(
        (callback) => {
          this.createCompletionImpl(__spreadProps(__spreadValues({}, options), {
            onData: (chunk) => callback(chunk)
          })).then(() => callback(void 0, true)).catch((err) => callback(void 0, false, err));
        }
      );
      resolve(createGenerator());
    });
  }
  /**
   * Whether the currently loaded model supports a specific input modality (e.g. image or audio).
   * @param modality
   * @returns
   */
  supportInputModality(modality) {
    this.checkModelLoaded();
    if (modality === "image") {
      return !!this.loadedContextInfo.has_image_input;
    } else if (modality === "audio") {
      return !!this.loadedContextInfo.has_audio_input;
    } else {
      throw new WllamaError(
        "Unsupported modality: " + modality,
        "unknown_error"
      );
    }
  }
  /**
   * Unload the model and free all memory.
   *
   * Note: This function will NOT crash if model is not yet loaded
   */
  exit() {
    return __async(this, null, function* () {
      var _a;
      yield (_a = this.proxy) == null ? void 0 : _a.wllamaExit();
      this.proxy = null;
    });
  }
  /**
   * [FOR DEBUGGING ONLY] Run ggml backend ops tests without loading any model.
   *
   * Initializes the wasm runtime, executes `test-backend-ops` with the given args, then shuts down.
   *
   * For more info, please refer to guides/debug.md
   *
   * @param args Arguments forwarded to test-backend-ops (e.g. ["-o", "ADD"])
   * @returns retcode (0 = all tests passed) and success flag
   */
  testBackendOps() {
    return __async(this, arguments, function* (args = []) {
      var _a;
      if (!this.pathConfig["default"]) {
        throw new WllamaError(
          '"default" is missing from pathConfig',
          "load_error"
        );
      }
      if (!(yield isSupportMultiThread())) {
        throw new WllamaError(
          "Multi-threading is required to run backend ops tests, but it is not supported in the current environment."
        );
      }
      const tmpProxy = new ProxyToWorker(
        this.getWorkerResources(),
        0,
        // single-thread; no model needed
        (_a = this.config.suppressNativeLog) != null ? _a : false,
        this.logger()
      );
      try {
        yield tmpProxy.moduleInit([]);
        const startResult = yield tmpProxy.wllamaStart();
        if (!startResult.success) {
          throw new WllamaError(
            `Error while calling start function, result = ${startResult}`
          );
        }
        const result = yield tmpProxy.wllamaAction(
          "test_backend_ops",
          { _name: "tbop_req", args: ["test-backend-ops", ...args] }
        );
        return { retcode: result.retcode, success: result.success };
      } finally {
        yield tmpProxy.wllamaExit();
      }
    });
  }
  //////////////////////////////////////////////
  // Low level API
  // TODO: add back
  /**
   * get debug info
   */
  _getDebugInfo() {
    return __async(this, null, function* () {
      this.checkModelLoaded();
      return yield this.proxy.wllamaDebug();
    });
  }
  //////////////////////////////////////////////
  // Utils
  jsonDecode(data_json) {
    try {
      return JSON.parse(data_json);
    } catch (e) {
      this.logger().error("Failed to parse JSON:", data_json);
      throw new WllamaError("Failed to parse model output", "inference_error");
    }
  }
  prepareMultimodalInput(params) {
    const msg = params.messages;
    const msgNew = [];
    const files = [];
    for (const m of msg) {
      if (Array.isArray(m.content)) {
        const newContent = [];
        for (const c of m.content) {
          if (c.type === "text") {
            newContent.push(c);
          } else {
            if (!this.mediaMarker) {
              throw new WllamaError(
                "Media marker is undefined",
                "inference_error"
              );
            }
            files.push(c.data);
            newContent.push({
              type: "text",
              text: this.mediaMarker
            });
          }
        }
        msgNew.push(__spreadProps(__spreadValues({}, m), {
          content: newContent
        }));
      } else {
        msgNew.push(m);
      }
    }
    return {
      params: __spreadProps(__spreadValues({}, params), {
        messages: msgNew
      }),
      files
    };
  }
  getRerankResult(requestId) {
    return __async(this, null, function* () {
      while (true) {
        const chunk = yield this.proxy.wllamaAction(
          "get_result",
          { _name: "gres_req", request_id: requestId }
        );
        const jsonString = chunk.data_json;
        if (jsonString && jsonString.length > 0) {
          if (chunk.is_error) {
            const jsonData = this.jsonDecode(jsonString);
            throw new WllamaError(
              jsonData.message || "Unknown reranking error",
              "inference_error"
            );
          }
          return this.jsonDecode(jsonString);
        }
        if (!chunk.has_more) break;
      }
      throw new WllamaError("No reranking result received", "inference_error");
    });
  }
  getResponse(options, isStream, requestId) {
    return __async(this, null, function* () {
      var _a, _b;
      let finalResult = null;
      let shouldReleaseReader = true;
      try {
        while (true) {
          if ((_a = options.abortSignal) == null ? void 0 : _a.aborted) {
            throw new WllamaAbortError();
          }
          const result_chunk = yield this.proxy.wllamaAction(
            "get_result",
            {
              _name: "gres_req",
              request_id: requestId
            }
          );
          const jsonString = result_chunk.data_json;
          if (!jsonString || jsonString.length === 0) {
            if (!result_chunk.has_more) {
              break;
            } else {
              continue;
            }
          }
          if (jsonString == "null") {
            continue;
          }
          let jsonData = this.jsonDecode(jsonString);
          finalResult = jsonData;
          if (result_chunk.is_error) {
            this.logger().error("Model returned an error:", jsonData);
            throw new WllamaError(
              jsonData.message || "Unknown inference error",
              "inference_error"
            );
          }
          if (isStream) {
            if (!Array.isArray(jsonData)) {
              jsonData = [jsonData];
            }
            for (const chunk of jsonData) {
              (_b = options.onData) == null ? void 0 : _b.call(options, chunk);
              finalResult = chunk;
            }
          }
          if (!result_chunk.has_more) {
            shouldReleaseReader = false;
            break;
          }
        }
        return finalResult;
      } finally {
        if (shouldReleaseReader) {
          yield this.proxy.wllamaAction(
            "release_result_reader",
            {
              _name: "grrr_req",
              request_id: requestId
            }
          ).catch(() => {
          });
        }
      }
    });
  }
  getWorkerResources() {
    const workerResources = {
      wasmPath: absoluteUrl(this.pathConfig["default"]),
      compat: false
    };
    if (needCompat()) {
      if (!this.compat) {
        this.logger().warn(
          "Not using compat mode" + (isFirefox() ? " (expected on Firefox - WebGPU will be disabled)" : "")
        );
      } else {
        const isUsingDefault = this.compat.worker === WasmCompatFromCDN.worker && this.compat.wasm === WasmCompatFromCDN.wasm;
        if (isUsingDefault) {
          this.logger().warn(
            "Compatibility mode is activated, using resources from CDN. To use local resources, please refer to @wllama/wllama-compat package."
          );
          this.logger().warn(
            "IMPORTANT: Performance will be significantly degraded in compatibility mode."
          );
        }
        workerResources.wasmPath = absoluteUrl(this.compat.wasm);
        workerResources.jsPath = this.compat.worker;
        workerResources.compat = true;
      }
    }
    if (isFirefox()) {
      if (workerResources.compat) {
        this.logger().warn(
          'Using compat mode on Firefox, performance will be significantly degraded; Consider enabling "javascript.options.wasm_js_promise_integration" in "about:config".'
        );
      } else if (!isSupportJSPI()) {
        this.logger().warn(
          'WebGPU is disabled on Firefox due to missing JSPI support. Please consider enabling compat mode, or enabling "javascript.options.wasm_js_promise_integration" in "about:config".'
        );
      }
    }
    return workerResources;
  }
};
export {
  CacheManager,
  LogLevel,
  LoggerWithoutDebug,
  Model,
  ModelManager,
  ModelValidationStatus,
  POLYFILL_ETAG,
  Wllama,
  WllamaAbortError,
  WllamaError,
  WllamaRuntimeError,
  getHFModelSource,
  isValidGgufFile
};
