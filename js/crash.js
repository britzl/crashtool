const VERSION = 3;
const MODULES_MAX = 128;
const MODULE_NAME_SIZE = 64;
const PTRS_MAX = 64;
const USERDATA_SLOTS = 32;
const USERDATA_SIZE = 256;
const EXTRA_MAX = 32768;

function readCrash(buffer) {
	const bytes = new Uint8Array(buffer);
	// const decoder = new TextDecoder("utf-8");
	const view = new DataView(buffer);
	var offset = 0;

	function readUint8() {
		offset += 1; return view.getUint8(offset - 1, true);
	}
	function readUint32() {
		offset += 4; return view.getUint32(offset - 4, true);
	}
	function readUint64() {
		offset += 8; return view.getBigUint64(offset - 8, true);
	}
	function readString(length) {
		var s = "";
		for (var i = offset; i < (offset + length); i++) {
			var b = bytes[i];
			if (b > 0) {
				s += String.fromCharCode(b);
			}
		}
		offset += length; return s;
		// offset += length; return decoder.decode(buffer.slice(offset - length, offset));
	}
	function toHex(u64) {
		var hex = u64.toString(16);
		if (hex.length % 2) {
			hex = '0' + hex;
		}
		return "0x" + hex;
	}

	var crash = {};
	crash.version = readUint32();
	crash.struct_size = readUint32();

	if (crash.version > VERSION) {
		throw new Error("Version mismatch. This tool only supports up to version " + VERSION + " crash files");
	}

	crash.engine_version = readString(32);
	crash.engine_hash = readString(128);
	crash.device_model = readString(32);
	crash.manufacturer = readString(32);
	crash.system_name = readString(32);
	crash.system_version = readString(32);
	crash.language = readString(8);
	crash.device_language = readString(16);
	crash.territory = readString(8);
	crash.android_build_fingerprint = readString(128);

	crash.userdata = [];
	for (var i = 0; i < USERDATA_SLOTS; i++) {
		crash.userdata[i] = readString(USERDATA_SIZE);
	}
	crash.modulename = [];
	for (var i = 0; i < MODULES_MAX; i++) {
		crash.modulename[i] = readString(MODULE_NAME_SIZE);
	}
	crash.moduleaddr = [];
	for (var i = 0; i < MODULES_MAX; i++) {
		crash.moduleaddr[i] = toHex(readUint64());
	}
	crash.signum = readUint32();
	crash.ptr_count = readUint32();
	crash.ptr = [];
	for (var i = 0; i < PTRS_MAX; i++) {
		crash.ptr[i] = toHex(readUint64());
	}
	crash.extra = readString(EXTRA_MAX);

	crash.modulesize = [];
	crash.ptrmoduleindex = [];
	crash.modulecount = 0;
	if (crash.version == 3) {
		for (var i = 0; i < PTRS_MAX; i++) {
			crash.ptrmoduleindex[i] = readUint8();
		}
		for (var i = 0; i < MODULES_MAX; i++) {
			crash.modulesize[i] = readUint32();
		}
		crash.modulecount = readUint32();
	}

	return crash;
}
