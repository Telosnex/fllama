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
var LIBLLAMA_VERSION = "b9553-9e3b928";
var LLAMA_CPP_WORKER_CODE = "// Start the main llama.cpp\nlet wllamaMalloc;\nlet wllamaStart;\nlet wllamaAction;\nlet wllamaExit;\nlet wllamaDebug;\n\nlet Module = null;\nlet isCompat = false;\nlet lastStack = '';\nlet isAborted = false;\nlet hasMultithread = false;\n\n//////////////////////////////////////////////////////////////\n// UTILS\n//////////////////////////////////////////////////////////////\n\n// send message back to main thread\nconst msg = (data, transfer) => postMessage(data, transfer);\n\n// Convert CPP log into JS log\nconst cppLogToJSLog = (line) => {\n  const matched = line.match(/@@(DEBUG|INFO|WARN|ERROR)@@(.*)/);\n  return !!matched\n    ? {\n        level: (matched[1] === 'INFO' ? 'debug' : matched[1]).toLowerCase(),\n        text: matched[2],\n      }\n    : { level: 'log', text: line };\n};\n\nconst getHeapU8 = () => {\n  const buffer = Module.wasmMemory.buffer;\n  return new Uint8Array(buffer);\n};\n\nconst toSizeT = (num) => {\n  return isCompat ? Number(num) : BigInt(num);\n};\n\n// Get module config that forwards stdout/err to main thread\nconst getWModuleConfig = (_argMainScriptBlob) => {\n  var pathConfig = RUN_OPTIONS.pathConfig;\n  var pthreadPoolSize = RUN_OPTIONS.nbThread;\n  var argMainScriptBlob = _argMainScriptBlob;\n\n  isCompat = RUN_OPTIONS.compat;\n  hasMultithread = pthreadPoolSize > 1;\n\n  msg({\n    verb: 'console.debug',\n    args: [\n      `Multithread enabled: ${hasMultithread}, pthreadPoolSize: ${pthreadPoolSize}`,\n    ],\n  });\n\n  if (!pathConfig['wllama.wasm']) {\n    throw new Error('\"wllama.wasm\" is missing in pathConfig');\n  }\n  return {\n    noInitialRun: true,\n    print: function (text) {\n      if (arguments.length > 1)\n        text = Array.prototype.slice.call(arguments).join(' ');\n      msg({ verb: 'console.log', args: [text] });\n    },\n    printErr: function (text) {\n      if (arguments.length > 1)\n        text = Array.prototype.slice.call(arguments).join(' ');\n      if (text.startsWith('@@STACK@@')) {\n        lastStack = text.slice('@@STACK@@'.length);\n        return;\n      }\n      const logLine = cppLogToJSLog(text);\n      msg({ verb: 'console.' + logLine.level, args: [logLine.text] });\n    },\n    locateFile: function (filename, basePath) {\n      const p = pathConfig[filename];\n      const truncate = (str) =>\n        str.length > 128 ? `${str.substr(0, 128)}...` : str;\n      if (filename.match(/wllama\\.worker\\.js/)) {\n        msg({\n          verb: 'console.error',\n          args: [\n            '\"wllama.worker.js\" is removed from v2.2.1. Hint: make sure to clear browser\\'s cache.',\n          ],\n        });\n      } else {\n        msg({\n          verb: 'console.debug',\n          args: [`Loading \"${filename}\" from \"${truncate(p)}\"`],\n        });\n        return p;\n      }\n    },\n    mainScriptUrlOrBlob: hasMultithread\n      ? argMainScriptBlob\n      : 'throw new Error(\"Multithreading is not enabled\")',\n    pthreadPoolSize: hasMultithread ? pthreadPoolSize : 0,\n    wasmMemory: hasMultithread ? getWasmMemory() : null,\n    onAbort: function (message) {\n      isAborted = true;\n      msg({ verb: 'signal.abort', args: ['abort', message, lastStack, null] });\n    },\n    onExit: function (code) {\n      isAborted = true;\n      const callstack = new Error().stack.toString();\n      msg({\n        verb: 'signal.abort',\n        args: ['abort', 'exit(' + code + ')', callstack, null],\n      });\n    },\n  };\n};\n\n// Get the memory to be used by wasm. (Only used in multi-thread mode)\n// Because we have a weird OOM issue on iOS, we need to try some values\n// See: https://github.com/emscripten-core/emscripten/issues/19144\n//      https://github.com/godotengine/godot/issues/70621\nconst getWasmMemory = () => {\n  let minBytes = 128 * 1024 * 1024;\n  let maxBytes = 4096 * 1024 * 1024;\n  let stepBytes = 128 * 1024 * 1024;\n  while (maxBytes > minBytes) {\n    try {\n      const wasmMemory = new WebAssembly.Memory({\n        initial: toSizeT(minBytes / 65536),\n        maximum: toSizeT(maxBytes / 65536),\n        shared: true,\n        address: isCompat ? undefined : 'i64',\n      });\n      return wasmMemory;\n    } catch (e) {\n      maxBytes -= stepBytes;\n      continue; // retry\n    }\n  }\n  throw new Error('Cannot allocate WebAssembly.Memory');\n};\n\n//////////////////////////////////////////////////////////////\n// HEAPFS PATCH\n//////////////////////////////////////////////////////////////\n\n/**\n * By default, emscripten uses memfs. The way it works is by\n * allocating new Uint8Array in javascript heap. This is not good\n * because it requires files to be copied to wasm heap each time\n * a file is read.\n *\n * HeapFS is an alternative, which resolves this problem by\n * allocating space for file directly inside wasm heap. This\n * allows us to mmap without doing any copy.\n *\n * For llama.cpp, this is great because we use MAP_SHARED\n *\n * Ref: https://github.com/ngxson/wllama/pull/39\n * Ref: https://github.com/emscripten-core/emscripten/blob/main/src/library_memfs.js\n *\n * Note 29/05/2024 @ngxson\n * Due to ftell() being limited to MAX_LONG, we cannot load files bigger than 2^31 bytes (or 2GB)\n * Ref: https://github.com/emscripten-core/emscripten/blob/main/system/lib/libc/musl/src/stdio/ftell.c\n */\n\nconst fsNameToFile = {}; // map Name => File\nconst fsIdToFile = {}; // map ID => File\nlet currFileId = 0;\n\n// Patch and redirect memfs calls to wllama\nconst patchHeapFS = () => {\n  const m = Module;\n  // save functions\n  m.MEMFS.stream_ops._read = m.MEMFS.stream_ops.read;\n  m.MEMFS.stream_ops._write = m.MEMFS.stream_ops.write;\n  m.MEMFS.stream_ops._llseek = m.MEMFS.stream_ops.llseek;\n  m.MEMFS.stream_ops._allocate = m.MEMFS.stream_ops.allocate;\n  m.MEMFS.stream_ops._mmap = m.MEMFS.stream_ops.mmap;\n  m.MEMFS.stream_ops._msync = m.MEMFS.stream_ops.msync;\n\n  const patchStream = (stream) => {\n    const name = stream.node.name;\n    if (fsNameToFile[name]) {\n      const f = fsNameToFile[name];\n      const ptr = Number(f.ptr);\n      stream.node.contents = getHeapU8().subarray(ptr, ptr + f.size);\n      stream.node.usedBytes = f.size;\n    }\n  };\n\n  // replace \"read\" functions\n  m.MEMFS.stream_ops.read = function (\n    stream,\n    buffer,\n    offset,\n    length,\n    position\n  ) {\n    patchStream(stream);\n    return m.MEMFS.stream_ops._read(stream, buffer, offset, length, position);\n  };\n  m.MEMFS.ops_table.file.stream.read = m.MEMFS.stream_ops.read;\n\n  // replace \"llseek\" functions\n  m.MEMFS.stream_ops.llseek = function (stream, offset, whence) {\n    patchStream(stream);\n    return m.MEMFS.stream_ops._llseek(stream, offset, whence);\n  };\n  m.MEMFS.ops_table.file.stream.llseek = m.MEMFS.stream_ops.llseek;\n\n  // replace \"mmap\" functions\n  m.MEMFS.stream_ops.mmap = function (stream, length, position, prot, flags) {\n    patchStream(stream);\n    const name = stream.node.name;\n    if (fsNameToFile[name]) {\n      const f = fsNameToFile[name];\n      const mmapPtr = f.ptr + toSizeT(position);\n      return {\n        ptr: mmapPtr,\n        allocated: false,\n      };\n    } else {\n      return m.MEMFS.stream_ops._mmap(stream, length, position, prot, flags);\n    }\n  };\n  m.MEMFS.ops_table.file.stream.mmap = m.MEMFS.stream_ops.mmap;\n\n  // mount FS\n  m.FS.mkdir('/models');\n  m.FS.mount(m.MEMFS, { root: '.' }, '/models');\n};\n\n// Allocate a new file in wllama heapfs, returns file ID\nconst heapfsAlloc = (name, size, allocBuffer) => {\n  if (size < 1) {\n    throw new Error('File size must be bigger than 0');\n  }\n  const m = Module;\n  const ptr = toSizeT(allocBuffer ? m.mmapAlloc(size) : 0);\n  const file = {\n    ptr: ptr,\n    size: size,\n    id: currFileId++,\n  };\n  fsIdToFile[file.id] = file;\n  fsNameToFile[name] = file;\n  return file.id;\n};\n\n// Add new file to wllama heapfs, return number of written bytes\nconst heapfsWrite = (id, buffer, offset) => {\n  if (fsIdToFile[id]) {\n    const { ptr, size } = fsIdToFile[id];\n    const afterWriteByte = offset + buffer.byteLength;\n    if (afterWriteByte > size) {\n      throw new Error(\n        `File ID ${id} write out of bound, afterWriteByte = ${afterWriteByte} while size = ${size}`\n      );\n    }\n    getHeapU8().set(buffer, Number(ptr) + offset);\n    return buffer.byteLength;\n  } else {\n    throw new Error(`File ID ${id} not found in heapfs`);\n  }\n};\n\n//////////////////////////////////////////////////////////////\n// ASYNC FILE READ\n//////////////////////////////////////////////////////////////\n\nlet isAwaitReading = false;\nlet pendingReadPromise = null;\nlet pendingReadResolve = null;\nlet pendingReadReject = null;\n\nconst _stripModelsPrefix = (path) => path.replace(/^\\/?models\\//, '');\n\n// Called from EM_ASYNC_JS stub in wllama-fs.h (path is already a JS string)\nconst _wllama_js_file_read = async (path, offset, req_size, out_ptr) => {\n  const name = _stripModelsPrefix(path);\n\n  pendingReadPromise = new Promise((res, rej) => {\n    pendingReadResolve = res;\n    pendingReadReject = rej;\n  });\n  isAwaitReading = true;\n\n  postMessage({ verb: 'fs.read_req', args: [name, offset, req_size] });\n\n  let data;\n  try {\n    data = await pendingReadPromise;\n  } finally {\n    isAwaitReading = false;\n    pendingReadResolve = null;\n    pendingReadReject = null;\n  }\n\n  const bytes = new Uint8Array(data);\n  getHeapU8().set(bytes, out_ptr);\n  return toSizeT(bytes.length);\n};\n\n//////////////////////////////////////////////////////////////\n// MAIN CODE\n//////////////////////////////////////////////////////////////\n\nconst callWrapper = (name, ret, args, isAsync) => {\n  const fn = Module.cwrap(\n    name,\n    ret,\n    args,\n    isAsync ? { async: true } : undefined\n  );\n  return async (action, req) => {\n    // console.log(`Calling ${name} with action:`, action, 'and req:', req);\n    let result;\n    try {\n      if (args.length === 2) {\n        result = isAsync ? await fn(action, req) : fn(action, req);\n      } else {\n        result = fn();\n      }\n    } catch (ex) {\n      console.error(ex);\n      throw ex;\n    }\n    return result;\n  };\n};\n\nfunction handleError(err) {\n  // If WASM already aborted, onAbort already sent signal.abort; skip to avoid\n  // re-reporting the resulting WebAssembly.RuntimeError as a JS exception.\n  if (isAborted) return;\n\n  const message = err ? err.message || String(err) : 'Unknown error';\n  const stack = err ? err.stack || String(err) : '';\n  msg({\n    verb: 'signal.abort',\n    args: ['exception', message, stack, err],\n  });\n}\n\nonmessage = async (e) => {\n  if (!e.data) return;\n  const { verb, args, callbackId } = e.data;\n\n  // fs.read_res arrives while wasm is JSPI-suspended; resolve the pending promise.\n  if (verb === 'fs.read_res') {\n    if (pendingReadResolve) {\n      pendingReadResolve(args[0]);\n    }\n    return;\n  }\n\n  // Guard: while awaiting a file read, reject any other incoming task.\n  if (isAwaitReading) {\n    if (callbackId) {\n      msg({\n        callbackId,\n        err: 'Worker is suspended waiting for file data (JSPI)',\n      });\n    }\n    return;\n  }\n\n  if (!callbackId) {\n    msg({ verb: 'console.error', args: ['callbackId is required', e.data] });\n    return;\n  }\n\n  if (verb === 'module.init') {\n    const argMainScriptBlob = args[0];\n    const argUseAsyncFile = args[1];\n    try {\n      Module = getWModuleConfig(argMainScriptBlob);\n      Module.preRun = () => {\n        if (argUseAsyncFile) {\n          Module.ENV['USE_ASYNC_FILE'] = '1';\n        }\n      };\n      Module.onRuntimeInitialized = () => {\n        // async call once module is ready\n        // init FS\n        patchHeapFS();\n        // init cwrap\n        const pointer = isCompat ? 'number' : 'bigint';\n        // TODO: note sure why emscripten cannot bind if there is only 1 argument\n        wllamaMalloc = callWrapper('wllama_malloc', pointer, [\n          'number',\n          pointer,\n        ]);\n        wllamaStart = callWrapper('wllama_start', 'string', [], true);\n        wllamaAction = callWrapper(\n          'wllama_action',\n          pointer,\n          ['string', pointer],\n          true\n        );\n        wllamaExit = callWrapper('wllama_exit', 'string', []);\n        wllamaDebug = callWrapper('wllama_debug', 'string', []);\n        msg({ callbackId, result: null });\n      };\n      wModuleInit();\n    } catch (err) {\n      handleError(err);\n    }\n    return;\n  }\n\n  if (verb === 'fs.alloc') {\n    const argFilename = args[0];\n    const argSize = args[1];\n    const argAllocBuffer = args[2];\n    try {\n      // create blank file\n      const emptyBuffer = new ArrayBuffer(0);\n      Module['FS_createDataFile'](\n        '/models',\n        argFilename,\n        emptyBuffer,\n        true,\n        true,\n        true\n      );\n      // alloc data on heap\n      const fileId = heapfsAlloc(argFilename, argSize, argAllocBuffer);\n      msg({ callbackId, result: { fileId } });\n    } catch (err) {\n      handleError(err);\n    }\n    return;\n  }\n\n  if (verb === 'fs.write') {\n    const argFileId = args[0];\n    const argBuffer = args[1];\n    const argOffset = args[2];\n    try {\n      const writtenBytes = heapfsWrite(argFileId, argBuffer, argOffset);\n      msg({ callbackId, result: { writtenBytes } });\n    } catch (err) {\n      handleError(err);\n    }\n    return;\n  }\n\n  if (verb === 'wllama.start') {\n    try {\n      const result = await wllamaStart();\n      msg({ callbackId, result });\n    } catch (err) {\n      handleError(err);\n    }\n    return;\n  }\n\n  if (verb === 'wllama.action') {\n    const argAction = args[0];\n    const argEncodedMsg = args[1];\n    try {\n      const inputPtr = await wllamaMalloc(toSizeT(argEncodedMsg.byteLength), 0);\n      // copy data to wasm heap\n      const inputBuffer = new Uint8Array(\n        getHeapU8().buffer,\n        Number(inputPtr),\n        argEncodedMsg.byteLength\n      );\n      inputBuffer.set(argEncodedMsg, 0);\n      const outputPtr = await wllamaAction(argAction, inputPtr);\n      // length of output buffer is written at the first 4 bytes of input buffer\n      const outputLen = new Uint32Array(\n        getHeapU8().buffer,\n        Number(inputPtr),\n        1\n      )[0];\n      // copy the output buffer to JS heap\n      const outputBuffer = new Uint8Array(outputLen);\n      const outputSrcView = new Uint8Array(\n        getHeapU8().buffer,\n        Number(outputPtr),\n        outputLen\n      );\n      outputBuffer.set(outputSrcView, 0); // copy it\n      msg({ callbackId, result: outputBuffer }, [outputBuffer.buffer]);\n    } catch (err) {\n      handleError(err);\n    }\n    return;\n  }\n\n  if (verb === 'wllama.exit') {\n    try {\n      const result = await wllamaExit();\n      msg({ callbackId, result });\n    } catch (err) {\n      handleError(err);\n    }\n    return;\n  }\n\n  if (verb === 'wllama.debug') {\n    try {\n      const result = await wllamaDebug();\n      msg({ callbackId, result });\n    } catch (err) {\n      handleError(err);\n    }\n    return;\n  }\n};\n";
var OPFS_UTILS_WORKER_CODE = "let accessHandle;\nlet abortController = new AbortController();\n\nasync function openFile(filename) {\n  const opfsRoot = await navigator.storage.getDirectory();\n  const cacheDir = await opfsRoot.getDirectoryHandle('cache', { create: true });\n  const fileHandler = await cacheDir.getFileHandle(filename, { create: true });\n  accessHandle = await fileHandler.createSyncAccessHandle();\n  accessHandle.truncate(0); // clear file content\n}\n\nasync function writeFile(buf) {\n  accessHandle.write(buf);\n}\n\nasync function closeFile() {\n  accessHandle.flush();\n  accessHandle.close();\n}\n\nasync function writeTextFile(filename, str) {\n  await openFile(filename);\n  await writeFile(new TextEncoder().encode(str));\n  await closeFile();\n}\n\nconst throttled = (func, delay) => {\n  let lastRun = 0;\n  return (...args) => {\n    const now = Date.now();\n    if (now - lastRun > delay) {\n      lastRun = now;\n      func.apply(null, args);\n    }\n  };\n};\n\nconst assertNonNull = (val) => {\n  if (val === null || val === undefined) {\n    throw new Error('OPFS Worker: Assertion failed');\n  }\n};\n\n// respond to main thread\nconst resOK = () => postMessage({ ok: true });\nconst resProgress = (loaded, total) =>\n  postMessage({ progress: { loaded, total } });\nconst resErr = (err) => postMessage({ err });\n\nonmessage = async (e) => {\n  try {\n    if (!e.data) return;\n\n    /**\n     * @param {Object} e.data\n     *\n     * Fine-control FS actions:\n     * - { action: 'open', filename: 'string' }\n     * - { action: 'write', buf: ArrayBuffer }\n     * - { action: 'close' }\n     *\n     * Simple write API:\n     * - { action: 'write-simple', filename: 'string', buf: ArrayBuffer }\n     *\n     * Download API:\n     * - { action: 'download', url: 'string', filename: 'string', options: Object, metadataFileName: 'string' }\n     * - { action: 'download-abort' }\n     */\n    const {\n      action,\n      filename,\n      buf,\n      url,\n      options,\n      metadataFileName,\n      metadataAdditional,\n    } = e.data;\n\n    if (action === 'open') {\n      assertNonNull(filename);\n      await openFile(filename);\n      return resOK();\n    } else if (action === 'write') {\n      assertNonNull(buf);\n      await writeFile(buf);\n      return resOK();\n    } else if (action === 'close') {\n      await closeFile();\n      return resOK();\n    } else if (action === 'write-simple') {\n      assertNonNull(filename);\n      assertNonNull(buf);\n      await openFile(filename);\n      await writeFile(buf);\n      await closeFile();\n      return resOK();\n    } else if (action === 'download') {\n      assertNonNull(url);\n      assertNonNull(filename);\n      assertNonNull(metadataFileName);\n      assertNonNull(options);\n      assertNonNull(options.aborted);\n      abortController = new AbortController();\n      if (options.aborted) abortController.abort();\n      const response = await fetch(url, {\n        ...options,\n        signal: abortController.signal,\n      });\n      const contentLength = response.headers.get('content-length');\n      const etag = (response.headers.get('etag') || '').replace(\n        /[^A-Za-z0-9]/g,\n        ''\n      );\n      const total = parseInt(contentLength, 10);\n      const reader = response.body.getReader();\n      await openFile(filename);\n      let loaded = 0;\n      const throttledProgress = throttled(resProgress, 100);\n      while (true) {\n        const { done, value } = await reader.read();\n        if (done) break;\n        loaded += value.byteLength;\n        await writeFile(value);\n        throttledProgress(loaded, total);\n      }\n      resProgress(total, total); // 100% done\n      await closeFile();\n      // make sure this is in-sync with CacheEntryMetadata\n      await writeTextFile(\n        metadataFileName,\n        JSON.stringify({\n          originalURL: url,\n          originalSize: total,\n          etag,\n          ...metadataAdditional,\n        })\n      );\n      return resOK();\n    } else if (action === 'download-abort') {\n      if (abortController) {\n        abortController.abort();\n      }\n      return;\n    }\n\n    throw new Error('OPFS Worker: Invalid action', e.data);\n  } catch (err) {\n    return resErr(err);\n  }\n};\n";
var WLLAMA_EMSCRIPTEN_CODE = 'var Module=typeof Module!="undefined"?Module:{};var ENVIRONMENT_IS_WEB=!!globalThis.window;var ENVIRONMENT_IS_WORKER=!!globalThis.WorkerGlobalScope;var ENVIRONMENT_IS_NODE=globalThis.process?.versions?.node&&globalThis.process?.type!="renderer";var ENVIRONMENT_IS_PTHREAD=ENVIRONMENT_IS_WORKER&&self.name?.startsWith("em-pthread");if(ENVIRONMENT_IS_NODE){var worker_threads=require("worker_threads");global.Worker=worker_threads.Worker;ENVIRONMENT_IS_WORKER=!worker_threads.isMainThread;ENVIRONMENT_IS_PTHREAD=ENVIRONMENT_IS_WORKER&&worker_threads["workerData"]=="em-pthread"}var arguments_=[];var thisProgram="./this.program";var quit_=(status,toThrow)=>{throw toThrow};var _scriptName=globalThis.document?.currentScript?.src;if(typeof __filename!="undefined"){_scriptName=__filename}else if(ENVIRONMENT_IS_WORKER){_scriptName=self.location.href}var scriptDirectory="";function locateFile(path){if(Module["locateFile"]){return Module["locateFile"](path,scriptDirectory)}return scriptDirectory+path}var readAsync,readBinary;if(ENVIRONMENT_IS_NODE){var fs=require("fs");scriptDirectory=__dirname+"/";readBinary=filename=>{filename=isFileURI(filename)?new URL(filename):filename;var ret=fs.readFileSync(filename);return ret};readAsync=async(filename,binary=true)=>{filename=isFileURI(filename)?new URL(filename):filename;var ret=fs.readFileSync(filename,binary?undefined:"utf8");return ret};if(process.argv.length>1){thisProgram=process.argv[1].replace(/\\\\/g,"/")}arguments_=process.argv.slice(2);if(typeof module!="undefined"){module["exports"]=Module}quit_=(status,toThrow)=>{process.exitCode=status;throw toThrow}}else if(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER){try{scriptDirectory=new URL(".",_scriptName).href}catch{}if(!ENVIRONMENT_IS_NODE){if(ENVIRONMENT_IS_WORKER){readBinary=url=>{var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.responseType="arraybuffer";xhr.send(null);return new Uint8Array(xhr.response)}}readAsync=async url=>{if(isFileURI(url)){return new Promise((resolve,reject)=>{var xhr=new XMLHttpRequest;xhr.open("GET",url,true);xhr.responseType="arraybuffer";xhr.onload=()=>{if(xhr.status==200||xhr.status==0&&xhr.response){resolve(xhr.response);return}reject(xhr.status)};xhr.onerror=reject;xhr.send(null)})}var response=await fetch(url,{credentials:"same-origin"});if(response.ok){return response.arrayBuffer()}throw new Error(response.status+" : "+response.url)}}}else{}var defaultPrint=console.log.bind(console);var defaultPrintErr=console.error.bind(console);if(ENVIRONMENT_IS_NODE){var utils=require("util");var stringify=a=>typeof a=="object"?utils.inspect(a):a;defaultPrint=(...args)=>fs.writeSync(1,args.map(stringify).join(" ")+"\\n");defaultPrintErr=(...args)=>fs.writeSync(2,args.map(stringify).join(" ")+"\\n")}var out=defaultPrint;var err=defaultPrintErr;var wasmBinary;var wasmModule;var ABORT=false;var EXITSTATUS;function assert(condition,text){if(!condition){abort(text)}}var isFileURI=filename=>filename.startsWith("file://");function growMemViews(){if(wasmMemory.buffer!=HEAP8.buffer){updateMemoryViews()}}if(ENVIRONMENT_IS_NODE&&ENVIRONMENT_IS_PTHREAD){var parentPort=worker_threads["parentPort"];parentPort.on("message",msg=>global.onmessage?.({data:msg}));Object.assign(globalThis,{self:global,postMessage:msg=>parentPort["postMessage"](msg)});process.on("uncaughtException",err=>{postMessage({cmd:"uncaughtException",error:err});process.exit(1)})}var startWorker;if(ENVIRONMENT_IS_PTHREAD){var initializedJS=false;self.onunhandledrejection=e=>{throw e.reason||e};async function handleMessage(e){try{var msgData=e["data"];var cmd=msgData.cmd;if(cmd==="load"){let messageQueue=[];self.onmessage=e=>messageQueue.push(e);startWorker=()=>{postMessage({cmd:"loaded"});for(let msg of messageQueue){handleMessage(msg)}self.onmessage=handleMessage};for(const handler of msgData.handlers){if(!Module[handler]||Module[handler].proxy){Module[handler]=(...args)=>{postMessage({cmd:"callHandler",handler,args})};if(handler=="print")out=Module[handler];if(handler=="printErr")err=Module[handler]}}wasmMemory=msgData.wasmMemory;updateMemoryViews();wasmModule=msgData.wasmModule;createWasm();run()}else if(cmd==="run"){establishStackSpace(msgData.pthread_ptr);__emscripten_thread_init(msgData.pthread_ptr,0,0,1,0,0);PThread.threadInitTLS();__emscripten_thread_mailbox_await(msgData.pthread_ptr);if(!initializedJS){initializedJS=true}try{await invokeEntryPoint(msgData.start_routine,msgData.arg)}catch(ex){if(ex!="unwind"){throw ex}}}else if(msgData.target==="setimmediate"){}else if(cmd==="checkMailbox"){if(initializedJS){checkMailbox()}}else if(cmd){err(`worker: received unknown command ${cmd}`);err(msgData)}}catch(ex){__emscripten_thread_crashed();throw ex}}self.onmessage=handleMessage}var HEAP8,HEAPU8,HEAP16,HEAPU16,HEAP32,HEAPU32,HEAPF32,HEAPF64;var HEAP64,HEAPU64;var runtimeInitialized=false;function updateMemoryViews(){var b=wasmMemory.buffer;HEAP8=new Int8Array(b);HEAP16=new Int16Array(b);Module["HEAPU8"]=HEAPU8=new Uint8Array(b);HEAPU16=new Uint16Array(b);HEAP32=new Int32Array(b);HEAPU32=new Uint32Array(b);HEAPF32=new Float32Array(b);HEAPF64=new Float64Array(b);HEAP64=new BigInt64Array(b);HEAPU64=new BigUint64Array(b)}function initMemory(){if(ENVIRONMENT_IS_PTHREAD){return}if(Module["wasmMemory"]){wasmMemory=Module["wasmMemory"]}else{var INITIAL_MEMORY=Module["INITIAL_MEMORY"]||134217728;wasmMemory=new WebAssembly.Memory({initial:BigInt(INITIAL_MEMORY/65536),maximum:65536n,shared:true,address:"i64"})}updateMemoryViews()}function preRun(){if(Module["preRun"]){if(typeof Module["preRun"]=="function")Module["preRun"]=[Module["preRun"]];while(Module["preRun"].length){addOnPreRun(Module["preRun"].shift())}}callRuntimeCallbacks(onPreRuns)}function initRuntime(){runtimeInitialized=true;if(ENVIRONMENT_IS_PTHREAD)return startWorker();if(!Module["noFSInit"]&&!FS.initialized)FS.init();TTY.init();wasmExports["__wasm_call_ctors"]();FS.ignorePermissions=false}function preMain(){}function postRun(){if(ENVIRONMENT_IS_PTHREAD){return}if(Module["postRun"]){if(typeof Module["postRun"]=="function")Module["postRun"]=[Module["postRun"]];while(Module["postRun"].length){addOnPostRun(Module["postRun"].shift())}}callRuntimeCallbacks(onPostRuns)}function abort(what){Module["onAbort"]?.(what);what="Aborted("+what+")";err(what);ABORT=true;what+=". Build with -sASSERTIONS for more info.";if(runtimeInitialized){___trap()}var e=new WebAssembly.RuntimeError(what);throw e}var wasmBinaryFile;function findWasmBinary(){return locateFile("wllama.wasm")}function getBinarySync(file){if(file==wasmBinaryFile&&wasmBinary){return new Uint8Array(wasmBinary)}if(readBinary){return readBinary(file)}throw"both async and sync fetching of the wasm failed"}async function getWasmBinary(binaryFile){if(!wasmBinary){try{var response=await readAsync(binaryFile);return new Uint8Array(response)}catch{}}return getBinarySync(binaryFile)}async function instantiateArrayBuffer(binaryFile,imports){try{var binary=await getWasmBinary(binaryFile);var instance=await WebAssembly.instantiate(binary,imports);return instance}catch(reason){err(`failed to asynchronously prepare wasm: ${reason}`);abort(reason)}}async function instantiateAsync(binary,binaryFile,imports){if(!binary&&!isFileURI(binaryFile)&&!ENVIRONMENT_IS_NODE){try{var response=fetch(binaryFile,{credentials:"same-origin"});var instantiationResult=await WebAssembly.instantiateStreaming(response,imports);return instantiationResult}catch(reason){err(`wasm streaming compile failed: ${reason}`);err("falling back to ArrayBuffer instantiation")}}return instantiateArrayBuffer(binaryFile,imports)}function getWasmImports(){assignWasmImports();if(!wasmImports.__instrumented){wasmImports.__instrumented=true;Asyncify.instrumentWasmImports(wasmImports)}var imports={env:wasmImports,wasi_snapshot_preview1:wasmImports};return imports}async function createWasm(){function receiveInstance(instance,module){wasmExports=instance.exports;wasmExports=Asyncify.instrumentWasmExports(wasmExports);wasmExports=applySignatureConversions(wasmExports);registerTLSInit(wasmExports["_emscripten_tls_init"]);assignWasmExports(wasmExports);wasmModule=module;removeRunDependency("wasm-instantiate");return wasmExports}addRunDependency("wasm-instantiate");function receiveInstantiationResult(result){return receiveInstance(result["instance"],result["module"])}var info=getWasmImports();if(Module["instantiateWasm"]){return new Promise((resolve,reject)=>{Module["instantiateWasm"](info,(inst,mod)=>{resolve(receiveInstance(inst,mod))})})}if(ENVIRONMENT_IS_PTHREAD){var instance=new WebAssembly.Instance(wasmModule,getWasmImports());return receiveInstance(instance,wasmModule)}wasmBinaryFile??=findWasmBinary();var result=await instantiateAsync(wasmBinary,wasmBinaryFile,info);var exports=receiveInstantiationResult(result);return exports}class ExitStatus{name="ExitStatus";constructor(status){this.message=`Program terminated with exit(${status})`;this.status=status}}var terminateWorker=worker=>{worker.terminate();worker.onmessage=e=>{}};var cleanupThread=pthread_ptr=>{var worker=PThread.pthreads[pthread_ptr];PThread.returnWorkerToPool(worker)};var callRuntimeCallbacks=callbacks=>{while(callbacks.length>0){callbacks.shift()(Module)}};var onPreRuns=[];var addOnPreRun=cb=>onPreRuns.push(cb);var runDependencies=0;var dependenciesFulfilled=null;var removeRunDependency=id=>{runDependencies--;Module["monitorRunDependencies"]?.(runDependencies);if(runDependencies==0){if(dependenciesFulfilled){var callback=dependenciesFulfilled;dependenciesFulfilled=null;callback()}}};var addRunDependency=id=>{runDependencies++;Module["monitorRunDependencies"]?.(runDependencies)};var spawnThread=threadParams=>{var worker=PThread.getNewWorker();if(!worker){return 6}PThread.runningWorkers.push(worker);PThread.pthreads[threadParams.pthread_ptr]=worker;worker.pthread_ptr=threadParams.pthread_ptr;var msg={cmd:"run",start_routine:threadParams.startRoutine,arg:threadParams.arg,pthread_ptr:threadParams.pthread_ptr};if(ENVIRONMENT_IS_NODE){worker.unref()}worker.postMessage(msg,threadParams.transferList);return 0};var runtimeKeepaliveCounter=0;var keepRuntimeAlive=()=>noExitRuntime||runtimeKeepaliveCounter>0;var stackSave=()=>_emscripten_stack_get_current();var stackRestore=val=>__emscripten_stack_restore(val);var stackAlloc=sz=>__emscripten_stack_alloc(sz);var proxyToMainThread=(funcIndex,emAsmAddr,sync,...callArgs)=>{var serializedNumCallArgs=callArgs.length*2;var sp=stackSave();var args=stackAlloc(serializedNumCallArgs*8);var b=args/8;for(var i=0;i<callArgs.length;i++){var arg=callArgs[i];if(typeof arg=="bigint"){(growMemViews(),HEAP64)[b+2*i]=1n;(growMemViews(),HEAP64)[b+2*i+1]=arg}else{(growMemViews(),HEAP64)[b+2*i]=0n;(growMemViews(),HEAPF64)[b+2*i+1]=arg}}var rtn=__emscripten_run_js_on_main_thread(funcIndex,emAsmAddr,serializedNumCallArgs,args,sync);stackRestore(sp);return rtn};function _proc_exit(code){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(0,0,1,code);EXITSTATUS=code;if(!keepRuntimeAlive()){PThread.terminateAllThreads();Module["onExit"]?.(code);ABORT=true}quit_(code,new ExitStatus(code))}function exitOnMainThread(returnCode){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(1,0,0,returnCode);_exit(returnCode)}var exitJS=(status,implicit)=>{EXITSTATUS=status;if(ENVIRONMENT_IS_PTHREAD){exitOnMainThread(status);throw"unwind"}_proc_exit(status)};var _exit=exitJS;var PThread={unusedWorkers:[],runningWorkers:[],tlsInitFunctions:[],pthreads:{},init(){if(!ENVIRONMENT_IS_PTHREAD){PThread.initMainThread()}},initMainThread(){var pthreadPoolSize=Module["pthreadPoolSize"];while(pthreadPoolSize--){PThread.allocateUnusedWorker()}addOnPreRun(async()=>{var pthreadPoolReady=PThread.loadWasmModuleToAllWorkers();addRunDependency("loading-workers");await pthreadPoolReady;removeRunDependency("loading-workers")})},terminateAllThreads:()=>{for(var worker of PThread.runningWorkers){terminateWorker(worker)}for(var worker of PThread.unusedWorkers){terminateWorker(worker)}PThread.unusedWorkers=[];PThread.runningWorkers=[];PThread.pthreads={}},returnWorkerToPool:worker=>{var pthread_ptr=worker.pthread_ptr;delete PThread.pthreads[pthread_ptr];PThread.unusedWorkers.push(worker);PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(worker),1);worker.pthread_ptr=0;__emscripten_thread_free_data(pthread_ptr)},threadInitTLS(){PThread.tlsInitFunctions.forEach(f=>f())},loadWasmModuleToWorker:worker=>new Promise(onFinishedLoading=>{worker.onmessage=e=>{var d=e["data"];var cmd=d.cmd;if(d.targetThread&&d.targetThread!=_pthread_self()){var targetWorker=PThread.pthreads[d.targetThread];if(targetWorker){targetWorker.postMessage(d,d.transferList)}else{err(`Internal error! Worker sent a message "${cmd}" to target pthread ${d.targetThread}, but that thread no longer exists!`)}return}if(cmd==="checkMailbox"){checkMailbox()}else if(cmd==="spawnThread"){spawnThread(d)}else if(cmd==="cleanupThread"){callUserCallback(()=>cleanupThread(d.thread))}else if(cmd==="loaded"){worker.loaded=true;if(ENVIRONMENT_IS_NODE&&!worker.pthread_ptr){worker.unref()}onFinishedLoading(worker)}else if(d.target==="setimmediate"){worker.postMessage(d)}else if(cmd==="uncaughtException"){worker.onerror(d.error)}else if(cmd==="callHandler"){Module[d.handler](...d.args)}else if(cmd){err(`worker sent an unknown command ${cmd}`)}};worker.onerror=e=>{var message="worker sent an error!";err(`${message} ${e.filename}:${e.lineno}: ${e.message}`);throw e};if(ENVIRONMENT_IS_NODE){worker.on("message",data=>worker.onmessage({data}));worker.on("error",e=>worker.onerror(e))}var handlers=[];var knownHandlers=["onExit","onAbort","print","printErr"];for(var handler of knownHandlers){if(Module.propertyIsEnumerable(handler)){handlers.push(handler)}}worker.postMessage({cmd:"load",handlers,wasmMemory,wasmModule})}),async loadWasmModuleToAllWorkers(){if(ENVIRONMENT_IS_PTHREAD){return}let pthreadPoolReady=Promise.all(PThread.unusedWorkers.map(PThread.loadWasmModuleToWorker));return pthreadPoolReady},allocateUnusedWorker(){var worker;var pthreadMainJs=_scriptName;if(Module["mainScriptUrlOrBlob"]){pthreadMainJs=Module["mainScriptUrlOrBlob"];if(typeof pthreadMainJs!="string"){pthreadMainJs=URL.createObjectURL(pthreadMainJs)}}worker=new Worker(pthreadMainJs,{workerData:"em-pthread",name:"em-pthread"});PThread.unusedWorkers.push(worker)},getNewWorker(){if(PThread.unusedWorkers.length==0){PThread.allocateUnusedWorker();PThread.loadWasmModuleToWorker(PThread.unusedWorkers[0])}return PThread.unusedWorkers.pop()}};var onPostRuns=[];var addOnPostRun=cb=>onPostRuns.push(cb);function establishStackSpace(pthread_ptr){var stackHigh=Number((growMemViews(),HEAPU64)[(pthread_ptr+88)/8]);var stackSize=Number((growMemViews(),HEAPU64)[(pthread_ptr+96)/8]);var stackLow=stackHigh-stackSize;_emscripten_stack_set_limits(stackHigh,stackLow);stackRestore(stackHigh)}var wasmTableMirror=[];var getWasmTableEntry=funcPtr=>{funcPtr=Number(funcPtr);var func=wasmTableMirror[funcPtr];if(!func){wasmTableMirror[funcPtr]=func=wasmTable.get(BigInt(funcPtr));if(Asyncify.isAsyncExport(func)){wasmTableMirror[funcPtr]=func=Asyncify.makeAsyncFunction(func)}}return func};var invokeEntryPoint=async(ptr,arg)=>{runtimeKeepaliveCounter=0;noExitRuntime=0;var result=(a1=>WebAssembly.promising(getWasmTableEntry(ptr)).call(null,BigInt(a1)))(arg);function finish(result){if(keepRuntimeAlive()){EXITSTATUS=result;return}__emscripten_thread_exit(result)}result=await result;finish(result)};invokeEntryPoint.isAsync=true;var noExitRuntime=true;var registerTLSInit=tlsInitFunc=>PThread.tlsInitFunctions.push(tlsInitFunc);var wasmMemory;function pthreadCreateProxied(pthread_ptr,attr,startRoutine,arg){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(2,0,1,pthread_ptr,attr,startRoutine,arg);return ___pthread_create_js(pthread_ptr,attr,startRoutine,arg)}var _emscripten_has_threading_support=()=>!!globalThis.SharedArrayBuffer;var INT53_MAX=9007199254740992;var INT53_MIN=-9007199254740992;var bigintToI53Checked=num=>num<INT53_MIN||num>INT53_MAX?NaN:Number(num);function ___pthread_create_js(pthread_ptr,attr,startRoutine,arg){pthread_ptr=bigintToI53Checked(pthread_ptr);attr=bigintToI53Checked(attr);startRoutine=bigintToI53Checked(startRoutine);arg=bigintToI53Checked(arg);if(!_emscripten_has_threading_support()){return 6}var transferList=[];var error=0;if(ENVIRONMENT_IS_PTHREAD&&(transferList.length===0||error)){return pthreadCreateProxied(pthread_ptr,attr,startRoutine,arg)}if(error)return error;var threadParams={startRoutine,pthread_ptr,arg,transferList};if(ENVIRONMENT_IS_PTHREAD){threadParams.cmd="spawnThread";postMessage(threadParams,transferList);return 0}return spawnThread(threadParams)}var syscallGetVarargP=()=>{var ret=Number((growMemViews(),HEAPU64)[SYSCALLS.varargs/8]);SYSCALLS.varargs+=8;return ret};var syscallGetVarargI=()=>{var ret=(growMemViews(),HEAP32)[+SYSCALLS.varargs/4];SYSCALLS.varargs+=4;return ret};var PATH={isAbs:path=>path.charAt(0)==="/",splitPath:filename=>{var splitPathRe=/^(\\/?|)([\\s\\S]*?)((?:\\.{1,2}|[^\\/]+?|)(\\.[^.\\/]*|))(?:[\\/]*)$/;return splitPathRe.exec(filename).slice(1)},normalizeArray:(parts,allowAboveRoot)=>{var up=0;for(var i=parts.length-1;i>=0;i--){var last=parts[i];if(last==="."){parts.splice(i,1)}else if(last===".."){parts.splice(i,1);up++}else if(up){parts.splice(i,1);up--}}if(allowAboveRoot){for(;up;up--){parts.unshift("..")}}return parts},normalize:path=>{var isAbsolute=PATH.isAbs(path),trailingSlash=path.slice(-1)==="/";path=PATH.normalizeArray(path.split("/").filter(p=>!!p),!isAbsolute).join("/");if(!path&&!isAbsolute){path="."}if(path&&trailingSlash){path+="/"}return(isAbsolute?"/":"")+path},dirname:path=>{var result=PATH.splitPath(path),root=result[0],dir=result[1];if(!root&&!dir){return"."}if(dir){dir=dir.slice(0,-1)}return root+dir},basename:path=>path&&path.match(/([^\\/]+|\\/)\\/*$/)[1],join:(...paths)=>PATH.normalize(paths.join("/")),join2:(l,r)=>PATH.normalize(l+"/"+r)};var initRandomFill=()=>view=>view.set(crypto.getRandomValues(new Uint8Array(view.byteLength)));var randomFill=view=>{(randomFill=initRandomFill())(view)};var PATH_FS={resolve:(...args)=>{var resolvedPath="",resolvedAbsolute=false;for(var i=args.length-1;i>=-1&&!resolvedAbsolute;i--){var path=i>=0?args[i]:FS.cwd();if(typeof path!="string"){throw new TypeError("Arguments to path.resolve must be strings")}else if(!path){return""}resolvedPath=path+"/"+resolvedPath;resolvedAbsolute=PATH.isAbs(path)}resolvedPath=PATH.normalizeArray(resolvedPath.split("/").filter(p=>!!p),!resolvedAbsolute).join("/");return(resolvedAbsolute?"/":"")+resolvedPath||"."},relative:(from,to)=>{from=PATH_FS.resolve(from).slice(1);to=PATH_FS.resolve(to).slice(1);function trim(arr){var start=0;for(;start<arr.length;start++){if(arr[start]!=="")break}var end=arr.length-1;for(;end>=0;end--){if(arr[end]!=="")break}if(start>end)return[];return arr.slice(start,end-start+1)}var fromParts=trim(from.split("/"));var toParts=trim(to.split("/"));var length=Math.min(fromParts.length,toParts.length);var samePartsLength=length;for(var i=0;i<length;i++){if(fromParts[i]!==toParts[i]){samePartsLength=i;break}}var outputParts=[];for(var i=samePartsLength;i<fromParts.length;i++){outputParts.push("..")}outputParts=outputParts.concat(toParts.slice(samePartsLength));return outputParts.join("/")}};var UTF8Decoder=globalThis.TextDecoder&&new TextDecoder;var findStringEnd=(heapOrArray,idx,maxBytesToRead,ignoreNul)=>{var maxIdx=idx+maxBytesToRead;if(ignoreNul)return maxIdx;while(heapOrArray[idx]&&!(idx>=maxIdx))++idx;return idx};var UTF8ArrayToString=(heapOrArray,idx=0,maxBytesToRead,ignoreNul)=>{var endPtr=findStringEnd(heapOrArray,idx,maxBytesToRead,ignoreNul);if(endPtr-idx>16&&heapOrArray.buffer&&UTF8Decoder){return UTF8Decoder.decode(heapOrArray.buffer instanceof ArrayBuffer?heapOrArray.subarray(idx,endPtr):heapOrArray.slice(idx,endPtr))}var str="";while(idx<endPtr){var u0=heapOrArray[idx++];if(!(u0&128)){str+=String.fromCharCode(u0);continue}var u1=heapOrArray[idx++]&63;if((u0&224)==192){str+=String.fromCharCode((u0&31)<<6|u1);continue}var u2=heapOrArray[idx++]&63;if((u0&240)==224){u0=(u0&15)<<12|u1<<6|u2}else{u0=(u0&7)<<18|u1<<12|u2<<6|heapOrArray[idx++]&63}if(u0<65536){str+=String.fromCharCode(u0)}else{var ch=u0-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023)}}return str};var FS_stdin_getChar_buffer=[];var lengthBytesUTF8=str=>{var len=0;for(var i=0;i<str.length;++i){var c=str.charCodeAt(i);if(c<=127){len++}else if(c<=2047){len+=2}else if(c>=55296&&c<=57343){len+=4;++i}else{len+=3}}return len};var stringToUTF8Array=(str,heap,outIdx,maxBytesToWrite)=>{if(!(maxBytesToWrite>0))return 0;var startIdx=outIdx;var endIdx=outIdx+maxBytesToWrite-1;for(var i=0;i<str.length;++i){var u=str.codePointAt(i);if(u<=127){if(outIdx>=endIdx)break;heap[outIdx++]=u}else if(u<=2047){if(outIdx+1>=endIdx)break;heap[outIdx++]=192|u>>6;heap[outIdx++]=128|u&63}else if(u<=65535){if(outIdx+2>=endIdx)break;heap[outIdx++]=224|u>>12;heap[outIdx++]=128|u>>6&63;heap[outIdx++]=128|u&63}else{if(outIdx+3>=endIdx)break;heap[outIdx++]=240|u>>18;heap[outIdx++]=128|u>>12&63;heap[outIdx++]=128|u>>6&63;heap[outIdx++]=128|u&63;i++}}heap[outIdx]=0;return outIdx-startIdx};var intArrayFromString=(stringy,dontAddNull,length)=>{var len=length>0?length:lengthBytesUTF8(stringy)+1;var u8array=new Array(len);var numBytesWritten=stringToUTF8Array(stringy,u8array,0,u8array.length);if(dontAddNull)u8array.length=numBytesWritten;return u8array};var FS_stdin_getChar=()=>{if(!FS_stdin_getChar_buffer.length){var result=null;if(ENVIRONMENT_IS_NODE){var BUFSIZE=256;var buf=Buffer.alloc(BUFSIZE);var bytesRead=0;var fd=process.stdin.fd;try{bytesRead=fs.readSync(fd,buf,0,BUFSIZE)}catch(e){if(e.toString().includes("EOF"))bytesRead=0;else throw e}if(bytesRead>0){result=buf.slice(0,bytesRead).toString("utf-8")}}else if(globalThis.window?.prompt){result=window.prompt("Input: ");if(result!==null){result+="\\n"}}else{}if(!result){return null}FS_stdin_getChar_buffer=intArrayFromString(result,true)}return FS_stdin_getChar_buffer.shift()};var TTY={ttys:[],init(){},shutdown(){},register(dev,ops){TTY.ttys[dev]={input:[],output:[],ops};FS.registerDevice(dev,TTY.stream_ops)},stream_ops:{open(stream){var tty=TTY.ttys[stream.node.rdev];if(!tty){throw new FS.ErrnoError(43)}stream.tty=tty;stream.seekable=false},close(stream){stream.tty.ops.fsync(stream.tty)},fsync(stream){stream.tty.ops.fsync(stream.tty)},read(stream,buffer,offset,length,pos){if(!stream.tty||!stream.tty.ops.get_char){throw new FS.ErrnoError(60)}var bytesRead=0;for(var i=0;i<length;i++){var result;try{result=stream.tty.ops.get_char(stream.tty)}catch(e){throw new FS.ErrnoError(29)}if(result===undefined&&bytesRead===0){throw new FS.ErrnoError(6)}if(result===null||result===undefined)break;bytesRead++;buffer[offset+i]=result}if(bytesRead){stream.node.atime=Date.now()}return bytesRead},write(stream,buffer,offset,length,pos){if(!stream.tty||!stream.tty.ops.put_char){throw new FS.ErrnoError(60)}try{for(var i=0;i<length;i++){stream.tty.ops.put_char(stream.tty,buffer[offset+i])}}catch(e){throw new FS.ErrnoError(29)}if(length){stream.node.mtime=stream.node.ctime=Date.now()}return i}},default_tty_ops:{get_char(tty){return FS_stdin_getChar()},put_char(tty,val){if(val===null||val===10){out(UTF8ArrayToString(tty.output));tty.output=[]}else{if(val!=0)tty.output.push(val)}},fsync(tty){if(tty.output?.length>0){out(UTF8ArrayToString(tty.output));tty.output=[]}},ioctl_tcgets(tty){return{c_iflag:25856,c_oflag:5,c_cflag:191,c_lflag:35387,c_cc:[3,28,127,21,4,0,1,0,17,19,26,0,18,15,23,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}},ioctl_tcsets(tty,optional_actions,data){return 0},ioctl_tiocgwinsz(tty){return[24,80]}},default_tty1_ops:{put_char(tty,val){if(val===null||val===10){err(UTF8ArrayToString(tty.output));tty.output=[]}else{if(val!=0)tty.output.push(val)}},fsync(tty){if(tty.output?.length>0){err(UTF8ArrayToString(tty.output));tty.output=[]}}}};var zeroMemory=(ptr,size)=>(growMemViews(),HEAPU8).fill(0,ptr,ptr+size);var alignMemory=(size,alignment)=>Math.ceil(size/alignment)*alignment;var mmapAlloc=size=>{size=alignMemory(size,65536);var ptr=_emscripten_builtin_memalign(65536,size);if(ptr)zeroMemory(ptr,size);return ptr};var MEMFS={ops_table:null,mount(mount){return MEMFS.createNode(null,"/",16895,0)},createNode(parent,name,mode,dev){if(FS.isBlkdev(mode)||FS.isFIFO(mode)){throw new FS.ErrnoError(63)}MEMFS.ops_table||={dir:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr,lookup:MEMFS.node_ops.lookup,mknod:MEMFS.node_ops.mknod,rename:MEMFS.node_ops.rename,unlink:MEMFS.node_ops.unlink,rmdir:MEMFS.node_ops.rmdir,readdir:MEMFS.node_ops.readdir,symlink:MEMFS.node_ops.symlink},stream:{llseek:MEMFS.stream_ops.llseek}},file:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr},stream:{llseek:MEMFS.stream_ops.llseek,read:MEMFS.stream_ops.read,write:MEMFS.stream_ops.write,mmap:MEMFS.stream_ops.mmap,msync:MEMFS.stream_ops.msync}},link:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr,readlink:MEMFS.node_ops.readlink},stream:{}},chrdev:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr},stream:FS.chrdev_stream_ops}};var node=FS.createNode(parent,name,mode,dev);if(FS.isDir(node.mode)){node.node_ops=MEMFS.ops_table.dir.node;node.stream_ops=MEMFS.ops_table.dir.stream;node.contents={}}else if(FS.isFile(node.mode)){node.node_ops=MEMFS.ops_table.file.node;node.stream_ops=MEMFS.ops_table.file.stream;node.usedBytes=0;node.contents=null}else if(FS.isLink(node.mode)){node.node_ops=MEMFS.ops_table.link.node;node.stream_ops=MEMFS.ops_table.link.stream}else if(FS.isChrdev(node.mode)){node.node_ops=MEMFS.ops_table.chrdev.node;node.stream_ops=MEMFS.ops_table.chrdev.stream}node.atime=node.mtime=node.ctime=Date.now();if(parent){parent.contents[name]=node;parent.atime=parent.mtime=parent.ctime=node.atime}return node},getFileDataAsTypedArray(node){if(!node.contents)return new Uint8Array(0);if(node.contents.subarray)return node.contents.subarray(0,node.usedBytes);return new Uint8Array(node.contents)},expandFileStorage(node,newCapacity){var prevCapacity=node.contents?node.contents.length:0;if(prevCapacity>=newCapacity)return;var CAPACITY_DOUBLING_MAX=1024*1024;newCapacity=Math.max(newCapacity,prevCapacity*(prevCapacity<CAPACITY_DOUBLING_MAX?2:1.125)>>>0);if(prevCapacity!=0)newCapacity=Math.max(newCapacity,256);var oldContents=node.contents;node.contents=new Uint8Array(newCapacity);if(node.usedBytes>0)node.contents.set(oldContents.subarray(0,node.usedBytes),0)},resizeFileStorage(node,newSize){if(node.usedBytes==newSize)return;if(newSize==0){node.contents=null;node.usedBytes=0}else{var oldContents=node.contents;node.contents=new Uint8Array(newSize);if(oldContents){node.contents.set(oldContents.subarray(0,Math.min(newSize,node.usedBytes)))}node.usedBytes=newSize}},node_ops:{getattr(node){var attr={};attr.dev=FS.isChrdev(node.mode)?node.id:1;attr.ino=node.id;attr.mode=node.mode;attr.nlink=1;attr.uid=0;attr.gid=0;attr.rdev=node.rdev;if(FS.isDir(node.mode)){attr.size=4096}else if(FS.isFile(node.mode)){attr.size=node.usedBytes}else if(FS.isLink(node.mode)){attr.size=node.link.length}else{attr.size=0}attr.atime=new Date(node.atime);attr.mtime=new Date(node.mtime);attr.ctime=new Date(node.ctime);attr.blksize=4096;attr.blocks=Math.ceil(attr.size/attr.blksize);return attr},setattr(node,attr){for(const key of["mode","atime","mtime","ctime"]){if(attr[key]!=null){node[key]=attr[key]}}if(attr.size!==undefined){MEMFS.resizeFileStorage(node,attr.size)}},lookup(parent,name){if(!MEMFS.doesNotExistError){MEMFS.doesNotExistError=new FS.ErrnoError(44);MEMFS.doesNotExistError.stack="<generic error, no stack>"}throw MEMFS.doesNotExistError},mknod(parent,name,mode,dev){return MEMFS.createNode(parent,name,mode,dev)},rename(old_node,new_dir,new_name){var new_node;try{new_node=FS.lookupNode(new_dir,new_name)}catch(e){}if(new_node){if(FS.isDir(old_node.mode)){for(var i in new_node.contents){throw new FS.ErrnoError(55)}}FS.hashRemoveNode(new_node)}delete old_node.parent.contents[old_node.name];new_dir.contents[new_name]=old_node;old_node.name=new_name;new_dir.ctime=new_dir.mtime=old_node.parent.ctime=old_node.parent.mtime=Date.now()},unlink(parent,name){delete parent.contents[name];parent.ctime=parent.mtime=Date.now()},rmdir(parent,name){var node=FS.lookupNode(parent,name);for(var i in node.contents){throw new FS.ErrnoError(55)}delete parent.contents[name];parent.ctime=parent.mtime=Date.now()},readdir(node){return[".","..",...Object.keys(node.contents)]},symlink(parent,newname,oldpath){var node=MEMFS.createNode(parent,newname,511|40960,0);node.link=oldpath;return node},readlink(node){if(!FS.isLink(node.mode)){throw new FS.ErrnoError(28)}return node.link}},stream_ops:{read(stream,buffer,offset,length,position){var contents=stream.node.contents;if(position>=stream.node.usedBytes)return 0;var size=Math.min(stream.node.usedBytes-position,length);if(size>8&&contents.subarray){buffer.set(contents.subarray(position,position+size),offset)}else{for(var i=0;i<size;i++)buffer[offset+i]=contents[position+i]}return size},write(stream,buffer,offset,length,position,canOwn){if(buffer.buffer===(growMemViews(),HEAP8).buffer){canOwn=false}if(!length)return 0;var node=stream.node;node.mtime=node.ctime=Date.now();if(buffer.subarray&&(!node.contents||node.contents.subarray)){if(canOwn){node.contents=buffer.subarray(offset,offset+length);node.usedBytes=length;return length}else if(node.usedBytes===0&&position===0){node.contents=buffer.slice(offset,offset+length);node.usedBytes=length;return length}else if(position+length<=node.usedBytes){node.contents.set(buffer.subarray(offset,offset+length),position);return length}}MEMFS.expandFileStorage(node,position+length);if(node.contents.subarray&&buffer.subarray){node.contents.set(buffer.subarray(offset,offset+length),position)}else{for(var i=0;i<length;i++){node.contents[position+i]=buffer[offset+i]}}node.usedBytes=Math.max(node.usedBytes,position+length);return length},llseek(stream,offset,whence){var position=offset;if(whence===1){position+=stream.position}else if(whence===2){if(FS.isFile(stream.node.mode)){position+=stream.node.usedBytes}}if(position<0){throw new FS.ErrnoError(28)}return position},mmap(stream,length,position,prot,flags){if(!FS.isFile(stream.node.mode)){throw new FS.ErrnoError(43)}var ptr;var allocated;var contents=stream.node.contents;if(!(flags&2)&&contents&&contents.buffer===(growMemViews(),HEAP8).buffer){allocated=false;ptr=contents.byteOffset}else{allocated=true;ptr=mmapAlloc(length);if(!ptr){throw new FS.ErrnoError(48)}if(contents){if(position>0||position+length<contents.length){if(contents.subarray){contents=contents.subarray(position,position+length)}else{contents=Array.prototype.slice.call(contents,position,position+length)}}(growMemViews(),HEAP8).set(contents,ptr)}}return{ptr,allocated}},msync(stream,buffer,offset,length,mmapFlags){MEMFS.stream_ops.write(stream,buffer,0,length,offset,false);return 0}}};var FS_modeStringToFlags=str=>{var flagModes={r:0,"r+":2,w:512|64|1,"w+":512|64|2,a:1024|64|1,"a+":1024|64|2};var flags=flagModes[str];if(typeof flags=="undefined"){throw new Error(`Unknown file open mode: ${str}`)}return flags};var FS_getMode=(canRead,canWrite)=>{var mode=0;if(canRead)mode|=292|73;if(canWrite)mode|=146;return mode};var asyncLoad=async url=>{var arrayBuffer=await readAsync(url);return new Uint8Array(arrayBuffer)};var FS_createDataFile=(...args)=>FS.createDataFile(...args);var getUniqueRunDependency=id=>id;var preloadPlugins=[];var FS_handledByPreloadPlugin=async(byteArray,fullname)=>{if(typeof Browser!="undefined")Browser.init();for(var plugin of preloadPlugins){if(plugin["canHandle"](fullname)){return plugin["handle"](byteArray,fullname)}}return byteArray};var FS_preloadFile=async(parent,name,url,canRead,canWrite,dontCreateFile,canOwn,preFinish)=>{var fullname=name?PATH_FS.resolve(PATH.join2(parent,name)):parent;var dep=getUniqueRunDependency(`cp ${fullname}`);addRunDependency(dep);try{var byteArray=url;if(typeof url=="string"){byteArray=await asyncLoad(url)}byteArray=await FS_handledByPreloadPlugin(byteArray,fullname);preFinish?.();if(!dontCreateFile){FS_createDataFile(parent,name,byteArray,canRead,canWrite,canOwn)}}finally{removeRunDependency(dep)}};var FS_createPreloadedFile=(parent,name,url,canRead,canWrite,onload,onerror,dontCreateFile,canOwn,preFinish)=>{FS_preloadFile(parent,name,url,canRead,canWrite,dontCreateFile,canOwn,preFinish).then(onload).catch(onerror)};var FS={root:null,mounts:[],devices:{},streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,filesystems:null,syncFSRequests:0,readFiles:{},ErrnoError:class{name="ErrnoError";constructor(errno){this.errno=errno}},FSStream:class{shared={};get object(){return this.node}set object(val){this.node=val}get isRead(){return(this.flags&2097155)!==1}get isWrite(){return(this.flags&2097155)!==0}get isAppend(){return this.flags&1024}get flags(){return this.shared.flags}set flags(val){this.shared.flags=val}get position(){return this.shared.position}set position(val){this.shared.position=val}},FSNode:class{node_ops={};stream_ops={};readMode=292|73;writeMode=146;mounted=null;constructor(parent,name,mode,rdev){if(!parent){parent=this}this.parent=parent;this.mount=parent.mount;this.id=FS.nextInode++;this.name=name;this.mode=mode;this.rdev=rdev;this.atime=this.mtime=this.ctime=Date.now()}get read(){return(this.mode&this.readMode)===this.readMode}set read(val){val?this.mode|=this.readMode:this.mode&=~this.readMode}get write(){return(this.mode&this.writeMode)===this.writeMode}set write(val){val?this.mode|=this.writeMode:this.mode&=~this.writeMode}get isFolder(){return FS.isDir(this.mode)}get isDevice(){return FS.isChrdev(this.mode)}},lookupPath(path,opts={}){if(!path){throw new FS.ErrnoError(44)}opts.follow_mount??=true;if(!PATH.isAbs(path)){path=FS.cwd()+"/"+path}linkloop:for(var nlinks=0;nlinks<40;nlinks++){var parts=path.split("/").filter(p=>!!p);var current=FS.root;var current_path="/";for(var i=0;i<parts.length;i++){var islast=i===parts.length-1;if(islast&&opts.parent){break}if(parts[i]==="."){continue}if(parts[i]===".."){current_path=PATH.dirname(current_path);if(FS.isRoot(current)){path=current_path+"/"+parts.slice(i+1).join("/");nlinks--;continue linkloop}else{current=current.parent}continue}current_path=PATH.join2(current_path,parts[i]);try{current=FS.lookupNode(current,parts[i])}catch(e){if(e?.errno===44&&islast&&opts.noent_okay){return{path:current_path}}throw e}if(FS.isMountpoint(current)&&(!islast||opts.follow_mount)){current=current.mounted.root}if(FS.isLink(current.mode)&&(!islast||opts.follow)){if(!current.node_ops.readlink){throw new FS.ErrnoError(52)}var link=current.node_ops.readlink(current);if(!PATH.isAbs(link)){link=PATH.dirname(current_path)+"/"+link}path=link+"/"+parts.slice(i+1).join("/");continue linkloop}}return{path:current_path,node:current}}throw new FS.ErrnoError(32)},getPath(node){var path;while(true){if(FS.isRoot(node)){var mount=node.mount.mountpoint;if(!path)return mount;return mount[mount.length-1]!=="/"?`${mount}/${path}`:mount+path}path=path?`${node.name}/${path}`:node.name;node=node.parent}},hashName(parentid,name){var hash=0;for(var i=0;i<name.length;i++){hash=(hash<<5)-hash+name.charCodeAt(i)|0}return(parentid+hash>>>0)%FS.nameTable.length},hashAddNode(node){var hash=FS.hashName(node.parent.id,node.name);node.name_next=FS.nameTable[hash];FS.nameTable[hash]=node},hashRemoveNode(node){var hash=FS.hashName(node.parent.id,node.name);if(FS.nameTable[hash]===node){FS.nameTable[hash]=node.name_next}else{var current=FS.nameTable[hash];while(current){if(current.name_next===node){current.name_next=node.name_next;break}current=current.name_next}}},lookupNode(parent,name){var errCode=FS.mayLookup(parent);if(errCode){throw new FS.ErrnoError(errCode)}var hash=FS.hashName(parent.id,name);for(var node=FS.nameTable[hash];node;node=node.name_next){var nodeName=node.name;if(node.parent.id===parent.id&&nodeName===name){return node}}return FS.lookup(parent,name)},createNode(parent,name,mode,rdev){var node=new FS.FSNode(parent,name,mode,rdev);FS.hashAddNode(node);return node},destroyNode(node){FS.hashRemoveNode(node)},isRoot(node){return node===node.parent},isMountpoint(node){return!!node.mounted},isFile(mode){return(mode&61440)===32768},isDir(mode){return(mode&61440)===16384},isLink(mode){return(mode&61440)===40960},isChrdev(mode){return(mode&61440)===8192},isBlkdev(mode){return(mode&61440)===24576},isFIFO(mode){return(mode&61440)===4096},isSocket(mode){return(mode&49152)===49152},flagsToPermissionString(flag){var perms=["r","w","rw"][flag&3];if(flag&512){perms+="w"}return perms},nodePermissions(node,perms){if(FS.ignorePermissions){return 0}if(perms.includes("r")&&!(node.mode&292)){return 2}else if(perms.includes("w")&&!(node.mode&146)){return 2}else if(perms.includes("x")&&!(node.mode&73)){return 2}return 0},mayLookup(dir){if(!FS.isDir(dir.mode))return 54;var errCode=FS.nodePermissions(dir,"x");if(errCode)return errCode;if(!dir.node_ops.lookup)return 2;return 0},mayCreate(dir,name){if(!FS.isDir(dir.mode)){return 54}try{var node=FS.lookupNode(dir,name);return 20}catch(e){}return FS.nodePermissions(dir,"wx")},mayDelete(dir,name,isdir){var node;try{node=FS.lookupNode(dir,name)}catch(e){return e.errno}var errCode=FS.nodePermissions(dir,"wx");if(errCode){return errCode}if(isdir){if(!FS.isDir(node.mode)){return 54}if(FS.isRoot(node)||FS.getPath(node)===FS.cwd()){return 10}}else{if(FS.isDir(node.mode)){return 31}}return 0},mayOpen(node,flags){if(!node){return 44}if(FS.isLink(node.mode)){return 32}else if(FS.isDir(node.mode)){if(FS.flagsToPermissionString(flags)!=="r"||flags&(512|64)){return 31}}return FS.nodePermissions(node,FS.flagsToPermissionString(flags))},checkOpExists(op,err){if(!op){throw new FS.ErrnoError(err)}return op},MAX_OPEN_FDS:4096,nextfd(){for(var fd=0;fd<=FS.MAX_OPEN_FDS;fd++){if(!FS.streams[fd]){return fd}}throw new FS.ErrnoError(33)},getStreamChecked(fd){var stream=FS.getStream(fd);if(!stream){throw new FS.ErrnoError(8)}return stream},getStream:fd=>FS.streams[fd],createStream(stream,fd=-1){stream=Object.assign(new FS.FSStream,stream);if(fd==-1){fd=FS.nextfd()}stream.fd=fd;FS.streams[fd]=stream;return stream},closeStream(fd){FS.streams[fd]=null},dupStream(origStream,fd=-1){var stream=FS.createStream(origStream,fd);stream.stream_ops?.dup?.(stream);return stream},doSetAttr(stream,node,attr){var setattr=stream?.stream_ops.setattr;var arg=setattr?stream:node;setattr??=node.node_ops.setattr;FS.checkOpExists(setattr,63);setattr(arg,attr)},chrdev_stream_ops:{open(stream){var device=FS.getDevice(stream.node.rdev);stream.stream_ops=device.stream_ops;stream.stream_ops.open?.(stream)},llseek(){throw new FS.ErrnoError(70)}},major:dev=>dev>>8,minor:dev=>dev&255,makedev:(ma,mi)=>ma<<8|mi,registerDevice(dev,ops){FS.devices[dev]={stream_ops:ops}},getDevice:dev=>FS.devices[dev],getMounts(mount){var mounts=[];var check=[mount];while(check.length){var m=check.pop();mounts.push(m);check.push(...m.mounts)}return mounts},syncfs(populate,callback){if(typeof populate=="function"){callback=populate;populate=false}FS.syncFSRequests++;if(FS.syncFSRequests>1){err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`)}var mounts=FS.getMounts(FS.root.mount);var completed=0;function doCallback(errCode){FS.syncFSRequests--;return callback(errCode)}function done(errCode){if(errCode){if(!done.errored){done.errored=true;return doCallback(errCode)}return}if(++completed>=mounts.length){doCallback(null)}}for(var mount of mounts){if(mount.type.syncfs){mount.type.syncfs(mount,populate,done)}else{done(null)}}},mount(type,opts,mountpoint){var root=mountpoint==="/";var pseudo=!mountpoint;var node;if(root&&FS.root){throw new FS.ErrnoError(10)}else if(!root&&!pseudo){var lookup=FS.lookupPath(mountpoint,{follow_mount:false});mountpoint=lookup.path;node=lookup.node;if(FS.isMountpoint(node)){throw new FS.ErrnoError(10)}if(!FS.isDir(node.mode)){throw new FS.ErrnoError(54)}}var mount={type,opts,mountpoint,mounts:[]};var mountRoot=type.mount(mount);mountRoot.mount=mount;mount.root=mountRoot;if(root){FS.root=mountRoot}else if(node){node.mounted=mount;if(node.mount){node.mount.mounts.push(mount)}}return mountRoot},unmount(mountpoint){var lookup=FS.lookupPath(mountpoint,{follow_mount:false});if(!FS.isMountpoint(lookup.node)){throw new FS.ErrnoError(28)}var node=lookup.node;var mount=node.mounted;var mounts=FS.getMounts(mount);for(var[hash,current]of Object.entries(FS.nameTable)){while(current){var next=current.name_next;if(mounts.includes(current.mount)){FS.destroyNode(current)}current=next}}node.mounted=null;var idx=node.mount.mounts.indexOf(mount);node.mount.mounts.splice(idx,1)},lookup(parent,name){return parent.node_ops.lookup(parent,name)},mknod(path,mode,dev){var lookup=FS.lookupPath(path,{parent:true});var parent=lookup.node;var name=PATH.basename(path);if(!name){throw new FS.ErrnoError(28)}if(name==="."||name===".."){throw new FS.ErrnoError(20)}var errCode=FS.mayCreate(parent,name);if(errCode){throw new FS.ErrnoError(errCode)}if(!parent.node_ops.mknod){throw new FS.ErrnoError(63)}return parent.node_ops.mknod(parent,name,mode,dev)},statfs(path){return FS.statfsNode(FS.lookupPath(path,{follow:true}).node)},statfsStream(stream){return FS.statfsNode(stream.node)},statfsNode(node){var rtn={bsize:4096,frsize:4096,blocks:1e6,bfree:5e5,bavail:5e5,files:FS.nextInode,ffree:FS.nextInode-1,fsid:42,flags:2,namelen:255};if(node.node_ops.statfs){Object.assign(rtn,node.node_ops.statfs(node.mount.opts.root))}return rtn},create(path,mode=438){mode&=4095;mode|=32768;return FS.mknod(path,mode,0)},mkdir(path,mode=511){mode&=511|512;mode|=16384;return FS.mknod(path,mode,0)},mkdirTree(path,mode){var dirs=path.split("/");var d="";for(var dir of dirs){if(!dir)continue;if(d||PATH.isAbs(path))d+="/";d+=dir;try{FS.mkdir(d,mode)}catch(e){if(e.errno!=20)throw e}}},mkdev(path,mode,dev){if(typeof dev=="undefined"){dev=mode;mode=438}mode|=8192;return FS.mknod(path,mode,dev)},symlink(oldpath,newpath){if(!PATH_FS.resolve(oldpath)){throw new FS.ErrnoError(44)}var lookup=FS.lookupPath(newpath,{parent:true});var parent=lookup.node;if(!parent){throw new FS.ErrnoError(44)}var newname=PATH.basename(newpath);var errCode=FS.mayCreate(parent,newname);if(errCode){throw new FS.ErrnoError(errCode)}if(!parent.node_ops.symlink){throw new FS.ErrnoError(63)}return parent.node_ops.symlink(parent,newname,oldpath)},rename(old_path,new_path){var old_dirname=PATH.dirname(old_path);var new_dirname=PATH.dirname(new_path);var old_name=PATH.basename(old_path);var new_name=PATH.basename(new_path);var lookup,old_dir,new_dir;lookup=FS.lookupPath(old_path,{parent:true});old_dir=lookup.node;lookup=FS.lookupPath(new_path,{parent:true});new_dir=lookup.node;if(!old_dir||!new_dir)throw new FS.ErrnoError(44);if(old_dir.mount!==new_dir.mount){throw new FS.ErrnoError(75)}var old_node=FS.lookupNode(old_dir,old_name);var relative=PATH_FS.relative(old_path,new_dirname);if(relative.charAt(0)!=="."){throw new FS.ErrnoError(28)}relative=PATH_FS.relative(new_path,old_dirname);if(relative.charAt(0)!=="."){throw new FS.ErrnoError(55)}var new_node;try{new_node=FS.lookupNode(new_dir,new_name)}catch(e){}if(old_node===new_node){return}var isdir=FS.isDir(old_node.mode);var errCode=FS.mayDelete(old_dir,old_name,isdir);if(errCode){throw new FS.ErrnoError(errCode)}errCode=new_node?FS.mayDelete(new_dir,new_name,isdir):FS.mayCreate(new_dir,new_name);if(errCode){throw new FS.ErrnoError(errCode)}if(!old_dir.node_ops.rename){throw new FS.ErrnoError(63)}if(FS.isMountpoint(old_node)||new_node&&FS.isMountpoint(new_node)){throw new FS.ErrnoError(10)}if(new_dir!==old_dir){errCode=FS.nodePermissions(old_dir,"w");if(errCode){throw new FS.ErrnoError(errCode)}}FS.hashRemoveNode(old_node);try{old_dir.node_ops.rename(old_node,new_dir,new_name);old_node.parent=new_dir}catch(e){throw e}finally{FS.hashAddNode(old_node)}},rmdir(path){var lookup=FS.lookupPath(path,{parent:true});var parent=lookup.node;var name=PATH.basename(path);var node=FS.lookupNode(parent,name);var errCode=FS.mayDelete(parent,name,true);if(errCode){throw new FS.ErrnoError(errCode)}if(!parent.node_ops.rmdir){throw new FS.ErrnoError(63)}if(FS.isMountpoint(node)){throw new FS.ErrnoError(10)}parent.node_ops.rmdir(parent,name);FS.destroyNode(node)},readdir(path){var lookup=FS.lookupPath(path,{follow:true});var node=lookup.node;var readdir=FS.checkOpExists(node.node_ops.readdir,54);return readdir(node)},unlink(path){var lookup=FS.lookupPath(path,{parent:true});var parent=lookup.node;if(!parent){throw new FS.ErrnoError(44)}var name=PATH.basename(path);var node=FS.lookupNode(parent,name);var errCode=FS.mayDelete(parent,name,false);if(errCode){throw new FS.ErrnoError(errCode)}if(!parent.node_ops.unlink){throw new FS.ErrnoError(63)}if(FS.isMountpoint(node)){throw new FS.ErrnoError(10)}parent.node_ops.unlink(parent,name);FS.destroyNode(node)},readlink(path){var lookup=FS.lookupPath(path);var link=lookup.node;if(!link){throw new FS.ErrnoError(44)}if(!link.node_ops.readlink){throw new FS.ErrnoError(28)}return link.node_ops.readlink(link)},stat(path,dontFollow){var lookup=FS.lookupPath(path,{follow:!dontFollow});var node=lookup.node;var getattr=FS.checkOpExists(node.node_ops.getattr,63);return getattr(node)},fstat(fd){var stream=FS.getStreamChecked(fd);var node=stream.node;var getattr=stream.stream_ops.getattr;var arg=getattr?stream:node;getattr??=node.node_ops.getattr;FS.checkOpExists(getattr,63);return getattr(arg)},lstat(path){return FS.stat(path,true)},doChmod(stream,node,mode,dontFollow){FS.doSetAttr(stream,node,{mode:mode&4095|node.mode&~4095,ctime:Date.now(),dontFollow})},chmod(path,mode,dontFollow){var node;if(typeof path=="string"){var lookup=FS.lookupPath(path,{follow:!dontFollow});node=lookup.node}else{node=path}FS.doChmod(null,node,mode,dontFollow)},lchmod(path,mode){FS.chmod(path,mode,true)},fchmod(fd,mode){var stream=FS.getStreamChecked(fd);FS.doChmod(stream,stream.node,mode,false)},doChown(stream,node,dontFollow){FS.doSetAttr(stream,node,{timestamp:Date.now(),dontFollow})},chown(path,uid,gid,dontFollow){var node;if(typeof path=="string"){var lookup=FS.lookupPath(path,{follow:!dontFollow});node=lookup.node}else{node=path}FS.doChown(null,node,dontFollow)},lchown(path,uid,gid){FS.chown(path,uid,gid,true)},fchown(fd,uid,gid){var stream=FS.getStreamChecked(fd);FS.doChown(stream,stream.node,false)},doTruncate(stream,node,len){if(FS.isDir(node.mode)){throw new FS.ErrnoError(31)}if(!FS.isFile(node.mode)){throw new FS.ErrnoError(28)}var errCode=FS.nodePermissions(node,"w");if(errCode){throw new FS.ErrnoError(errCode)}FS.doSetAttr(stream,node,{size:len,timestamp:Date.now()})},truncate(path,len){if(len<0){throw new FS.ErrnoError(28)}var node;if(typeof path=="string"){var lookup=FS.lookupPath(path,{follow:true});node=lookup.node}else{node=path}FS.doTruncate(null,node,len)},ftruncate(fd,len){var stream=FS.getStreamChecked(fd);if(len<0||(stream.flags&2097155)===0){throw new FS.ErrnoError(28)}FS.doTruncate(stream,stream.node,len)},utime(path,atime,mtime){var lookup=FS.lookupPath(path,{follow:true});var node=lookup.node;var setattr=FS.checkOpExists(node.node_ops.setattr,63);setattr(node,{atime,mtime})},open(path,flags,mode=438){if(path===""){throw new FS.ErrnoError(44)}flags=typeof flags=="string"?FS_modeStringToFlags(flags):flags;if(flags&64){mode=mode&4095|32768}else{mode=0}var node;var isDirPath;if(typeof path=="object"){node=path}else{isDirPath=path.endsWith("/");var lookup=FS.lookupPath(path,{follow:!(flags&131072),noent_okay:true});node=lookup.node;path=lookup.path}var created=false;if(flags&64){if(node){if(flags&128){throw new FS.ErrnoError(20)}}else if(isDirPath){throw new FS.ErrnoError(31)}else{node=FS.mknod(path,mode|511,0);created=true}}if(!node){throw new FS.ErrnoError(44)}if(FS.isChrdev(node.mode)){flags&=~512}if(flags&65536&&!FS.isDir(node.mode)){throw new FS.ErrnoError(54)}if(!created){var errCode=FS.mayOpen(node,flags);if(errCode){throw new FS.ErrnoError(errCode)}}if(flags&512&&!created){FS.truncate(node,0)}flags&=~(128|512|131072);var stream=FS.createStream({node,path:FS.getPath(node),flags,seekable:true,position:0,stream_ops:node.stream_ops,ungotten:[],error:false});if(stream.stream_ops.open){stream.stream_ops.open(stream)}if(created){FS.chmod(node,mode&511)}if(Module["logReadFiles"]&&!(flags&1)){if(!(path in FS.readFiles)){FS.readFiles[path]=1}}return stream},close(stream){if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if(stream.getdents)stream.getdents=null;try{if(stream.stream_ops.close){stream.stream_ops.close(stream)}}catch(e){throw e}finally{FS.closeStream(stream.fd)}stream.fd=null},isClosed(stream){return stream.fd===null},llseek(stream,offset,whence){if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if(!stream.seekable||!stream.stream_ops.llseek){throw new FS.ErrnoError(70)}if(whence!=0&&whence!=1&&whence!=2){throw new FS.ErrnoError(28)}stream.position=stream.stream_ops.llseek(stream,offset,whence);stream.ungotten=[];return stream.position},read(stream,buffer,offset,length,position){if(length<0||position<0){throw new FS.ErrnoError(28)}if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if((stream.flags&2097155)===1){throw new FS.ErrnoError(8)}if(FS.isDir(stream.node.mode)){throw new FS.ErrnoError(31)}if(!stream.stream_ops.read){throw new FS.ErrnoError(28)}var seeking=typeof position!="undefined";if(!seeking){position=stream.position}else if(!stream.seekable){throw new FS.ErrnoError(70)}var bytesRead=stream.stream_ops.read(stream,buffer,offset,length,position);if(!seeking)stream.position+=bytesRead;return bytesRead},write(stream,buffer,offset,length,position,canOwn){if(length<0||position<0){throw new FS.ErrnoError(28)}if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if((stream.flags&2097155)===0){throw new FS.ErrnoError(8)}if(FS.isDir(stream.node.mode)){throw new FS.ErrnoError(31)}if(!stream.stream_ops.write){throw new FS.ErrnoError(28)}if(stream.seekable&&stream.flags&1024){FS.llseek(stream,0,2)}var seeking=typeof position!="undefined";if(!seeking){position=stream.position}else if(!stream.seekable){throw new FS.ErrnoError(70)}var bytesWritten=stream.stream_ops.write(stream,buffer,offset,length,position,canOwn);if(!seeking)stream.position+=bytesWritten;return bytesWritten},mmap(stream,length,position,prot,flags){if((prot&2)!==0&&(flags&2)===0&&(stream.flags&2097155)!==2){throw new FS.ErrnoError(2)}if((stream.flags&2097155)===1){throw new FS.ErrnoError(2)}if(!stream.stream_ops.mmap){throw new FS.ErrnoError(43)}if(!length){throw new FS.ErrnoError(28)}return stream.stream_ops.mmap(stream,length,position,prot,flags)},msync(stream,buffer,offset,length,mmapFlags){if(!stream.stream_ops.msync){return 0}return stream.stream_ops.msync(stream,buffer,offset,length,mmapFlags)},ioctl(stream,cmd,arg){if(!stream.stream_ops.ioctl){throw new FS.ErrnoError(59)}return stream.stream_ops.ioctl(stream,cmd,arg)},readFile(path,opts={}){opts.flags=opts.flags||0;opts.encoding=opts.encoding||"binary";if(opts.encoding!=="utf8"&&opts.encoding!=="binary"){abort(`Invalid encoding type "${opts.encoding}"`)}var stream=FS.open(path,opts.flags);var stat=FS.stat(path);var length=stat.size;var buf=new Uint8Array(length);FS.read(stream,buf,0,length,0);if(opts.encoding==="utf8"){buf=UTF8ArrayToString(buf)}FS.close(stream);return buf},writeFile(path,data,opts={}){opts.flags=opts.flags||577;var stream=FS.open(path,opts.flags,opts.mode);if(typeof data=="string"){data=new Uint8Array(intArrayFromString(data,true))}if(ArrayBuffer.isView(data)){FS.write(stream,data,0,data.byteLength,undefined,opts.canOwn)}else{abort("Unsupported data type")}FS.close(stream)},cwd:()=>FS.currentPath,chdir(path){var lookup=FS.lookupPath(path,{follow:true});if(lookup.node===null){throw new FS.ErrnoError(44)}if(!FS.isDir(lookup.node.mode)){throw new FS.ErrnoError(54)}var errCode=FS.nodePermissions(lookup.node,"x");if(errCode){throw new FS.ErrnoError(errCode)}FS.currentPath=lookup.path},createDefaultDirectories(){FS.mkdir("/tmp");FS.mkdir("/home");FS.mkdir("/home/web_user")},createDefaultDevices(){FS.mkdir("/dev");FS.registerDevice(FS.makedev(1,3),{read:()=>0,write:(stream,buffer,offset,length,pos)=>length,llseek:()=>0});FS.mkdev("/dev/null",FS.makedev(1,3));TTY.register(FS.makedev(5,0),TTY.default_tty_ops);TTY.register(FS.makedev(6,0),TTY.default_tty1_ops);FS.mkdev("/dev/tty",FS.makedev(5,0));FS.mkdev("/dev/tty1",FS.makedev(6,0));var randomBuffer=new Uint8Array(1024),randomLeft=0;var randomByte=()=>{if(randomLeft===0){randomFill(randomBuffer);randomLeft=randomBuffer.byteLength}return randomBuffer[--randomLeft]};FS.createDevice("/dev","random",randomByte);FS.createDevice("/dev","urandom",randomByte);FS.mkdir("/dev/shm");FS.mkdir("/dev/shm/tmp")},createSpecialDirectories(){FS.mkdir("/proc");var proc_self=FS.mkdir("/proc/self");FS.mkdir("/proc/self/fd");FS.mount({mount(){var node=FS.createNode(proc_self,"fd",16895,73);node.stream_ops={llseek:MEMFS.stream_ops.llseek};node.node_ops={lookup(parent,name){var fd=+name;var stream=FS.getStreamChecked(fd);var ret={parent:null,mount:{mountpoint:"fake"},node_ops:{readlink:()=>stream.path},id:fd+1};ret.parent=ret;return ret},readdir(){return Array.from(FS.streams.entries()).filter(([k,v])=>v).map(([k,v])=>k.toString())}};return node}},{},"/proc/self/fd")},createStandardStreams(input,output,error){if(input){FS.createDevice("/dev","stdin",input)}else{FS.symlink("/dev/tty","/dev/stdin")}if(output){FS.createDevice("/dev","stdout",null,output)}else{FS.symlink("/dev/tty","/dev/stdout")}if(error){FS.createDevice("/dev","stderr",null,error)}else{FS.symlink("/dev/tty1","/dev/stderr")}var stdin=FS.open("/dev/stdin",0);var stdout=FS.open("/dev/stdout",1);var stderr=FS.open("/dev/stderr",1)},staticInit(){FS.nameTable=new Array(4096);FS.mount(MEMFS,{},"/");FS.createDefaultDirectories();FS.createDefaultDevices();FS.createSpecialDirectories();FS.filesystems={MEMFS}},init(input,output,error){FS.initialized=true;input??=Module["stdin"];output??=Module["stdout"];error??=Module["stderr"];FS.createStandardStreams(input,output,error)},quit(){FS.initialized=false;for(var stream of FS.streams){if(stream){FS.close(stream)}}},findObject(path,dontResolveLastLink){var ret=FS.analyzePath(path,dontResolveLastLink);if(!ret.exists){return null}return ret.object},analyzePath(path,dontResolveLastLink){try{var lookup=FS.lookupPath(path,{follow:!dontResolveLastLink});path=lookup.path}catch(e){}var ret={isRoot:false,exists:false,error:0,name:null,path:null,object:null,parentExists:false,parentPath:null,parentObject:null};try{var lookup=FS.lookupPath(path,{parent:true});ret.parentExists=true;ret.parentPath=lookup.path;ret.parentObject=lookup.node;ret.name=PATH.basename(path);lookup=FS.lookupPath(path,{follow:!dontResolveLastLink});ret.exists=true;ret.path=lookup.path;ret.object=lookup.node;ret.name=lookup.node.name;ret.isRoot=lookup.path==="/"}catch(e){ret.error=e.errno}return ret},createPath(parent,path,canRead,canWrite){parent=typeof parent=="string"?parent:FS.getPath(parent);var parts=path.split("/").reverse();while(parts.length){var part=parts.pop();if(!part)continue;var current=PATH.join2(parent,part);try{FS.mkdir(current)}catch(e){if(e.errno!=20)throw e}parent=current}return current},createFile(parent,name,properties,canRead,canWrite){var path=PATH.join2(typeof parent=="string"?parent:FS.getPath(parent),name);var mode=FS_getMode(canRead,canWrite);return FS.create(path,mode)},createDataFile(parent,name,data,canRead,canWrite,canOwn){var path=name;if(parent){parent=typeof parent=="string"?parent:FS.getPath(parent);path=name?PATH.join2(parent,name):parent}var mode=FS_getMode(canRead,canWrite);var node=FS.create(path,mode);if(data){if(typeof data=="string"){var arr=new Array(data.length);for(var i=0,len=data.length;i<len;++i)arr[i]=data.charCodeAt(i);data=arr}FS.chmod(node,mode|146);var stream=FS.open(node,577);FS.write(stream,data,0,data.length,0,canOwn);FS.close(stream);FS.chmod(node,mode)}},createDevice(parent,name,input,output){var path=PATH.join2(typeof parent=="string"?parent:FS.getPath(parent),name);var mode=FS_getMode(!!input,!!output);FS.createDevice.major??=64;var dev=FS.makedev(FS.createDevice.major++,0);FS.registerDevice(dev,{open(stream){stream.seekable=false},close(stream){if(output?.buffer?.length){output(10)}},read(stream,buffer,offset,length,pos){var bytesRead=0;for(var i=0;i<length;i++){var result;try{result=input()}catch(e){throw new FS.ErrnoError(29)}if(result===undefined&&bytesRead===0){throw new FS.ErrnoError(6)}if(result===null||result===undefined)break;bytesRead++;buffer[offset+i]=result}if(bytesRead){stream.node.atime=Date.now()}return bytesRead},write(stream,buffer,offset,length,pos){for(var i=0;i<length;i++){try{output(buffer[offset+i])}catch(e){throw new FS.ErrnoError(29)}}if(length){stream.node.mtime=stream.node.ctime=Date.now()}return i}});return FS.mkdev(path,mode,dev)},forceLoadFile(obj){if(obj.isDevice||obj.isFolder||obj.link||obj.contents)return true;if(globalThis.XMLHttpRequest){abort("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")}else{try{obj.contents=readBinary(obj.url)}catch(e){throw new FS.ErrnoError(29)}}},createLazyFile(parent,name,url,canRead,canWrite){class LazyUint8Array{lengthKnown=false;chunks=[];get(idx){if(idx>this.length-1||idx<0){return undefined}var chunkOffset=idx%this.chunkSize;var chunkNum=idx/this.chunkSize|0;return this.getter(chunkNum)[chunkOffset]}setDataGetter(getter){this.getter=getter}cacheLength(){var xhr=new XMLHttpRequest;xhr.open("HEAD",url,false);xhr.send(null);if(!(xhr.status>=200&&xhr.status<300||xhr.status===304))abort("Couldn\'t load "+url+". Status: "+xhr.status);var datalength=Number(xhr.getResponseHeader("Content-length"));var header;var hasByteServing=(header=xhr.getResponseHeader("Accept-Ranges"))&&header==="bytes";var usesGzip=(header=xhr.getResponseHeader("Content-Encoding"))&&header==="gzip";var chunkSize=1024*1024;if(!hasByteServing)chunkSize=datalength;var doXHR=(from,to)=>{if(from>to)abort("invalid range ("+from+", "+to+") or no bytes requested!");if(to>datalength-1)abort("only "+datalength+" bytes available! programmer error!");var xhr=new XMLHttpRequest;xhr.open("GET",url,false);if(datalength!==chunkSize)xhr.setRequestHeader("Range","bytes="+from+"-"+to);xhr.responseType="arraybuffer";if(xhr.overrideMimeType){xhr.overrideMimeType("text/plain; charset=x-user-defined")}xhr.send(null);if(!(xhr.status>=200&&xhr.status<300||xhr.status===304))abort("Couldn\'t load "+url+". Status: "+xhr.status);if(xhr.response!==undefined){return new Uint8Array(xhr.response||[])}return intArrayFromString(xhr.responseText||"",true)};var lazyArray=this;lazyArray.setDataGetter(chunkNum=>{var start=chunkNum*chunkSize;var end=(chunkNum+1)*chunkSize-1;end=Math.min(end,datalength-1);if(typeof lazyArray.chunks[chunkNum]=="undefined"){lazyArray.chunks[chunkNum]=doXHR(start,end)}if(typeof lazyArray.chunks[chunkNum]=="undefined")abort("doXHR failed!");return lazyArray.chunks[chunkNum]});if(usesGzip||!datalength){chunkSize=datalength=1;datalength=this.getter(0).length;chunkSize=datalength;out("LazyFiles on gzip forces download of the whole file when length is accessed")}this._length=datalength;this._chunkSize=chunkSize;this.lengthKnown=true}get length(){if(!this.lengthKnown){this.cacheLength()}return this._length}get chunkSize(){if(!this.lengthKnown){this.cacheLength()}return this._chunkSize}}if(globalThis.XMLHttpRequest){if(!ENVIRONMENT_IS_WORKER)abort("Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc");var lazyArray=new LazyUint8Array;var properties={isDevice:false,contents:lazyArray}}else{var properties={isDevice:false,url}}var node=FS.createFile(parent,name,properties,canRead,canWrite);if(properties.contents){node.contents=properties.contents}else if(properties.url){node.contents=null;node.url=properties.url}Object.defineProperties(node,{usedBytes:{get:function(){return this.contents.length}}});var stream_ops={};for(const[key,fn]of Object.entries(node.stream_ops)){stream_ops[key]=(...args)=>{FS.forceLoadFile(node);return fn(...args)}}function writeChunks(stream,buffer,offset,length,position){var contents=stream.node.contents;if(position>=contents.length)return 0;var size=Math.min(contents.length-position,length);if(contents.slice){for(var i=0;i<size;i++){buffer[offset+i]=contents[position+i]}}else{for(var i=0;i<size;i++){buffer[offset+i]=contents.get(position+i)}}return size}stream_ops.read=(stream,buffer,offset,length,position)=>{FS.forceLoadFile(node);return writeChunks(stream,buffer,offset,length,position)};stream_ops.mmap=(stream,length,position,prot,flags)=>{FS.forceLoadFile(node);var ptr=mmapAlloc(length);if(!ptr){throw new FS.ErrnoError(48)}writeChunks(stream,(growMemViews(),HEAP8),ptr,length,position);return{ptr,allocated:true}};node.stream_ops=stream_ops;return node}};var UTF8ToString=(ptr,maxBytesToRead,ignoreNul)=>ptr?UTF8ArrayToString((growMemViews(),HEAPU8),ptr,maxBytesToRead,ignoreNul):"";var SYSCALLS={DEFAULT_POLLMASK:5,calculateAt(dirfd,path,allowEmpty){if(PATH.isAbs(path)){return path}var dir;if(dirfd===-100){dir=FS.cwd()}else{var dirstream=SYSCALLS.getStreamFromFD(dirfd);dir=dirstream.path}if(path.length==0){if(!allowEmpty){throw new FS.ErrnoError(44)}return dir}return dir+"/"+path},writeStat(buf,stat){(growMemViews(),HEAPU32)[buf/4]=stat.dev;(growMemViews(),HEAPU32)[(buf+4)/4]=stat.mode;(growMemViews(),HEAPU64)[(buf+8)/8]=BigInt(stat.nlink);(growMemViews(),HEAPU32)[(buf+16)/4]=stat.uid;(growMemViews(),HEAPU32)[(buf+20)/4]=stat.gid;(growMemViews(),HEAPU32)[(buf+24)/4]=stat.rdev;(growMemViews(),HEAP64)[(buf+32)/8]=BigInt(stat.size);(growMemViews(),HEAP32)[(buf+40)/4]=4096;(growMemViews(),HEAP32)[(buf+44)/4]=stat.blocks;var atime=stat.atime.getTime();var mtime=stat.mtime.getTime();var ctime=stat.ctime.getTime();(growMemViews(),HEAP64)[(buf+48)/8]=BigInt(Math.floor(atime/1e3));(growMemViews(),HEAPU64)[(buf+56)/8]=BigInt(atime%1e3*1e3*1e3);(growMemViews(),HEAP64)[(buf+64)/8]=BigInt(Math.floor(mtime/1e3));(growMemViews(),HEAPU64)[(buf+72)/8]=BigInt(mtime%1e3*1e3*1e3);(growMemViews(),HEAP64)[(buf+80)/8]=BigInt(Math.floor(ctime/1e3));(growMemViews(),HEAPU64)[(buf+88)/8]=BigInt(ctime%1e3*1e3*1e3);(growMemViews(),HEAP64)[(buf+96)/8]=BigInt(stat.ino);return 0},writeStatFs(buf,stats){(growMemViews(),HEAPU32)[(buf+8)/4]=stats.bsize;(growMemViews(),HEAPU32)[(buf+72)/4]=stats.bsize;(growMemViews(),HEAP64)[(buf+16)/8]=BigInt(stats.blocks);(growMemViews(),HEAP64)[(buf+24)/8]=BigInt(stats.bfree);(growMemViews(),HEAP64)[(buf+32)/8]=BigInt(stats.bavail);(growMemViews(),HEAP64)[(buf+40)/8]=BigInt(stats.files);(growMemViews(),HEAP64)[(buf+48)/8]=BigInt(stats.ffree);(growMemViews(),HEAPU32)[(buf+56)/4]=stats.fsid;(growMemViews(),HEAPU32)[(buf+80)/4]=stats.flags;(growMemViews(),HEAPU32)[(buf+64)/4]=stats.namelen},doMsync(addr,stream,len,flags,offset){if(!FS.isFile(stream.node.mode)){throw new FS.ErrnoError(43)}if(flags&2){return 0}var buffer=(growMemViews(),HEAPU8).slice(addr,addr+len);FS.msync(stream,buffer,offset,len,flags)},getStreamFromFD(fd){var stream=FS.getStreamChecked(fd);return stream},varargs:undefined,getStr(ptr){var ret=UTF8ToString(ptr);return ret}};function ___syscall_fcntl64(fd,cmd,varargs){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(3,0,1,fd,cmd,varargs);varargs=bigintToI53Checked(varargs);SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD(fd);switch(cmd){case 0:{var arg=syscallGetVarargI();if(arg<0){return-28}while(FS.streams[arg]){arg++}var newStream;newStream=FS.dupStream(stream,arg);return newStream.fd}case 1:case 2:return 0;case 3:return stream.flags;case 4:{var arg=syscallGetVarargI();stream.flags|=arg;return 0}case 5:{var arg=syscallGetVarargP();var offset=0;(growMemViews(),HEAP16)[(arg+offset)/2]=2;return 0}case 6:case 7:return 0}return-28}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_fstat64(fd,buf){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(4,0,1,fd,buf);buf=bigintToI53Checked(buf);try{return SYSCALLS.writeStat(buf,FS.fstat(fd))}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}var stringToUTF8=(str,outPtr,maxBytesToWrite)=>stringToUTF8Array(str,(growMemViews(),HEAPU8),outPtr,maxBytesToWrite);function ___syscall_getcwd(buf,size){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(5,0,1,buf,size);buf=bigintToI53Checked(buf);size=bigintToI53Checked(size);try{if(size===0)return-28;var cwd=FS.cwd();var cwdLengthInBytes=lengthBytesUTF8(cwd)+1;if(size<cwdLengthInBytes)return-68;stringToUTF8(cwd,buf,size);return cwdLengthInBytes}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_getdents64(fd,dirp,count){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(6,0,1,fd,dirp,count);dirp=bigintToI53Checked(dirp);count=bigintToI53Checked(count);try{var stream=SYSCALLS.getStreamFromFD(fd);stream.getdents||=FS.readdir(stream.path);var struct_size=280;var pos=0;var off=FS.llseek(stream,0,1);var startIdx=Math.floor(off/struct_size);var endIdx=Math.min(stream.getdents.length,startIdx+Math.floor(count/struct_size));for(var idx=startIdx;idx<endIdx;idx++){var id;var type;var name=stream.getdents[idx];if(name==="."){id=stream.node.id;type=4}else if(name===".."){var lookup=FS.lookupPath(stream.path,{parent:true});id=lookup.node.id;type=4}else{var child;try{child=FS.lookupNode(stream.node,name)}catch(e){if(e?.errno===28){continue}throw e}id=child.id;type=FS.isChrdev(child.mode)?2:FS.isDir(child.mode)?4:FS.isLink(child.mode)?10:8}(growMemViews(),HEAP64)[(dirp+pos)/8]=BigInt(id);(growMemViews(),HEAP64)[(dirp+pos+8)/8]=BigInt((idx+1)*struct_size);(growMemViews(),HEAP16)[(dirp+pos+16)/2]=280;(growMemViews(),HEAP8)[dirp+pos+18]=type;stringToUTF8(name,dirp+pos+19,256);pos+=struct_size}FS.llseek(stream,idx*struct_size,0);return pos}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_ioctl(fd,op,varargs){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(7,0,1,fd,op,varargs);varargs=bigintToI53Checked(varargs);SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD(fd);switch(op){case 21509:{if(!stream.tty)return-59;return 0}case 21505:{if(!stream.tty)return-59;if(stream.tty.ops.ioctl_tcgets){var termios=stream.tty.ops.ioctl_tcgets(stream);var argp=syscallGetVarargP();(growMemViews(),HEAP32)[argp/4]=termios.c_iflag||0;(growMemViews(),HEAP32)[(argp+4)/4]=termios.c_oflag||0;(growMemViews(),HEAP32)[(argp+8)/4]=termios.c_cflag||0;(growMemViews(),HEAP32)[(argp+12)/4]=termios.c_lflag||0;for(var i=0;i<32;i++){(growMemViews(),HEAP8)[argp+i+17]=termios.c_cc[i]||0}return 0}return 0}case 21510:case 21511:case 21512:{if(!stream.tty)return-59;return 0}case 21506:case 21507:case 21508:{if(!stream.tty)return-59;if(stream.tty.ops.ioctl_tcsets){var argp=syscallGetVarargP();var c_iflag=(growMemViews(),HEAP32)[argp/4];var c_oflag=(growMemViews(),HEAP32)[(argp+4)/4];var c_cflag=(growMemViews(),HEAP32)[(argp+8)/4];var c_lflag=(growMemViews(),HEAP32)[(argp+12)/4];var c_cc=[];for(var i=0;i<32;i++){c_cc.push((growMemViews(),HEAP8)[argp+i+17])}return stream.tty.ops.ioctl_tcsets(stream.tty,op,{c_iflag,c_oflag,c_cflag,c_lflag,c_cc})}return 0}case 21519:{if(!stream.tty)return-59;var argp=syscallGetVarargP();(growMemViews(),HEAP32)[argp/4]=0;return 0}case 21520:{if(!stream.tty)return-59;return-28}case 21537:case 21531:{var argp=syscallGetVarargP();return FS.ioctl(stream,op,argp)}case 21523:{if(!stream.tty)return-59;if(stream.tty.ops.ioctl_tiocgwinsz){var winsize=stream.tty.ops.ioctl_tiocgwinsz(stream.tty);var argp=syscallGetVarargP();(growMemViews(),HEAP16)[argp/2]=winsize[0];(growMemViews(),HEAP16)[(argp+2)/2]=winsize[1]}return 0}case 21524:{if(!stream.tty)return-59;return 0}case 21515:{if(!stream.tty)return-59;return 0}default:return-28}}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_lstat64(path,buf){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(8,0,1,path,buf);path=bigintToI53Checked(path);buf=bigintToI53Checked(buf);try{path=SYSCALLS.getStr(path);return SYSCALLS.writeStat(buf,FS.lstat(path))}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_newfstatat(dirfd,path,buf,flags){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(9,0,1,dirfd,path,buf,flags);path=bigintToI53Checked(path);buf=bigintToI53Checked(buf);try{path=SYSCALLS.getStr(path);var nofollow=flags&256;var allowEmpty=flags&4096;flags=flags&~6400;path=SYSCALLS.calculateAt(dirfd,path,allowEmpty);return SYSCALLS.writeStat(buf,nofollow?FS.lstat(path):FS.stat(path))}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_openat(dirfd,path,flags,varargs){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(10,0,1,dirfd,path,flags,varargs);path=bigintToI53Checked(path);varargs=bigintToI53Checked(varargs);SYSCALLS.varargs=varargs;try{path=SYSCALLS.getStr(path);path=SYSCALLS.calculateAt(dirfd,path);var mode=varargs?syscallGetVarargI():0;return FS.open(path,flags,mode).fd}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_stat64(path,buf){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(11,0,1,path,buf);path=bigintToI53Checked(path);buf=bigintToI53Checked(buf);try{path=SYSCALLS.getStr(path);return SYSCALLS.writeStat(buf,FS.stat(path))}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}var __abort_js=()=>abort("");function __emscripten_init_main_thread_js(tb){tb=bigintToI53Checked(tb);__emscripten_thread_init(tb,!ENVIRONMENT_IS_WORKER,1,!ENVIRONMENT_IS_WEB,16777216,false);PThread.threadInitTLS()}var handleException=e=>{if(e instanceof ExitStatus||e=="unwind"){return EXITSTATUS}quit_(1,e)};var maybeExit=()=>{if(!keepRuntimeAlive()){try{if(ENVIRONMENT_IS_PTHREAD){if(_pthread_self())__emscripten_thread_exit(EXITSTATUS);return}_exit(EXITSTATUS)}catch(e){handleException(e)}}};var callUserCallback=func=>{if(ABORT){return}try{func();maybeExit()}catch(e){handleException(e)}};function __emscripten_thread_mailbox_await(pthread_ptr){pthread_ptr=bigintToI53Checked(pthread_ptr);if(Atomics.waitAsync){var wait=Atomics.waitAsync((growMemViews(),HEAP32),pthread_ptr/4,pthread_ptr);wait.value.then(checkMailbox);var waitingAsync=pthread_ptr+228;Atomics.store((growMemViews(),HEAP32),waitingAsync/4,1)}}var checkMailbox=()=>callUserCallback(()=>{var pthread_ptr=_pthread_self();if(pthread_ptr){__emscripten_thread_mailbox_await(pthread_ptr);__emscripten_check_mailbox()}});function __emscripten_notify_mailbox_postmessage(targetThread,currThreadId){targetThread=bigintToI53Checked(targetThread);currThreadId=bigintToI53Checked(currThreadId);if(targetThread==currThreadId){setTimeout(checkMailbox)}else if(ENVIRONMENT_IS_PTHREAD){postMessage({targetThread,cmd:"checkMailbox"})}else{var worker=PThread.pthreads[targetThread];if(!worker){return}worker.postMessage({cmd:"checkMailbox"})}}var proxiedJSCallArgs=[];function __emscripten_receive_on_main_thread_js(funcIndex,emAsmAddr,callingThread,numCallArgs,args){emAsmAddr=bigintToI53Checked(emAsmAddr);callingThread=bigintToI53Checked(callingThread);args=bigintToI53Checked(args);numCallArgs/=2;proxiedJSCallArgs.length=numCallArgs;var b=args/8;for(var i=0;i<numCallArgs;i++){if((growMemViews(),HEAP64)[b+2*i]){proxiedJSCallArgs[i]=(growMemViews(),HEAP64)[b+2*i+1]}else{proxiedJSCallArgs[i]=(growMemViews(),HEAPF64)[b+2*i+1]}}var func=proxiedFunctionTable[funcIndex];PThread.currentProxiedOperationCallerThread=callingThread;var rtn=func(...proxiedJSCallArgs);PThread.currentProxiedOperationCallerThread=0;if(typeof rtn=="bigint"){rtn=bigintToI53Checked(rtn)}return rtn}function __emscripten_thread_cleanup(thread){thread=bigintToI53Checked(thread);if(!ENVIRONMENT_IS_PTHREAD)cleanupThread(thread);else postMessage({cmd:"cleanupThread",thread})}function __emscripten_thread_set_strongref(thread){thread=bigintToI53Checked(thread);if(ENVIRONMENT_IS_NODE){PThread.pthreads[thread].ref()}}function __localtime_js(time,tmPtr){time=bigintToI53Checked(time);tmPtr=bigintToI53Checked(tmPtr);const date=new Date(time*1e3);(growMemViews(),HEAP32)[tmPtr/4]=date.getSeconds();(growMemViews(),HEAP32)[(tmPtr+4)/4]=date.getMinutes();(growMemViews(),HEAP32)[(tmPtr+8)/4]=date.getHours();(growMemViews(),HEAP32)[(tmPtr+12)/4]=date.getDate();(growMemViews(),HEAP32)[(tmPtr+16)/4]=date.getMonth();(growMemViews(),HEAP32)[(tmPtr+20)/4]=date.getFullYear()-1900;(growMemViews(),HEAP32)[(tmPtr+24)/4]=date.getDay();const year=date.getFullYear();const leap=year%4===0&&(year%100!==0||year%400===0);const cumulative=leap?[0,31,60,91,121,152,182,213,244,274,305,335]:[0,31,59,90,120,151,181,212,243,273,304,334];(growMemViews(),HEAP32)[(tmPtr+28)/4]=cumulative[date.getMonth()]+date.getDate()-1;(growMemViews(),HEAP64)[(tmPtr+40)/8]=BigInt(-(date.getTimezoneOffset()*60));const start=new Date(year,0,1);const summerOffset=new Date(year,6,1).getTimezoneOffset();const winterOffset=start.getTimezoneOffset();const dst=(summerOffset!==winterOffset&&date.getTimezoneOffset()===Math.min(winterOffset,summerOffset))|0;(growMemViews(),HEAP32)[(tmPtr+32)/4]=dst}function __mmap_js(len,prot,flags,fd,offset,allocated,addr){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(12,0,1,len,prot,flags,fd,offset,allocated,addr);len=bigintToI53Checked(len);offset=bigintToI53Checked(offset);allocated=bigintToI53Checked(allocated);addr=bigintToI53Checked(addr);try{var stream=SYSCALLS.getStreamFromFD(fd);var res=FS.mmap(stream,len,offset,prot,flags);var ptr=res.ptr;(growMemViews(),HEAP32)[allocated/4]=res.allocated;(growMemViews(),HEAPU64)[addr/8]=BigInt(ptr);return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function __munmap_js(addr,len,prot,flags,fd,offset){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(13,0,1,addr,len,prot,flags,fd,offset);addr=bigintToI53Checked(addr);len=bigintToI53Checked(len);offset=bigintToI53Checked(offset);try{var stream=SYSCALLS.getStreamFromFD(fd);if(prot&2){SYSCALLS.doMsync(addr,stream,len,flags,offset)}}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}var __tzset_js=function(timezone,daylight,std_name,dst_name){timezone=bigintToI53Checked(timezone);daylight=bigintToI53Checked(daylight);std_name=bigintToI53Checked(std_name);dst_name=bigintToI53Checked(dst_name);var currentYear=(new Date).getFullYear();var winter=new Date(currentYear,0,1);var summer=new Date(currentYear,6,1);var winterOffset=winter.getTimezoneOffset();var summerOffset=summer.getTimezoneOffset();var stdTimezoneOffset=Math.max(winterOffset,summerOffset);(growMemViews(),HEAPU64)[timezone/8]=BigInt(stdTimezoneOffset*60);(growMemViews(),HEAP32)[daylight/4]=Number(winterOffset!=summerOffset);var extractZone=timezoneOffset=>{var sign=timezoneOffset>=0?"-":"+";var absOffset=Math.abs(timezoneOffset);var hours=String(Math.floor(absOffset/60)).padStart(2,"0");var minutes=String(absOffset%60).padStart(2,"0");return`UTC${sign}${hours}${minutes}`};var winterName=extractZone(winterOffset);var summerName=extractZone(summerOffset);if(summerOffset<winterOffset){stringToUTF8(winterName,std_name,17);stringToUTF8(summerName,dst_name,17)}else{stringToUTF8(winterName,dst_name,17);stringToUTF8(summerName,std_name,17)}};var _emscripten_get_now=()=>performance.timeOrigin+performance.now();var _emscripten_date_now=()=>Date.now();var nowIsMonotonic=1;var checkWasiClock=clock_id=>clock_id>=0&&clock_id<=3;function _clock_time_get(clk_id,ignored_precision,ptime){ignored_precision=bigintToI53Checked(ignored_precision);ptime=bigintToI53Checked(ptime);if(!checkWasiClock(clk_id)){return 28}var now;if(clk_id===0){now=_emscripten_date_now()}else if(nowIsMonotonic){now=_emscripten_get_now()}else{return 52}var nsec=Math.round(now*1e3*1e3);(growMemViews(),HEAP64)[ptime/8]=BigInt(nsec);return 0}var _emscripten_check_blocking_allowed=()=>{};var runtimeKeepalivePush=()=>{runtimeKeepaliveCounter+=1};var _emscripten_exit_with_live_runtime=()=>{runtimeKeepalivePush();throw"unwind"};var jsStackTrace=()=>(new Error).stack.toString();var getCallstack=flags=>{var callstack=jsStackTrace();var lines=callstack.split("\\n");callstack="";var firefoxRe=new RegExp("\\\\s*(.*?)@(.*?):([0-9]+):([0-9]+)");var chromeRe=new RegExp("\\\\s*at (.*?) \\\\((.*):(.*):(.*)\\\\)");for(var line of lines){var symbolName="";var file="";var lineno=0;var column=0;var parts=chromeRe.exec(line);if(parts?.length==5){symbolName=parts[1];file=parts[2];lineno=parts[3];column=parts[4]}else{parts=firefoxRe.exec(line);if(parts?.length>=4){symbolName=parts[1];file=parts[2];lineno=parts[3];column=parts[4]|0}else{callstack+=line+"\\n";continue}}if(symbolName=="_emscripten_log"||symbolName=="_emscripten_get_callstack"){callstack="";continue}if(flags&24){if(flags&64){file=file.substring(file.replace(/\\\\/g,"/").lastIndexOf("/")+1)}callstack+=`    at ${symbolName} (${file}:${lineno}:${column})\\n`}}callstack=callstack.replace(/\\s+$/,"");return callstack};function _emscripten_get_callstack(flags,str,maxbytes){str=bigintToI53Checked(str);var callstack=getCallstack(flags);if(!str||maxbytes<=0){return lengthBytesUTF8(callstack)+1}var bytesWrittenExcludingNull=stringToUTF8(callstack,str,maxbytes);return bytesWrittenExcludingNull+1}var getHeapMax=()=>4294967296;var _emscripten_get_heap_max=()=>BigInt(getHeapMax());var _emscripten_has_asyncify=()=>2;var _emscripten_num_logical_cores=()=>ENVIRONMENT_IS_NODE?require("os").cpus().length:navigator["hardwareConcurrency"];var growMemory=size=>{var oldHeapSize=wasmMemory.buffer.byteLength;var pages=(size-oldHeapSize+65535)/65536|0;try{wasmMemory.grow(BigInt(pages));updateMemoryViews();return 1}catch(e){}};function _emscripten_resize_heap(requestedSize){requestedSize=bigintToI53Checked(requestedSize);var oldSize=(growMemViews(),HEAPU8).length;if(requestedSize<=oldSize){return false}var maxHeapSize=getHeapMax();if(requestedSize>maxHeapSize){return false}for(var cutDown=1;cutDown<=4;cutDown*=2){var overGrownHeapSize=oldSize*(1+.2/cutDown);overGrownHeapSize=Math.min(overGrownHeapSize,requestedSize+100663296);var newSize=Math.min(maxHeapSize,alignMemory(Math.max(requestedSize,overGrownHeapSize),65536));var replacement=growMemory(newSize);if(replacement){return true}}return false}var stringToUTF8OnStack=str=>{var size=lengthBytesUTF8(str)+1;var ret=stackAlloc(size);stringToUTF8(str,ret,size);return ret};var writeI53ToI64=(ptr,num)=>{(growMemViews(),HEAPU32)[ptr/4]=num;var lower=(growMemViews(),HEAPU32)[ptr/4];(growMemViews(),HEAPU32)[(ptr+4)/4]=(num-lower)/4294967296};var stringToNewUTF8=str=>{var size=lengthBytesUTF8(str)+1;var ret=_malloc(size);if(ret)stringToUTF8(str,ret,size);return ret};var readI53FromI64=ptr=>(growMemViews(),HEAPU32)[ptr/4]+(growMemViews(),HEAP32)[(ptr+4)/4]*4294967296;var WebGPU={Internals:{jsObjects:[],jsObjectInsert:(ptr,jsObject)=>{WebGPU.Internals.jsObjects[ptr]=jsObject},bufferOnUnmaps:[],futures:[],futureInsert:(futureId,promise)=>{WebGPU.Internals.futures[futureId]=new Promise(resolve=>promise.finally(()=>resolve(futureId)))}},getJsObject:ptr=>{if(!ptr)return undefined;return WebGPU.Internals.jsObjects[ptr]},importJsAdapter:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateAdapter(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsBindGroup:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateBindGroup(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsBindGroupLayout:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateBindGroupLayout(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsBuffer:(buffer,parentPtr=0)=>{assert(buffer.mapState==="unmapped");var bufferPtr=_emwgpuCreateBuffer(parentPtr);WebGPU.Internals.jsObjectInsert(bufferPtr,buffer);return bufferPtr},importJsCommandBuffer:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateCommandBuffer(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsCommandEncoder:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateCommandEncoder(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsComputePassEncoder:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateComputePassEncoder(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsComputePipeline:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateComputePipeline(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsDevice:(device,parentPtr=0)=>{var queuePtr=_emwgpuCreateQueue(parentPtr);var devicePtr=_emwgpuCreateDevice(parentPtr,queuePtr);WebGPU.Internals.jsObjectInsert(queuePtr,device.queue);WebGPU.Internals.jsObjectInsert(devicePtr,device);return devicePtr},importJsExternalTexture:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateExternalTexture(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsPipelineLayout:(obj,parentPtr=0)=>{var ptr=_emwgpuCreatePipelineLayout(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsQuerySet:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateQuerySet(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsQueue:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateQueue(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsRenderBundle:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateRenderBundle(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsRenderBundleEncoder:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateRenderBundleEncoder(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsRenderPassEncoder:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateRenderPassEncoder(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsRenderPipeline:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateRenderPipeline(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsSampler:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateSampler(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsShaderModule:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateShaderModule(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsSurface:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateSurface(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsTexture:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateTexture(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},importJsTextureView:(obj,parentPtr=0)=>{var ptr=_emwgpuCreateTextureView(parentPtr);WebGPU.Internals.jsObjects[ptr]=obj;return ptr},errorCallback:(callback,type,message,userdata)=>{var sp=stackSave();var messagePtr=stringToUTF8OnStack(message);((a1,a2,a3)=>getWasmTableEntry(callback).call(null,a1,BigInt(a2),BigInt(a3)))(type,BigInt(messagePtr),userdata);stackRestore(sp)},iterateExtensions:(root,handlers)=>{for(var ptr=Number((growMemViews(),HEAPU64)[root/8]);ptr;ptr=Number((growMemViews(),HEAPU64)[ptr/8])){var sType=(growMemViews(),HEAP32)[(ptr+8)/4];var handler=handlers[sType](ptr)}},setStringView:(ptr,data,length)=>{(growMemViews(),HEAPU64)[ptr/8]=BigInt(data);(growMemViews(),HEAPU64)[(ptr+8)/8]=BigInt(length)},makeStringFromStringView:stringViewPtr=>{var ptr=Number((growMemViews(),HEAPU64)[stringViewPtr/8]);var length=Number((growMemViews(),HEAPU64)[(stringViewPtr+8)/8]);return UTF8ToString(ptr,length)},makeStringFromOptionalStringView:stringViewPtr=>{var ptr=Number((growMemViews(),HEAPU64)[stringViewPtr/8]);var length=Number((growMemViews(),HEAPU64)[(stringViewPtr+8)/8]);if(!ptr){if(length===0){return""}return undefined}return UTF8ToString(ptr,length)},makeColor:ptr=>({r:(growMemViews(),HEAPF64)[ptr/8],g:(growMemViews(),HEAPF64)[(ptr+8)/8],b:(growMemViews(),HEAPF64)[(ptr+16)/8],a:(growMemViews(),HEAPF64)[(ptr+24)/8]}),makeExtent3D:ptr=>({width:(growMemViews(),HEAPU32)[ptr/4],height:(growMemViews(),HEAPU32)[(ptr+4)/4],depthOrArrayLayers:(growMemViews(),HEAPU32)[(ptr+8)/4]}),makeOrigin3D:ptr=>({x:(growMemViews(),HEAPU32)[ptr/4],y:(growMemViews(),HEAPU32)[(ptr+4)/4],z:(growMemViews(),HEAPU32)[(ptr+8)/4]}),makeTexelCopyTextureInfo:ptr=>({texture:WebGPU.getJsObject(Number((growMemViews(),HEAPU64)[ptr/8])),mipLevel:(growMemViews(),HEAPU32)[(ptr+8)/4],origin:WebGPU.makeOrigin3D(ptr+12),aspect:WebGPU.TextureAspect[(growMemViews(),HEAP32)[(ptr+24)/4]]}),makeTexelCopyBufferLayout:ptr=>{var bytesPerRow=(growMemViews(),HEAPU32)[(ptr+8)/4];var rowsPerImage=(growMemViews(),HEAPU32)[(ptr+12)/4];return{offset:readI53FromI64(ptr),bytesPerRow:bytesPerRow===4294967295?undefined:bytesPerRow,rowsPerImage:rowsPerImage===4294967295?undefined:rowsPerImage}},makeTexelCopyBufferInfo:ptr=>{var layoutPtr=ptr+0;var bufferCopyView=WebGPU.makeTexelCopyBufferLayout(layoutPtr);bufferCopyView["buffer"]=WebGPU.getJsObject(Number((growMemViews(),HEAPU64)[(ptr+16)/8]));return bufferCopyView},makePassTimestampWrites:ptr=>{if(ptr===0)return undefined;return{querySet:WebGPU.getJsObject(Number((growMemViews(),HEAPU64)[(ptr+8)/8])),beginningOfPassWriteIndex:(growMemViews(),HEAPU32)[(ptr+16)/4],endOfPassWriteIndex:(growMemViews(),HEAPU32)[(ptr+20)/4]}},makePipelineConstants:(constantCount,constantsPtr)=>{if(!constantCount)return;var constants={};for(var i=0;i<constantCount;++i){var entryPtr=constantsPtr+32*i;var key=WebGPU.makeStringFromStringView(entryPtr+8);constants[key]=(growMemViews(),HEAPF64)[(entryPtr+24)/8]}return constants},makePipelineLayout:layoutPtr=>{if(!layoutPtr)return"auto";return WebGPU.getJsObject(layoutPtr)},makeComputeState:ptr=>{if(!ptr)return undefined;var desc={module:WebGPU.getJsObject(Number((growMemViews(),HEAPU64)[(ptr+8)/8])),constants:WebGPU.makePipelineConstants(Number((growMemViews(),HEAPU64)[(ptr+32)/8]),Number((growMemViews(),HEAPU64)[(ptr+40)/8])),entryPoint:WebGPU.makeStringFromOptionalStringView(ptr+16)};return desc},makeComputePipelineDesc:descriptor=>{var desc={label:WebGPU.makeStringFromOptionalStringView(descriptor+8),layout:WebGPU.makePipelineLayout(Number((growMemViews(),HEAPU64)[(descriptor+24)/8])),compute:WebGPU.makeComputeState(descriptor+32)};return desc},makeRenderPipelineDesc:descriptor=>{function makePrimitiveState(psPtr){if(!psPtr)return undefined;return{topology:WebGPU.PrimitiveTopology[(growMemViews(),HEAP32)[(psPtr+8)/4]],stripIndexFormat:WebGPU.IndexFormat[(growMemViews(),HEAP32)[(psPtr+12)/4]],frontFace:WebGPU.FrontFace[(growMemViews(),HEAP32)[(psPtr+16)/4]],cullMode:WebGPU.CullMode[(growMemViews(),HEAP32)[(psPtr+20)/4]],unclippedDepth:!!(growMemViews(),HEAPU32)[(psPtr+24)/4]}}function makeBlendComponent(bdPtr){if(!bdPtr)return undefined;return{operation:WebGPU.BlendOperation[(growMemViews(),HEAP32)[bdPtr/4]],srcFactor:WebGPU.BlendFactor[(growMemViews(),HEAP32)[(bdPtr+4)/4]],dstFactor:WebGPU.BlendFactor[(growMemViews(),HEAP32)[(bdPtr+8)/4]]}}function makeBlendState(bsPtr){if(!bsPtr)return undefined;return{alpha:makeBlendComponent(bsPtr+12),color:makeBlendComponent(bsPtr+0)}}function makeColorState(csPtr){var format=WebGPU.TextureFormat[(growMemViews(),HEAP32)[(csPtr+8)/4]];return format?{format,blend:makeBlendState(Number((growMemViews(),HEAPU64)[(csPtr+16)/8])),writeMask:(growMemViews(),HEAPU32)[(csPtr+24)/4]}:undefined}function makeColorStates(count,csArrayPtr){var states=[];for(var i=0;i<count;++i){states.push(makeColorState(csArrayPtr+32*i))}return states}function makeStencilStateFace(ssfPtr){return{compare:WebGPU.CompareFunction[(growMemViews(),HEAP32)[ssfPtr/4]],failOp:WebGPU.StencilOperation[(growMemViews(),HEAP32)[(ssfPtr+4)/4]],depthFailOp:WebGPU.StencilOperation[(growMemViews(),HEAP32)[(ssfPtr+8)/4]],passOp:WebGPU.StencilOperation[(growMemViews(),HEAP32)[(ssfPtr+12)/4]]}}function makeDepthStencilState(dssPtr){if(!dssPtr)return undefined;return{format:WebGPU.TextureFormat[(growMemViews(),HEAP32)[(dssPtr+8)/4]],depthWriteEnabled:!!(growMemViews(),HEAPU32)[(dssPtr+12)/4],depthCompare:WebGPU.CompareFunction[(growMemViews(),HEAP32)[(dssPtr+16)/4]],stencilFront:makeStencilStateFace(dssPtr+20),stencilBack:makeStencilStateFace(dssPtr+36),stencilReadMask:(growMemViews(),HEAPU32)[(dssPtr+52)/4],stencilWriteMask:(growMemViews(),HEAPU32)[(dssPtr+56)/4],depthBias:(growMemViews(),HEAP32)[(dssPtr+60)/4],depthBiasSlopeScale:(growMemViews(),HEAPF32)[(dssPtr+64)/4],depthBiasClamp:(growMemViews(),HEAPF32)[(dssPtr+68)/4]}}function makeVertexAttribute(vaPtr){return{format:WebGPU.VertexFormat[(growMemViews(),HEAP32)[(vaPtr+8)/4]],offset:readI53FromI64(vaPtr+16),shaderLocation:(growMemViews(),HEAPU32)[(vaPtr+24)/4]}}function makeVertexAttributes(count,vaArrayPtr){var vas=[];for(var i=0;i<count;++i){vas.push(makeVertexAttribute(vaArrayPtr+i*32))}return vas}function makeVertexBuffer(vbPtr){if(!vbPtr)return undefined;var stepMode=WebGPU.VertexStepMode[(growMemViews(),HEAP32)[(vbPtr+8)/4]];var attributeCount=Number((growMemViews(),HEAPU64)[(vbPtr+24)/8]);if(!stepMode&&!attributeCount){return null}return{arrayStride:readI53FromI64(vbPtr+16),stepMode,attributes:makeVertexAttributes(attributeCount,Number((growMemViews(),HEAPU64)[(vbPtr+32)/8]))}}function makeVertexBuffers(count,vbArrayPtr){if(!count)return undefined;var vbs=[];for(var i=0;i<count;++i){vbs.push(makeVertexBuffer(vbArrayPtr+i*40))}return vbs}function makeVertexState(viPtr){if(!viPtr)return undefined;var desc={module:WebGPU.getJsObject(Number((growMemViews(),HEAPU64)[(viPtr+8)/8])),constants:WebGPU.makePipelineConstants(Number((growMemViews(),HEAPU64)[(viPtr+32)/8]),Number((growMemViews(),HEAPU64)[(viPtr+40)/8])),buffers:makeVertexBuffers(Number((growMemViews(),HEAPU64)[(viPtr+48)/8]),Number((growMemViews(),HEAPU64)[(viPtr+56)/8])),entryPoint:WebGPU.makeStringFromOptionalStringView(viPtr+16)};return desc}function makeMultisampleState(msPtr){if(!msPtr)return undefined;return{count:(growMemViews(),HEAPU32)[(msPtr+8)/4],mask:(growMemViews(),HEAPU32)[(msPtr+12)/4],alphaToCoverageEnabled:!!(growMemViews(),HEAPU32)[(msPtr+16)/4]}}function makeFragmentState(fsPtr){if(!fsPtr)return undefined;var desc={module:WebGPU.getJsObject(Number((growMemViews(),HEAPU64)[(fsPtr+8)/8])),constants:WebGPU.makePipelineConstants(Number((growMemViews(),HEAPU64)[(fsPtr+32)/8]),Number((growMemViews(),HEAPU64)[(fsPtr+40)/8])),targets:makeColorStates(Number((growMemViews(),HEAPU64)[(fsPtr+48)/8]),Number((growMemViews(),HEAPU64)[(fsPtr+56)/8])),entryPoint:WebGPU.makeStringFromOptionalStringView(fsPtr+16)};return desc}var desc={label:WebGPU.makeStringFromOptionalStringView(descriptor+8),layout:WebGPU.makePipelineLayout(Number((growMemViews(),HEAPU64)[(descriptor+24)/8])),vertex:makeVertexState(descriptor+32),primitive:makePrimitiveState(descriptor+96),depthStencil:makeDepthStencilState(Number((growMemViews(),HEAPU64)[(descriptor+128)/8])),multisample:makeMultisampleState(descriptor+136),fragment:makeFragmentState(Number((growMemViews(),HEAPU64)[(descriptor+160)/8]))};return desc},fillLimitStruct:(limits,limitsOutPtr)=>{var nextInChainPtr=Number((growMemViews(),HEAPU64)[limitsOutPtr/8]);function setLimitValueU32(name,basePtr,limitOffset,fallbackValue=0){var limitValue=limits[name]??fallbackValue;(growMemViews(),HEAPU32)[(basePtr+limitOffset)/4]=limitValue}function setLimitValueU64(name,basePtr,limitOffset,fallbackValue=0){var limitValue=limits[name]??fallbackValue;writeI53ToI64(basePtr+limitOffset,limitValue)}setLimitValueU32("maxTextureDimension1D",limitsOutPtr,8);setLimitValueU32("maxTextureDimension2D",limitsOutPtr,12);setLimitValueU32("maxTextureDimension3D",limitsOutPtr,16);setLimitValueU32("maxTextureArrayLayers",limitsOutPtr,20);setLimitValueU32("maxBindGroups",limitsOutPtr,24);setLimitValueU32("maxBindGroupsPlusVertexBuffers",limitsOutPtr,28);setLimitValueU32("maxBindingsPerBindGroup",limitsOutPtr,32);setLimitValueU32("maxDynamicUniformBuffersPerPipelineLayout",limitsOutPtr,36);setLimitValueU32("maxDynamicStorageBuffersPerPipelineLayout",limitsOutPtr,40);setLimitValueU32("maxSampledTexturesPerShaderStage",limitsOutPtr,44);setLimitValueU32("maxSamplersPerShaderStage",limitsOutPtr,48);setLimitValueU32("maxStorageBuffersPerShaderStage",limitsOutPtr,52);setLimitValueU32("maxStorageTexturesPerShaderStage",limitsOutPtr,56);setLimitValueU32("maxUniformBuffersPerShaderStage",limitsOutPtr,60);setLimitValueU32("minUniformBufferOffsetAlignment",limitsOutPtr,80);setLimitValueU32("minStorageBufferOffsetAlignment",limitsOutPtr,84);setLimitValueU64("maxUniformBufferBindingSize",limitsOutPtr,64);setLimitValueU64("maxStorageBufferBindingSize",limitsOutPtr,72);setLimitValueU32("maxVertexBuffers",limitsOutPtr,88);setLimitValueU64("maxBufferSize",limitsOutPtr,96);setLimitValueU32("maxVertexAttributes",limitsOutPtr,104);setLimitValueU32("maxVertexBufferArrayStride",limitsOutPtr,108);setLimitValueU32("maxInterStageShaderVariables",limitsOutPtr,112);setLimitValueU32("maxColorAttachments",limitsOutPtr,116);setLimitValueU32("maxColorAttachmentBytesPerSample",limitsOutPtr,120);setLimitValueU32("maxComputeWorkgroupStorageSize",limitsOutPtr,124);setLimitValueU32("maxComputeInvocationsPerWorkgroup",limitsOutPtr,128);setLimitValueU32("maxComputeWorkgroupSizeX",limitsOutPtr,132);setLimitValueU32("maxComputeWorkgroupSizeY",limitsOutPtr,136);setLimitValueU32("maxComputeWorkgroupSizeZ",limitsOutPtr,140);setLimitValueU32("maxComputeWorkgroupsPerDimension",limitsOutPtr,144);setLimitValueU32("maxImmediateSize",limitsOutPtr,148);if(nextInChainPtr!==0){var sType=(growMemViews(),HEAP32)[(nextInChainPtr+8)/4];var compatibilityModeLimitsPtr=nextInChainPtr;setLimitValueU32("maxStorageBuffersInVertexStage",compatibilityModeLimitsPtr,16,limits.maxStorageBuffersPerShaderStage);setLimitValueU32("maxStorageBuffersInFragmentStage",compatibilityModeLimitsPtr,24,limits.maxStorageBuffersPerShaderStage);setLimitValueU32("maxStorageTexturesInVertexStage",compatibilityModeLimitsPtr,20,limits.maxStorageTexturesPerShaderStage);setLimitValueU32("maxStorageTexturesInFragmentStage",compatibilityModeLimitsPtr,28,limits.maxStorageTexturesPerShaderStage)}},fillAdapterInfoStruct:(info,infoStruct)=>{(growMemViews(),HEAPU32)[(infoStruct+88)/4]=info.subgroupMinSize;(growMemViews(),HEAPU32)[(infoStruct+92)/4]=info.subgroupMaxSize;var strs=info.vendor+info.architecture+info.device+info.description;var strPtr=stringToNewUTF8(strs);var vendorLen=lengthBytesUTF8(info.vendor);WebGPU.setStringView(infoStruct+8,strPtr,vendorLen);strPtr+=vendorLen;var architectureLen=lengthBytesUTF8(info.architecture);WebGPU.setStringView(infoStruct+24,strPtr,architectureLen);strPtr+=architectureLen;var deviceLen=lengthBytesUTF8(info.device);WebGPU.setStringView(infoStruct+40,strPtr,deviceLen);strPtr+=deviceLen;var descriptionLen=lengthBytesUTF8(info.description);WebGPU.setStringView(infoStruct+56,strPtr,descriptionLen);strPtr+=descriptionLen;(growMemViews(),HEAP32)[(infoStruct+72)/4]=2;var adapterType=info.isFallbackAdapter?3:4;(growMemViews(),HEAP32)[(infoStruct+76)/4]=adapterType;(growMemViews(),HEAPU32)[(infoStruct+80)/4]=0;(growMemViews(),HEAPU32)[(infoStruct+84)/4]=0},AddressMode:[,"clamp-to-edge","repeat","mirror-repeat"],BlendFactor:[,"zero","one","src","one-minus-src","src-alpha","one-minus-src-alpha","dst","one-minus-dst","dst-alpha","one-minus-dst-alpha","src-alpha-saturated","constant","one-minus-constant","src1","one-minus-src1","src1-alpha","one-minus-src1-alpha"],BlendOperation:[,"add","subtract","reverse-subtract","min","max"],BufferBindingType:[,,"uniform","storage","read-only-storage"],BufferMapState:[,"unmapped","pending","mapped"],CompareFunction:[,"never","less","equal","less-equal","greater","not-equal","greater-equal","always"],CompilationInfoRequestStatus:[,"success","callback-cancelled"],ComponentSwizzle:[,"0","1","r","g","b","a"],CompositeAlphaMode:[,"opaque","premultiplied","unpremultiplied","inherit"],CullMode:[,"none","front","back"],ErrorFilter:[,"validation","out-of-memory","internal"],FeatureLevel:[,"compatibility","core"],FeatureName:{1:"core-features-and-limits",2:"depth-clip-control",3:"depth32float-stencil8",4:"texture-compression-bc",5:"texture-compression-bc-sliced-3d",6:"texture-compression-etc2",7:"texture-compression-astc",8:"texture-compression-astc-sliced-3d",9:"timestamp-query",10:"indirect-first-instance",11:"shader-f16",12:"rg11b10ufloat-renderable",13:"bgra8unorm-storage",14:"float32-filterable",15:"float32-blendable",16:"clip-distances",17:"dual-source-blending",18:"subgroups",19:"texture-formats-tier1",20:"texture-formats-tier2",21:"primitive-index",22:"texture-component-swizzle",327692:"chromium-experimental-unorm16-texture-formats",327729:"chromium-experimental-multi-draw-indirect"},FilterMode:[,"nearest","linear"],FrontFace:[,"ccw","cw"],IndexFormat:[,"uint16","uint32"],InstanceFeatureName:[,"timed-wait-any","shader-source-spirv","multiple-devices-per-adapter"],LoadOp:[,"load","clear"],MipmapFilterMode:[,"nearest","linear"],OptionalBool:["false","true"],PowerPreference:[,"low-power","high-performance"],PredefinedColorSpace:[,"srgb","display-p3"],PrimitiveTopology:[,"point-list","line-list","line-strip","triangle-list","triangle-strip"],QueryType:[,"occlusion","timestamp"],SamplerBindingType:[,,"filtering","non-filtering","comparison"],Status:[,"success","error"],StencilOperation:[,"keep","zero","replace","invert","increment-clamp","decrement-clamp","increment-wrap","decrement-wrap"],StorageTextureAccess:[,,"write-only","read-only","read-write"],StoreOp:[,"store","discard"],SurfaceGetCurrentTextureStatus:[,"success-optimal","success-suboptimal","timeout","outdated","lost","error"],TextureAspect:[,"all","stencil-only","depth-only"],TextureDimension:[,"1d","2d","3d"],TextureFormat:[,"r8unorm","r8snorm","r8uint","r8sint","r16unorm","r16snorm","r16uint","r16sint","r16float","rg8unorm","rg8snorm","rg8uint","rg8sint","r32float","r32uint","r32sint","rg16unorm","rg16snorm","rg16uint","rg16sint","rg16float","rgba8unorm","rgba8unorm-srgb","rgba8snorm","rgba8uint","rgba8sint","bgra8unorm","bgra8unorm-srgb","rgb10a2uint","rgb10a2unorm","rg11b10ufloat","rgb9e5ufloat","rg32float","rg32uint","rg32sint","rgba16unorm","rgba16snorm","rgba16uint","rgba16sint","rgba16float","rgba32float","rgba32uint","rgba32sint","stencil8","depth16unorm","depth24plus","depth24plus-stencil8","depth32float","depth32float-stencil8","bc1-rgba-unorm","bc1-rgba-unorm-srgb","bc2-rgba-unorm","bc2-rgba-unorm-srgb","bc3-rgba-unorm","bc3-rgba-unorm-srgb","bc4-r-unorm","bc4-r-snorm","bc5-rg-unorm","bc5-rg-snorm","bc6h-rgb-ufloat","bc6h-rgb-float","bc7-rgba-unorm","bc7-rgba-unorm-srgb","etc2-rgb8unorm","etc2-rgb8unorm-srgb","etc2-rgb8a1unorm","etc2-rgb8a1unorm-srgb","etc2-rgba8unorm","etc2-rgba8unorm-srgb","eac-r11unorm","eac-r11snorm","eac-rg11unorm","eac-rg11snorm","astc-4x4-unorm","astc-4x4-unorm-srgb","astc-5x4-unorm","astc-5x4-unorm-srgb","astc-5x5-unorm","astc-5x5-unorm-srgb","astc-6x5-unorm","astc-6x5-unorm-srgb","astc-6x6-unorm","astc-6x6-unorm-srgb","astc-8x5-unorm","astc-8x5-unorm-srgb","astc-8x6-unorm","astc-8x6-unorm-srgb","astc-8x8-unorm","astc-8x8-unorm-srgb","astc-10x5-unorm","astc-10x5-unorm-srgb","astc-10x6-unorm","astc-10x6-unorm-srgb","astc-10x8-unorm","astc-10x8-unorm-srgb","astc-10x10-unorm","astc-10x10-unorm-srgb","astc-12x10-unorm","astc-12x10-unorm-srgb","astc-12x12-unorm","astc-12x12-unorm-srgb"],TextureSampleType:[,,"float","unfilterable-float","depth","sint","uint"],TextureViewDimension:[,"1d","2d","2d-array","cube","cube-array","3d"],ToneMappingMode:[,"standard","extended"],VertexFormat:[,"uint8","uint8x2","uint8x4","sint8","sint8x2","sint8x4","unorm8","unorm8x2","unorm8x4","snorm8","snorm8x2","snorm8x4","uint16","uint16x2","uint16x4","sint16","sint16x2","sint16x4","unorm16","unorm16x2","unorm16x4","snorm16","snorm16x2","snorm16x4","float16","float16x2","float16x4","float32","float32x2","float32x3","float32x4","uint32","uint32x2","uint32x3","uint32x4","sint32","sint32x2","sint32x3","sint32x4","unorm10-10-10-2","unorm8x4-bgra"],VertexStepMode:[,"vertex","instance"],WGSLLanguageFeatureName:[,"readonly_and_readwrite_storage_textures","packed_4x8_integer_dot_product","unrestricted_pointer_parameters","pointer_composite_access","uniform_buffer_standard_layout","subgroup_id","texture_and_sampler_let","subgroup_uniformity","texture_formats_tier1"]};var emwgpuStringToInt_DeviceLostReason={undefined:1,unknown:1,destroyed:2};var runtimeKeepalivePop=()=>{runtimeKeepaliveCounter-=1};function _emwgpuAdapterRequestDevice(adapterPtr,futureId,deviceLostFutureId,devicePtr,queuePtr,descriptor){adapterPtr=bigintToI53Checked(adapterPtr);futureId=bigintToI53Checked(futureId);deviceLostFutureId=bigintToI53Checked(deviceLostFutureId);devicePtr=bigintToI53Checked(devicePtr);queuePtr=bigintToI53Checked(queuePtr);descriptor=bigintToI53Checked(descriptor);var adapter=WebGPU.getJsObject(adapterPtr);var desc={};if(descriptor){var requiredFeatureCount=Number((growMemViews(),HEAPU64)[(descriptor+24)/8]);if(requiredFeatureCount){var requiredFeaturesPtr=Number((growMemViews(),HEAPU64)[(descriptor+32)/8]);desc["requiredFeatures"]=Array.from((growMemViews(),HEAPU32).subarray(requiredFeaturesPtr/4,(requiredFeaturesPtr+requiredFeatureCount*4)/4),feature=>WebGPU.FeatureName[feature])}var limitsPtr=Number((growMemViews(),HEAPU64)[(descriptor+40)/8]);if(limitsPtr){var nextInChainPtr=Number((growMemViews(),HEAPU64)[limitsPtr/8]);var requiredLimits={};function setLimitU32IfDefined(name,basePtr,limitOffset,ignoreIfZero=false){var ptr=basePtr+limitOffset;var value=(growMemViews(),HEAPU32)[ptr/4];if(value!=4294967295&&(!ignoreIfZero||value!=0)){requiredLimits[name]=value}}function setLimitU64IfDefined(name,basePtr,limitOffset){var ptr=basePtr+limitOffset;var limitPart1=(growMemViews(),HEAPU32)[ptr/4];var limitPart2=(growMemViews(),HEAPU32)[(ptr+4)/4];if(limitPart1!=4294967295||limitPart2!=4294967295){requiredLimits[name]=readI53FromI64(ptr)}}setLimitU32IfDefined("maxTextureDimension1D",limitsPtr,8);setLimitU32IfDefined("maxTextureDimension2D",limitsPtr,12);setLimitU32IfDefined("maxTextureDimension3D",limitsPtr,16);setLimitU32IfDefined("maxTextureArrayLayers",limitsPtr,20);setLimitU32IfDefined("maxBindGroups",limitsPtr,24);setLimitU32IfDefined("maxBindGroupsPlusVertexBuffers",limitsPtr,28);setLimitU32IfDefined("maxBindingsPerBindGroup",limitsPtr,32);setLimitU32IfDefined("maxDynamicUniformBuffersPerPipelineLayout",limitsPtr,36);setLimitU32IfDefined("maxDynamicStorageBuffersPerPipelineLayout",limitsPtr,40);setLimitU32IfDefined("maxSampledTexturesPerShaderStage",limitsPtr,44);setLimitU32IfDefined("maxSamplersPerShaderStage",limitsPtr,48);setLimitU32IfDefined("maxStorageBuffersPerShaderStage",limitsPtr,52);setLimitU32IfDefined("maxStorageTexturesPerShaderStage",limitsPtr,56);setLimitU32IfDefined("maxUniformBuffersPerShaderStage",limitsPtr,60);setLimitU32IfDefined("minUniformBufferOffsetAlignment",limitsPtr,80);setLimitU32IfDefined("minStorageBufferOffsetAlignment",limitsPtr,84);setLimitU64IfDefined("maxUniformBufferBindingSize",limitsPtr,64);setLimitU64IfDefined("maxStorageBufferBindingSize",limitsPtr,72);setLimitU32IfDefined("maxVertexBuffers",limitsPtr,88);setLimitU64IfDefined("maxBufferSize",limitsPtr,96);setLimitU32IfDefined("maxVertexAttributes",limitsPtr,104);setLimitU32IfDefined("maxVertexBufferArrayStride",limitsPtr,108);setLimitU32IfDefined("maxInterStageShaderVariables",limitsPtr,112);setLimitU32IfDefined("maxColorAttachments",limitsPtr,116);setLimitU32IfDefined("maxColorAttachmentBytesPerSample",limitsPtr,120);setLimitU32IfDefined("maxComputeWorkgroupStorageSize",limitsPtr,124);setLimitU32IfDefined("maxComputeInvocationsPerWorkgroup",limitsPtr,128);setLimitU32IfDefined("maxComputeWorkgroupSizeX",limitsPtr,132);setLimitU32IfDefined("maxComputeWorkgroupSizeY",limitsPtr,136);setLimitU32IfDefined("maxComputeWorkgroupSizeZ",limitsPtr,140);setLimitU32IfDefined("maxComputeWorkgroupsPerDimension",limitsPtr,144);setLimitU32IfDefined("maxImmediateSize",limitsPtr,148,true);if(nextInChainPtr!==0){var sType=(growMemViews(),HEAP32)[(nextInChainPtr+8)/4];var compatibilityModeLimitsPtr=nextInChainPtr;if("maxStorageBuffersInVertexStage"in GPUSupportedLimits.prototype){setLimitU32IfDefined("maxStorageBuffersInVertexStage",compatibilityModeLimitsPtr,16);setLimitU32IfDefined("maxStorageTexturesInVertexStage",compatibilityModeLimitsPtr,20);setLimitU32IfDefined("maxStorageBuffersInFragmentStage",compatibilityModeLimitsPtr,24);setLimitU32IfDefined("maxStorageTexturesInFragmentStage",compatibilityModeLimitsPtr,28)}}desc["requiredLimits"]=requiredLimits}var defaultQueuePtr=Number((growMemViews(),HEAPU64)[(descriptor+48)/8]);if(defaultQueuePtr){var defaultQueueDesc={label:WebGPU.makeStringFromOptionalStringView(defaultQueuePtr+8)};desc["defaultQueue"]=defaultQueueDesc}desc["label"]=WebGPU.makeStringFromOptionalStringView(descriptor+8)}runtimeKeepalivePush();WebGPU.Internals.futureInsert(futureId,adapter.requestDevice(desc).then(device=>{runtimeKeepalivePop();callUserCallback(()=>{WebGPU.Internals.jsObjectInsert(queuePtr,device.queue);WebGPU.Internals.jsObjectInsert(devicePtr,device);devicePtr=BigInt(devicePtr);WebGPU.Internals.futureInsert(deviceLostFutureId,device.lost.then(info=>{callUserCallback(()=>{device.onuncapturederror=ev=>{};var sp=stackSave();var messagePtr=stringToUTF8OnStack(info.message);_emwgpuOnDeviceLostCompleted(deviceLostFutureId,emwgpuStringToInt_DeviceLostReason[info.reason],BigInt(messagePtr));stackRestore(sp)})}));device.onuncapturederror=ev=>{var type=5;if(ev.error instanceof GPUValidationError)type=2;else if(ev.error instanceof GPUOutOfMemoryError)type=3;else if(ev.error instanceof GPUInternalError)type=4;var sp=stackSave();var messagePtr=stringToUTF8OnStack(ev.error.message);_emwgpuOnUncapturedError(BigInt(devicePtr),type,BigInt(messagePtr));stackRestore(sp)};_emwgpuOnRequestDeviceCompleted(futureId,1,BigInt(devicePtr),0n)})},ex=>{runtimeKeepalivePop();callUserCallback(()=>{var sp=stackSave();var messagePtr=stringToUTF8OnStack(ex.message);_emwgpuOnRequestDeviceCompleted(futureId,3,BigInt(devicePtr),BigInt(messagePtr));if(deviceLostFutureId){_emwgpuOnDeviceLostCompleted(deviceLostFutureId,4,BigInt(messagePtr))}stackRestore(sp)})}))}function _emwgpuBufferDestroy(bufferPtr){bufferPtr=bigintToI53Checked(bufferPtr);var buffer=WebGPU.getJsObject(bufferPtr);var onUnmap=WebGPU.Internals.bufferOnUnmaps[bufferPtr];if(onUnmap){for(var i=0;i<onUnmap.length;++i){onUnmap[i]()}delete WebGPU.Internals.bufferOnUnmaps[bufferPtr]}buffer.destroy()}var warnOnce=text=>{warnOnce.shown||={};if(!warnOnce.shown[text]){warnOnce.shown[text]=1;if(ENVIRONMENT_IS_NODE)text="warning: "+text;err(text)}};var _emwgpuBufferGetConstMappedRange=function(bufferPtr,offset,size){bufferPtr=bigintToI53Checked(bufferPtr);offset=bigintToI53Checked(offset);size=bigintToI53Checked(size);var ret=(()=>{var buffer=WebGPU.getJsObject(bufferPtr);if(size==-1)size=undefined;var mapped;try{mapped=buffer.getMappedRange(offset,size)}catch(ex){return 0n}var data=_memalign(16,mapped.byteLength);(growMemViews(),HEAPU8).set(new Uint8Array(mapped),data);WebGPU.Internals.bufferOnUnmaps[bufferPtr].push(()=>_free(data));return data})();return BigInt(ret)};var _emwgpuBufferMapAsync=function(bufferPtr,futureId,mode,offset,size){bufferPtr=bigintToI53Checked(bufferPtr);futureId=bigintToI53Checked(futureId);mode=bigintToI53Checked(mode);offset=bigintToI53Checked(offset);size=bigintToI53Checked(size);var buffer=WebGPU.getJsObject(bufferPtr);WebGPU.Internals.bufferOnUnmaps[bufferPtr]=[];if(size==-1)size=undefined;runtimeKeepalivePush();WebGPU.Internals.futureInsert(futureId,buffer.mapAsync(mode,offset,size).then(()=>{runtimeKeepalivePop();callUserCallback(()=>{_emwgpuOnMapAsyncCompleted(futureId,1,0n)})},ex=>{runtimeKeepalivePop();callUserCallback(()=>{var sp=stackSave();var messagePtr=stringToUTF8OnStack(ex.message);var status=ex.name==="AbortError"?4:ex.name==="OperationError"?3:0;_emwgpuOnMapAsyncCompleted(futureId,status,BigInt(messagePtr));delete WebGPU.Internals.bufferOnUnmaps[bufferPtr]})}))};function _emwgpuBufferUnmap(bufferPtr){bufferPtr=bigintToI53Checked(bufferPtr);var buffer=WebGPU.getJsObject(bufferPtr);var onUnmap=WebGPU.Internals.bufferOnUnmaps[bufferPtr];if(!onUnmap){return}for(var i=0;i<onUnmap.length;++i){onUnmap[i]()}delete WebGPU.Internals.bufferOnUnmaps[bufferPtr];buffer.unmap()}function _emwgpuDelete(ptr){ptr=bigintToI53Checked(ptr);delete WebGPU.Internals.jsObjects[ptr]}function _emwgpuDeviceCreateBuffer(devicePtr,descriptor,bufferPtr){devicePtr=bigintToI53Checked(devicePtr);descriptor=bigintToI53Checked(descriptor);bufferPtr=bigintToI53Checked(bufferPtr);var mappedAtCreation=!!(growMemViews(),HEAPU32)[(descriptor+40)/4];var desc={label:WebGPU.makeStringFromOptionalStringView(descriptor+8),usage:(growMemViews(),HEAPU32)[(descriptor+24)/4],size:readI53FromI64(descriptor+32),mappedAtCreation};var device=WebGPU.getJsObject(devicePtr);var buffer;try{buffer=device.createBuffer(desc)}catch(ex){return false}WebGPU.Internals.jsObjectInsert(bufferPtr,buffer);if(mappedAtCreation){WebGPU.Internals.bufferOnUnmaps[bufferPtr]=[]}return true}function _emwgpuDeviceCreateShaderModule(devicePtr,descriptor,shaderModulePtr){devicePtr=bigintToI53Checked(devicePtr);descriptor=bigintToI53Checked(descriptor);shaderModulePtr=bigintToI53Checked(shaderModulePtr);var nextInChainPtr=Number((growMemViews(),HEAPU64)[descriptor/8]);var sType=(growMemViews(),HEAP32)[(nextInChainPtr+8)/4];var desc={label:WebGPU.makeStringFromOptionalStringView(descriptor+8),code:""};switch(sType){case 2:{desc["code"]=WebGPU.makeStringFromStringView(nextInChainPtr+16);break}}var device=WebGPU.getJsObject(devicePtr);WebGPU.Internals.jsObjectInsert(shaderModulePtr,device.createShaderModule(desc))}var _emwgpuDeviceDestroy=devicePtr=>{const device=WebGPU.getJsObject(devicePtr);device.onuncapturederror=null;device.destroy()};function _emwgpuInstanceRequestAdapter(instancePtr,futureId,options,adapterPtr){instancePtr=bigintToI53Checked(instancePtr);futureId=bigintToI53Checked(futureId);options=bigintToI53Checked(options);adapterPtr=bigintToI53Checked(adapterPtr);var opts;if(options){opts={featureLevel:WebGPU.FeatureLevel[(growMemViews(),HEAP32)[(options+8)/4]],powerPreference:WebGPU.PowerPreference[(growMemViews(),HEAP32)[(options+12)/4]],forceFallbackAdapter:!!(growMemViews(),HEAPU32)[(options+16)/4]};var nextInChainPtr=Number((growMemViews(),HEAPU64)[options/8]);if(nextInChainPtr!==0){var sType=(growMemViews(),HEAP32)[(nextInChainPtr+8)/4];var webxrOptions=nextInChainPtr;opts.xrCompatible=!!(growMemViews(),HEAPU32)[(webxrOptions+16)/4]}}if(!("gpu"in navigator)){var sp=stackSave();var messagePtr=stringToUTF8OnStack("WebGPU not available on this browser (navigator.gpu is not available)");_emwgpuOnRequestAdapterCompleted(futureId,3,BigInt(adapterPtr),BigInt(messagePtr));stackRestore(sp);return}runtimeKeepalivePush();WebGPU.Internals.futureInsert(futureId,navigator.gpu.requestAdapter(opts).then(adapter=>{runtimeKeepalivePop();callUserCallback(()=>{if(adapter){WebGPU.Internals.jsObjectInsert(adapterPtr,adapter);_emwgpuOnRequestAdapterCompleted(futureId,1,BigInt(adapterPtr),0n)}else{var sp=stackSave();var messagePtr=stringToUTF8OnStack("WebGPU not available on this browser (requestAdapter returned null)");_emwgpuOnRequestAdapterCompleted(futureId,3,BigInt(adapterPtr),BigInt(messagePtr));stackRestore(sp)}})},ex=>{runtimeKeepalivePop();callUserCallback(()=>{var sp=stackSave();var messagePtr=stringToUTF8OnStack(ex.message);_emwgpuOnRequestAdapterCompleted(futureId,4,BigInt(adapterPtr),BigInt(messagePtr));stackRestore(sp)})}))}var _emwgpuQueueOnSubmittedWorkDone=function(queuePtr,futureId){queuePtr=bigintToI53Checked(queuePtr);futureId=bigintToI53Checked(futureId);var queue=WebGPU.getJsObject(queuePtr);runtimeKeepalivePush();WebGPU.Internals.futureInsert(futureId,queue.onSubmittedWorkDone().then(()=>{runtimeKeepalivePop();callUserCallback(()=>{_emwgpuOnWorkDoneCompleted(futureId,1)})}))};var _emwgpuWaitAny=function(futurePtr,futureCount,timeoutMSPtr){futurePtr=bigintToI53Checked(futurePtr);futureCount=bigintToI53Checked(futureCount);timeoutMSPtr=bigintToI53Checked(timeoutMSPtr);return Asyncify.handleAsync(async()=>{var promises=[];if(timeoutMSPtr){var timeoutMS=(growMemViews(),HEAP32)[timeoutMSPtr/4];promises.length=futureCount+1;promises[futureCount]=new Promise(resolve=>setTimeout(resolve,timeoutMS,0))}else{promises.length=futureCount}for(var i=0;i<futureCount;++i){var futureId=readI53FromI64(futurePtr+i*8);if(!(futureId in WebGPU.Internals.futures)){return futureId}promises[i]=WebGPU.Internals.futures[futureId]}const firstResolvedFuture=await Promise.race(promises);delete WebGPU.Internals.futures[firstResolvedFuture];return firstResolvedFuture})};_emwgpuWaitAny.isAsync=true;var ENV={};var getExecutableName=()=>thisProgram||"./this.program";var getEnvStrings=()=>{if(!getEnvStrings.strings){var lang=(typeof navigator=="object"&&navigator.language||"C").replace("-","_")+".UTF-8";var env={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:lang,_:getExecutableName()};for(var x in ENV){if(ENV[x]===undefined)delete env[x];else env[x]=ENV[x]}var strings=[];for(var x in env){strings.push(`${x}=${env[x]}`)}getEnvStrings.strings=strings}return getEnvStrings.strings};function _environ_get(__environ,environ_buf){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(14,0,1,__environ,environ_buf);__environ=bigintToI53Checked(__environ);environ_buf=bigintToI53Checked(environ_buf);var bufSize=0;var envp=0;for(var string of getEnvStrings()){var ptr=environ_buf+bufSize;(growMemViews(),HEAPU64)[(__environ+envp)/8]=BigInt(ptr);bufSize+=stringToUTF8(string,ptr,Infinity)+1;envp+=8}return 0}function _environ_sizes_get(penviron_count,penviron_buf_size){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(15,0,1,penviron_count,penviron_buf_size);penviron_count=bigintToI53Checked(penviron_count);penviron_buf_size=bigintToI53Checked(penviron_buf_size);var strings=getEnvStrings();(growMemViews(),HEAPU64)[penviron_count/8]=BigInt(strings.length);var bufSize=0;for(var string of strings){bufSize+=lengthBytesUTF8(string)+1}(growMemViews(),HEAPU64)[penviron_buf_size/8]=BigInt(bufSize);return 0}function _fd_close(fd){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(16,0,1,fd);try{var stream=SYSCALLS.getStreamFromFD(fd);FS.close(stream);return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return e.errno}}var doReadv=(stream,iov,iovcnt,offset)=>{var ret=0;for(var i=0;i<iovcnt;i++){var ptr=Number((growMemViews(),HEAPU64)[iov/8]);var len=Number((growMemViews(),HEAPU64)[(iov+8)/8]);iov+=16;var curr=FS.read(stream,(growMemViews(),HEAP8),ptr,len,offset);if(curr<0)return-1;ret+=curr;if(curr<len)break;if(typeof offset!="undefined"){offset+=curr}}return ret};function _fd_read(fd,iov,iovcnt,pnum){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(17,0,1,fd,iov,iovcnt,pnum);iov=bigintToI53Checked(iov);iovcnt=bigintToI53Checked(iovcnt);pnum=bigintToI53Checked(pnum);try{var stream=SYSCALLS.getStreamFromFD(fd);var num=doReadv(stream,iov,iovcnt);(growMemViews(),HEAPU64)[pnum/8]=BigInt(num);return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return e.errno}}function _fd_seek(fd,offset,whence,newOffset){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(18,0,1,fd,offset,whence,newOffset);offset=bigintToI53Checked(offset);newOffset=bigintToI53Checked(newOffset);try{if(isNaN(offset))return 61;var stream=SYSCALLS.getStreamFromFD(fd);FS.llseek(stream,offset,whence);(growMemViews(),HEAP64)[newOffset/8]=BigInt(stream.position);if(stream.getdents&&offset===0&&whence===0)stream.getdents=null;return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return e.errno}}var doWritev=(stream,iov,iovcnt,offset)=>{var ret=0;for(var i=0;i<iovcnt;i++){var ptr=Number((growMemViews(),HEAPU64)[iov/8]);var len=Number((growMemViews(),HEAPU64)[(iov+8)/8]);iov+=16;var curr=FS.write(stream,(growMemViews(),HEAP8),ptr,len,offset);if(curr<0)return-1;ret+=curr;if(curr<len){break}if(typeof offset!="undefined"){offset+=curr}}return ret};function _fd_write(fd,iov,iovcnt,pnum){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(19,0,1,fd,iov,iovcnt,pnum);iov=bigintToI53Checked(iov);iovcnt=bigintToI53Checked(iovcnt);pnum=bigintToI53Checked(pnum);try{var stream=SYSCALLS.getStreamFromFD(fd);var num=doWritev(stream,iov,iovcnt);(growMemViews(),HEAPU64)[pnum/8]=BigInt(num);return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return e.errno}}function _random_get(buffer,size){buffer=bigintToI53Checked(buffer);size=bigintToI53Checked(size);try{randomFill((growMemViews(),HEAPU8).subarray(buffer,buffer+size));return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return e.errno}}function _wgpuAdapterGetInfo(adapterPtr,info){adapterPtr=bigintToI53Checked(adapterPtr);info=bigintToI53Checked(info);var adapter=WebGPU.getJsObject(adapterPtr);WebGPU.fillAdapterInfoStruct(adapter.info,info);return 1}function _wgpuAdapterGetLimits(adapterPtr,limitsOutPtr){adapterPtr=bigintToI53Checked(adapterPtr);limitsOutPtr=bigintToI53Checked(limitsOutPtr);var adapter=WebGPU.getJsObject(adapterPtr);WebGPU.fillLimitStruct(adapter.limits,limitsOutPtr);return 1}function _wgpuAdapterHasFeature(adapterPtr,featureEnumValue){adapterPtr=bigintToI53Checked(adapterPtr);var adapter=WebGPU.getJsObject(adapterPtr);return adapter.features.has(WebGPU.FeatureName[featureEnumValue])}var _wgpuBufferGetSize=function(bufferPtr){bufferPtr=bigintToI53Checked(bufferPtr);var ret=(()=>{var buffer=WebGPU.getJsObject(bufferPtr);return buffer.size})();return BigInt(ret)};var _wgpuCommandEncoderBeginComputePass=function(encoderPtr,descriptor){encoderPtr=bigintToI53Checked(encoderPtr);descriptor=bigintToI53Checked(descriptor);var ret=(()=>{var desc;if(descriptor){desc={label:WebGPU.makeStringFromOptionalStringView(descriptor+8),timestampWrites:WebGPU.makePassTimestampWrites(Number((growMemViews(),HEAPU64)[(descriptor+24)/8]))}}var commandEncoder=WebGPU.getJsObject(encoderPtr);var ptr=_emwgpuCreateComputePassEncoder(0n);WebGPU.Internals.jsObjectInsert(ptr,commandEncoder.beginComputePass(desc));return ptr})();return BigInt(ret)};function _wgpuCommandEncoderCopyBufferToBuffer(encoderPtr,srcPtr,srcOffset,dstPtr,dstOffset,size){encoderPtr=bigintToI53Checked(encoderPtr);srcPtr=bigintToI53Checked(srcPtr);srcOffset=bigintToI53Checked(srcOffset);dstPtr=bigintToI53Checked(dstPtr);dstOffset=bigintToI53Checked(dstOffset);size=bigintToI53Checked(size);var commandEncoder=WebGPU.getJsObject(encoderPtr);var src=WebGPU.getJsObject(srcPtr);var dst=WebGPU.getJsObject(dstPtr);commandEncoder.copyBufferToBuffer(src,srcOffset,dst,dstOffset,size)}var _wgpuCommandEncoderFinish=function(encoderPtr,descriptor){encoderPtr=bigintToI53Checked(encoderPtr);descriptor=bigintToI53Checked(descriptor);var ret=(()=>{var commandEncoder=WebGPU.getJsObject(encoderPtr);var ptr=_emwgpuCreateCommandBuffer(0n);WebGPU.Internals.jsObjectInsert(ptr,commandEncoder.finish());return ptr})();return BigInt(ret)};function _wgpuComputePassEncoderDispatchWorkgroups(passPtr,x,y,z){passPtr=bigintToI53Checked(passPtr);var pass=WebGPU.getJsObject(passPtr);pass.dispatchWorkgroups(x,y,z)}function _wgpuComputePassEncoderEnd(passPtr){passPtr=bigintToI53Checked(passPtr);var pass=WebGPU.getJsObject(passPtr);pass.end()}function _wgpuComputePassEncoderSetBindGroup(passPtr,groupIndex,groupPtr,dynamicOffsetCount,dynamicOffsetsPtr){passPtr=bigintToI53Checked(passPtr);groupPtr=bigintToI53Checked(groupPtr);dynamicOffsetCount=bigintToI53Checked(dynamicOffsetCount);dynamicOffsetsPtr=bigintToI53Checked(dynamicOffsetsPtr);var pass=WebGPU.getJsObject(passPtr);var group=WebGPU.getJsObject(groupPtr);if(dynamicOffsetCount==0){pass.setBindGroup(groupIndex,group)}else{pass.setBindGroup(groupIndex,group,(growMemViews(),HEAPU32),dynamicOffsetsPtr/4,dynamicOffsetCount)}}function _wgpuComputePassEncoderSetPipeline(passPtr,pipelinePtr){passPtr=bigintToI53Checked(passPtr);pipelinePtr=bigintToI53Checked(pipelinePtr);var pass=WebGPU.getJsObject(passPtr);var pipeline=WebGPU.getJsObject(pipelinePtr);pass.setPipeline(pipeline)}var _wgpuComputePipelineGetBindGroupLayout=function(pipelinePtr,groupIndex){pipelinePtr=bigintToI53Checked(pipelinePtr);var ret=(()=>{var pipeline=WebGPU.getJsObject(pipelinePtr);var ptr=_emwgpuCreateBindGroupLayout(0n);WebGPU.Internals.jsObjectInsert(ptr,pipeline.getBindGroupLayout(groupIndex));return ptr})();return BigInt(ret)};var _wgpuDeviceCreateBindGroup=function(devicePtr,descriptor){devicePtr=bigintToI53Checked(devicePtr);descriptor=bigintToI53Checked(descriptor);var ret=(()=>{function makeEntry(entryPtr){var bufferPtr=Number((growMemViews(),HEAPU64)[(entryPtr+16)/8]);var samplerPtr=Number((growMemViews(),HEAPU64)[(entryPtr+40)/8]);var textureViewPtr=Number((growMemViews(),HEAPU64)[(entryPtr+48)/8]);var externalTexturePtr=0;WebGPU.iterateExtensions(entryPtr,{327681:ptr=>{externalTexturePtr=Number((growMemViews(),HEAPU64)[(ptr+16)/8])}});var resource;if(bufferPtr){var size=readI53FromI64(entryPtr+32);if(size==-1)size=undefined;resource={buffer:WebGPU.getJsObject(bufferPtr),offset:readI53FromI64(entryPtr+24),size}}else{resource=WebGPU.getJsObject(samplerPtr||textureViewPtr||externalTexturePtr)}return{binding:(growMemViews(),HEAPU32)[(entryPtr+8)/4],resource}}function makeEntries(count,entriesPtrs){var entries=[];for(var i=0;i<count;++i){entries.push(makeEntry(entriesPtrs+56*i))}return entries}var desc={label:WebGPU.makeStringFromOptionalStringView(descriptor+8),layout:WebGPU.getJsObject(Number((growMemViews(),HEAPU64)[(descriptor+24)/8])),entries:makeEntries(Number((growMemViews(),HEAPU64)[(descriptor+32)/8]),Number((growMemViews(),HEAPU64)[(descriptor+40)/8]))};var device=WebGPU.getJsObject(devicePtr);var ptr=_emwgpuCreateBindGroup(0n);WebGPU.Internals.jsObjectInsert(ptr,device.createBindGroup(desc));return ptr})();return BigInt(ret)};var _wgpuDeviceCreateCommandEncoder=function(devicePtr,descriptor){devicePtr=bigintToI53Checked(devicePtr);descriptor=bigintToI53Checked(descriptor);var ret=(()=>{var desc;if(descriptor){desc={label:WebGPU.makeStringFromOptionalStringView(descriptor+8)}}var device=WebGPU.getJsObject(devicePtr);var ptr=_emwgpuCreateCommandEncoder(0n);WebGPU.Internals.jsObjectInsert(ptr,device.createCommandEncoder(desc));return ptr})();return BigInt(ret)};var _wgpuDeviceCreateComputePipeline=function(devicePtr,descriptor){devicePtr=bigintToI53Checked(devicePtr);descriptor=bigintToI53Checked(descriptor);var ret=(()=>{var desc=WebGPU.makeComputePipelineDesc(descriptor);var device=WebGPU.getJsObject(devicePtr);var ptr=_emwgpuCreateComputePipeline(0n);WebGPU.Internals.jsObjectInsert(ptr,device.createComputePipeline(desc));return ptr})();return BigInt(ret)};function _wgpuInstanceHasWGSLLanguageFeature(instance,featureEnumValue){instance=bigintToI53Checked(instance);if(!("wgslLanguageFeatures"in navigator.gpu)){return false}return navigator.gpu.wgslLanguageFeatures.has(WebGPU.WGSLLanguageFeatureName[featureEnumValue])}var _wgpuQueueSubmit=function(queuePtr,commandCount,commands){queuePtr=bigintToI53Checked(queuePtr);commandCount=bigintToI53Checked(commandCount);commands=bigintToI53Checked(commands);var queue=WebGPU.getJsObject(queuePtr);var cmds=Array.from((growMemViews(),HEAP64).subarray(commands/8,(commands+commandCount*8)/8),id=>WebGPU.getJsObject(id));queue.submit(cmds)};function _wgpuQueueWriteBuffer(queuePtr,bufferPtr,bufferOffset,data,size){queuePtr=bigintToI53Checked(queuePtr);bufferPtr=bigintToI53Checked(bufferPtr);bufferOffset=bigintToI53Checked(bufferOffset);data=bigintToI53Checked(data);size=bigintToI53Checked(size);var queue=WebGPU.getJsObject(queuePtr);var buffer=WebGPU.getJsObject(bufferPtr);var subarray=(growMemViews(),HEAPU8).subarray(data,data+size);queue.writeBuffer(buffer,bufferOffset,subarray,0,size)}var Asyncify={instrumentWasmImports(imports){var importPattern=/^(invoke_.*|__asyncjs__.*)$/;for(let[x,original]of Object.entries(imports)){if(typeof original=="function"){let isAsyncifyImport=original.isAsync||importPattern.test(x);if(isAsyncifyImport){imports[x]=original=new WebAssembly.Suspending(original)}}}},instrumentFunction(original){var wrapper=(...args)=>original(...args);return wrapper},instrumentWasmExports(exports){var exportPattern=/^(wllama_start|wllama_action|main|__main_argc_argv)$/;Asyncify.asyncExports=new Set;var ret={};for(let[x,original]of Object.entries(exports)){if(typeof original=="function"){let isAsyncifyExport=exportPattern.test(x);if(isAsyncifyExport){Asyncify.asyncExports.add(original);original=Asyncify.makeAsyncFunction(original)}var wrapper=Asyncify.instrumentFunction(original);ret[x]=wrapper}else{ret[x]=original}}return ret},asyncExports:null,isAsyncExport(func){return Asyncify.asyncExports?.has(func)},handleAsync:async startAsync=>{runtimeKeepalivePush();try{return await startAsync()}finally{runtimeKeepalivePop()}},handleSleep:startAsync=>Asyncify.handleAsync(()=>new Promise(startAsync)),makeAsyncFunction(original){return WebAssembly.promising(original)}};var getCFunc=ident=>{var func=Module["_"+ident];return func};var writeArrayToMemory=(array,buffer)=>{(growMemViews(),HEAP8).set(array,buffer)};var ccall=(ident,returnType,argTypes,args,opts)=>{var toC={pointer:p=>BigInt(p),string:str=>{var ret=0;if(str!==null&&str!==undefined&&str!==0){ret=stringToUTF8OnStack(str)}return BigInt(ret)},array:arr=>{var ret=stackAlloc(arr.length);writeArrayToMemory(arr,ret);return BigInt(ret)}};function convertReturnValue(ret){if(returnType==="string"){return UTF8ToString(Number(ret))}if(returnType==="pointer")return Number(ret);if(returnType==="boolean")return Boolean(ret);return ret}var func=getCFunc(ident);var cArgs=[];var stack=0;if(args){for(var i=0;i<args.length;i++){var converter=toC[argTypes[i]];if(converter){if(stack===0)stack=stackSave();cArgs[i]=converter(args[i])}else{cArgs[i]=args[i]}}}var ret=func(...cArgs);function onDone(ret){if(stack!==0)stackRestore(stack);return convertReturnValue(ret)}var asyncMode=opts?.async;if(asyncMode)return ret.then(onDone);ret=onDone(ret);return ret};var cwrap=(ident,returnType,argTypes,opts)=>{var numericArgs=!argTypes||argTypes.every(type=>type==="number"||type==="boolean");var numericRet=returnType!=="string";if(numericRet&&numericArgs&&!opts){return getCFunc(ident)}return(...args)=>ccall(ident,returnType,argTypes,args,opts)};var FS_createPath=(...args)=>FS.createPath(...args);var FS_unlink=(...args)=>FS.unlink(...args);var FS_createLazyFile=(...args)=>FS.createLazyFile(...args);var FS_createDevice=(...args)=>FS.createDevice(...args);PThread.init();FS.createPreloadedFile=FS_createPreloadedFile;FS.preloadFile=FS_preloadFile;FS.staticInit();{initMemory();if(Module["noExitRuntime"])noExitRuntime=Module["noExitRuntime"];if(Module["preloadPlugins"])preloadPlugins=Module["preloadPlugins"];if(Module["print"])out=Module["print"];if(Module["printErr"])err=Module["printErr"];if(Module["wasmBinary"])wasmBinary=Module["wasmBinary"];if(Module["arguments"])arguments_=Module["arguments"];if(Module["thisProgram"])thisProgram=Module["thisProgram"];if(Module["preInit"]){if(typeof Module["preInit"]=="function")Module["preInit"]=[Module["preInit"]];while(Module["preInit"].length>0){Module["preInit"].shift()()}}}Module["ENV"]=ENV;Module["mmapAlloc"]=mmapAlloc;Module["wasmMemory"]=wasmMemory;Module["addRunDependency"]=addRunDependency;Module["removeRunDependency"]=removeRunDependency;Module["ccall"]=ccall;Module["cwrap"]=cwrap;Module["FS_preloadFile"]=FS_preloadFile;Module["FS_unlink"]=FS_unlink;Module["FS_createPath"]=FS_createPath;Module["FS_createDevice"]=FS_createDevice;Module["FS"]=FS;Module["FS_createDataFile"]=FS_createDataFile;Module["FS_createLazyFile"]=FS_createLazyFile;Module["MEMFS"]=MEMFS;var proxiedFunctionTable=[_proc_exit,exitOnMainThread,pthreadCreateProxied,___syscall_fcntl64,___syscall_fstat64,___syscall_getcwd,___syscall_getdents64,___syscall_ioctl,___syscall_lstat64,___syscall_newfstatat,___syscall_openat,___syscall_stat64,__mmap_js,__munmap_js,_environ_get,_environ_sizes_get,_fd_close,_fd_read,_fd_seek,_fd_write];function __asyncjs__js_file_read(path_ptr,offset,req_size,out_ptr){return Asyncify.handleAsync(async()=>await _wllama_js_file_read(UTF8ToString(Number(path_ptr)),Number(offset),Number(req_size),Number(out_ptr)))}__asyncjs__js_file_read.sig="jjjjj";var _malloc,_free,_wllama_malloc,_wllama_start,_wllama_action,_wllama_exit,_wllama_debug,_main,_emwgpuCreateBindGroup,_emwgpuCreateBindGroupLayout,_emwgpuCreateCommandBuffer,_emwgpuCreateCommandEncoder,_emwgpuCreateComputePassEncoder,_emwgpuCreateComputePipeline,_emwgpuCreateExternalTexture,_emwgpuCreatePipelineLayout,_emwgpuCreateQuerySet,_emwgpuCreateRenderBundle,_emwgpuCreateRenderBundleEncoder,_emwgpuCreateRenderPassEncoder,_emwgpuCreateRenderPipeline,_emwgpuCreateSampler,_emwgpuCreateSurface,_emwgpuCreateTexture,_emwgpuCreateTextureView,_emwgpuCreateAdapter,_emwgpuCreateBuffer,_emwgpuCreateDevice,_emwgpuCreateQueue,_emwgpuCreateShaderModule,_emwgpuOnDeviceLostCompleted,_emwgpuOnMapAsyncCompleted,_emwgpuOnRequestAdapterCompleted,_emwgpuOnRequestDeviceCompleted,_emwgpuOnWorkDoneCompleted,_emwgpuOnUncapturedError,__emscripten_tls_init,_pthread_self,_emscripten_builtin_memalign,__emscripten_thread_init,__emscripten_thread_crashed,__emscripten_run_js_on_main_thread,__emscripten_thread_free_data,__emscripten_thread_exit,__emscripten_check_mailbox,_memalign,___trap,_emscripten_stack_set_limits,__emscripten_stack_restore,__emscripten_stack_alloc,_emscripten_stack_get_current,__indirect_function_table,wasmTable;function assignWasmExports(wasmExports){_malloc=wasmExports["malloc"];_free=wasmExports["free"];_wllama_malloc=Module["_wllama_malloc"]=wasmExports["wllama_malloc"];_wllama_start=Module["_wllama_start"]=wasmExports["wllama_start"];_wllama_action=Module["_wllama_action"]=wasmExports["wllama_action"];_wllama_exit=Module["_wllama_exit"]=wasmExports["wllama_exit"];_wllama_debug=Module["_wllama_debug"]=wasmExports["wllama_debug"];_main=Module["_main"]=wasmExports["main"];_emwgpuCreateBindGroup=wasmExports["emwgpuCreateBindGroup"];_emwgpuCreateBindGroupLayout=wasmExports["emwgpuCreateBindGroupLayout"];_emwgpuCreateCommandBuffer=wasmExports["emwgpuCreateCommandBuffer"];_emwgpuCreateCommandEncoder=wasmExports["emwgpuCreateCommandEncoder"];_emwgpuCreateComputePassEncoder=wasmExports["emwgpuCreateComputePassEncoder"];_emwgpuCreateComputePipeline=wasmExports["emwgpuCreateComputePipeline"];_emwgpuCreateExternalTexture=wasmExports["emwgpuCreateExternalTexture"];_emwgpuCreatePipelineLayout=wasmExports["emwgpuCreatePipelineLayout"];_emwgpuCreateQuerySet=wasmExports["emwgpuCreateQuerySet"];_emwgpuCreateRenderBundle=wasmExports["emwgpuCreateRenderBundle"];_emwgpuCreateRenderBundleEncoder=wasmExports["emwgpuCreateRenderBundleEncoder"];_emwgpuCreateRenderPassEncoder=wasmExports["emwgpuCreateRenderPassEncoder"];_emwgpuCreateRenderPipeline=wasmExports["emwgpuCreateRenderPipeline"];_emwgpuCreateSampler=wasmExports["emwgpuCreateSampler"];_emwgpuCreateSurface=wasmExports["emwgpuCreateSurface"];_emwgpuCreateTexture=wasmExports["emwgpuCreateTexture"];_emwgpuCreateTextureView=wasmExports["emwgpuCreateTextureView"];_emwgpuCreateAdapter=wasmExports["emwgpuCreateAdapter"];_emwgpuCreateBuffer=wasmExports["emwgpuCreateBuffer"];_emwgpuCreateDevice=wasmExports["emwgpuCreateDevice"];_emwgpuCreateQueue=wasmExports["emwgpuCreateQueue"];_emwgpuCreateShaderModule=wasmExports["emwgpuCreateShaderModule"];_emwgpuOnDeviceLostCompleted=wasmExports["emwgpuOnDeviceLostCompleted"];_emwgpuOnMapAsyncCompleted=wasmExports["emwgpuOnMapAsyncCompleted"];_emwgpuOnRequestAdapterCompleted=wasmExports["emwgpuOnRequestAdapterCompleted"];_emwgpuOnRequestDeviceCompleted=wasmExports["emwgpuOnRequestDeviceCompleted"];_emwgpuOnWorkDoneCompleted=wasmExports["emwgpuOnWorkDoneCompleted"];_emwgpuOnUncapturedError=wasmExports["emwgpuOnUncapturedError"];__emscripten_tls_init=wasmExports["_emscripten_tls_init"];_pthread_self=wasmExports["pthread_self"];_emscripten_builtin_memalign=wasmExports["emscripten_builtin_memalign"];__emscripten_thread_init=wasmExports["_emscripten_thread_init"];__emscripten_thread_crashed=wasmExports["_emscripten_thread_crashed"];__emscripten_run_js_on_main_thread=wasmExports["_emscripten_run_js_on_main_thread"];__emscripten_thread_free_data=wasmExports["_emscripten_thread_free_data"];__emscripten_thread_exit=wasmExports["_emscripten_thread_exit"];__emscripten_check_mailbox=wasmExports["_emscripten_check_mailbox"];_memalign=wasmExports["memalign"];___trap=wasmExports["__trap"];_emscripten_stack_set_limits=wasmExports["emscripten_stack_set_limits"];__emscripten_stack_restore=wasmExports["_emscripten_stack_restore"];__emscripten_stack_alloc=wasmExports["_emscripten_stack_alloc"];_emscripten_stack_get_current=wasmExports["emscripten_stack_get_current"];__indirect_function_table=wasmTable=wasmExports["__indirect_function_table"]}var wasmImports;function assignWasmImports(){wasmImports={__asyncjs__js_file_read,__pthread_create_js:___pthread_create_js,__syscall_fcntl64:___syscall_fcntl64,__syscall_getcwd:___syscall_getcwd,__syscall_getdents64:___syscall_getdents64,__syscall_ioctl:___syscall_ioctl,__syscall_openat:___syscall_openat,__syscall_stat64:___syscall_stat64,_abort_js:__abort_js,_emscripten_init_main_thread_js:__emscripten_init_main_thread_js,_emscripten_notify_mailbox_postmessage:__emscripten_notify_mailbox_postmessage,_emscripten_receive_on_main_thread_js:__emscripten_receive_on_main_thread_js,_emscripten_thread_cleanup:__emscripten_thread_cleanup,_emscripten_thread_mailbox_await:__emscripten_thread_mailbox_await,_emscripten_thread_set_strongref:__emscripten_thread_set_strongref,_localtime_js:__localtime_js,_mmap_js:__mmap_js,_munmap_js:__munmap_js,_tzset_js:__tzset_js,clock_time_get:_clock_time_get,emscripten_check_blocking_allowed:_emscripten_check_blocking_allowed,emscripten_date_now:_emscripten_date_now,emscripten_exit_with_live_runtime:_emscripten_exit_with_live_runtime,emscripten_get_callstack:_emscripten_get_callstack,emscripten_get_heap_max:_emscripten_get_heap_max,emscripten_get_now:_emscripten_get_now,emscripten_has_asyncify:_emscripten_has_asyncify,emscripten_num_logical_cores:_emscripten_num_logical_cores,emscripten_resize_heap:_emscripten_resize_heap,emwgpuAdapterRequestDevice:_emwgpuAdapterRequestDevice,emwgpuBufferDestroy:_emwgpuBufferDestroy,emwgpuBufferGetConstMappedRange:_emwgpuBufferGetConstMappedRange,emwgpuBufferMapAsync:_emwgpuBufferMapAsync,emwgpuBufferUnmap:_emwgpuBufferUnmap,emwgpuDelete:_emwgpuDelete,emwgpuDeviceCreateBuffer:_emwgpuDeviceCreateBuffer,emwgpuDeviceCreateShaderModule:_emwgpuDeviceCreateShaderModule,emwgpuDeviceDestroy:_emwgpuDeviceDestroy,emwgpuInstanceRequestAdapter:_emwgpuInstanceRequestAdapter,emwgpuQueueOnSubmittedWorkDone:_emwgpuQueueOnSubmittedWorkDone,emwgpuWaitAny:_emwgpuWaitAny,environ_get:_environ_get,environ_sizes_get:_environ_sizes_get,exit:_exit,fd_close:_fd_close,fd_read:_fd_read,fd_seek:_fd_seek,fd_write:_fd_write,memory:wasmMemory,random_get:_random_get,wgpuAdapterGetInfo:_wgpuAdapterGetInfo,wgpuAdapterGetLimits:_wgpuAdapterGetLimits,wgpuAdapterHasFeature:_wgpuAdapterHasFeature,wgpuBufferGetSize:_wgpuBufferGetSize,wgpuCommandEncoderBeginComputePass:_wgpuCommandEncoderBeginComputePass,wgpuCommandEncoderCopyBufferToBuffer:_wgpuCommandEncoderCopyBufferToBuffer,wgpuCommandEncoderFinish:_wgpuCommandEncoderFinish,wgpuComputePassEncoderDispatchWorkgroups:_wgpuComputePassEncoderDispatchWorkgroups,wgpuComputePassEncoderEnd:_wgpuComputePassEncoderEnd,wgpuComputePassEncoderSetBindGroup:_wgpuComputePassEncoderSetBindGroup,wgpuComputePassEncoderSetPipeline:_wgpuComputePassEncoderSetPipeline,wgpuComputePipelineGetBindGroupLayout:_wgpuComputePipelineGetBindGroupLayout,wgpuDeviceCreateBindGroup:_wgpuDeviceCreateBindGroup,wgpuDeviceCreateCommandEncoder:_wgpuDeviceCreateCommandEncoder,wgpuDeviceCreateComputePipeline:_wgpuDeviceCreateComputePipeline,wgpuInstanceHasWGSLLanguageFeature:_wgpuInstanceHasWGSLLanguageFeature,wgpuQueueSubmit:_wgpuQueueSubmit,wgpuQueueWriteBuffer:_wgpuQueueWriteBuffer}}function applySignatureConversions(wasmExports){wasmExports=Object.assign({},wasmExports);var makeWrapper_pp=f=>a0=>Number(f(BigInt(a0)));var makeWrapper__p=f=>a0=>f(BigInt(a0));var makeWrapper___PP=f=>(a0,a1,a2)=>f(a0,BigInt(a1?a1:0),BigInt(a2?a2:0));var makeWrapper_p=f=>()=>Number(f());var makeWrapper_ppp=f=>(a0,a1)=>Number(f(BigInt(a0),BigInt(a1)));var makeWrapper__p_____=f=>(a0,a1,a2,a3,a4,a5)=>f(BigInt(a0),a1,a2,a3,a4,a5);var makeWrapper___p_p_=f=>(a0,a1,a2,a3,a4)=>f(a0,BigInt(a1),a2,BigInt(a3),a4);var makeWrapper__pp=f=>(a0,a1)=>f(BigInt(a0),BigInt(a1));wasmExports["malloc"]=makeWrapper_pp(wasmExports["malloc"]);wasmExports["free"]=makeWrapper__p(wasmExports["free"]);wasmExports["main"]=makeWrapper___PP(wasmExports["main"]);wasmExports["pthread_self"]=makeWrapper_p(wasmExports["pthread_self"]);wasmExports["emscripten_builtin_memalign"]=makeWrapper_ppp(wasmExports["emscripten_builtin_memalign"]);wasmExports["_emscripten_thread_init"]=makeWrapper__p_____(wasmExports["_emscripten_thread_init"]);wasmExports["_emscripten_run_js_on_main_thread"]=makeWrapper___p_p_(wasmExports["_emscripten_run_js_on_main_thread"]);wasmExports["_emscripten_thread_free_data"]=makeWrapper__p(wasmExports["_emscripten_thread_free_data"]);wasmExports["_emscripten_thread_exit"]=makeWrapper__p(wasmExports["_emscripten_thread_exit"]);wasmExports["memalign"]=makeWrapper_ppp(wasmExports["memalign"]);wasmExports["emscripten_stack_set_limits"]=makeWrapper__pp(wasmExports["emscripten_stack_set_limits"]);wasmExports["_emscripten_stack_restore"]=makeWrapper__p(wasmExports["_emscripten_stack_restore"]);wasmExports["_emscripten_stack_alloc"]=makeWrapper_pp(wasmExports["_emscripten_stack_alloc"]);wasmExports["emscripten_stack_get_current"]=makeWrapper_p(wasmExports["emscripten_stack_get_current"]);return wasmExports}async function callMain(){var entryFunction=_main;var argc=0;var argv=0;try{var ret=entryFunction(argc,BigInt(argv));ret=await ret;exitJS(ret,true);return ret}catch(e){return handleException(e)}}function run(){if(runDependencies>0){dependenciesFulfilled=run;return}if(ENVIRONMENT_IS_PTHREAD){initRuntime();return}preRun();if(runDependencies>0){dependenciesFulfilled=run;return}async function doRun(){Module["calledRun"]=true;if(ABORT)return;initRuntime();preMain();Module["onRuntimeInitialized"]?.();var noInitialRun=Module["noInitialRun"]||false;if(!noInitialRun)await callMain();postRun()}if(Module["setStatus"]){Module["setStatus"]("Running...");setTimeout(()=>{setTimeout(()=>Module["setStatus"](""),1);doRun()},1)}else{doRun()}}var wasmExports;if(!ENVIRONMENT_IS_PTHREAD){createWasm();run()}\n';

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
