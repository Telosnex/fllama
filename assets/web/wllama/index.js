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
var LIBLLAMA_VERSION = "b9555-b7f7dab";
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
