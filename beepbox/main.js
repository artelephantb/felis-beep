class SongRenderer {
	async* generate(song, sampleRate, enableIntro, enableOutro, loopCount) {
		const synth = new beepbox.Synth(song);
		synth.samplesPerSecond = sampleRate;
		synth.loopRepeatCount = loopCount - 1;
		if (!enableIntro) {
			for (let introIter = 0; introIter < song.loopStart; introIter++) {
				synth.goToNextBar();
			}
		}
		const totalSampleLength = Math.ceil(synth.getSamplesPerBar() * synth.getTotalBars(enableIntro, enableOutro));
		this.outputSamplesL = new Float32Array(totalSampleLength);
		this.outputSamplesR = new Float32Array(totalSampleLength);
		
		let sampleIndex = 0;
		let samplesPerNextRender = 1000;
		while (sampleIndex < totalSampleLength) {
			const stopSample = Math.min(sampleIndex + samplesPerNextRender, totalSampleLength);
			const samplesToRender = stopSample - sampleIndex;
			const startMillis = performance.now();
			synth.synthesize(this.outputSamplesL.subarray(sampleIndex, stopSample), this.outputSamplesR.subarray(sampleIndex, stopSample), samplesToRender);
			const stopMillis = performance.now();
			const elapsedMillis = stopMillis - startMillis;
			const targetMillis = 1000 / 30;
			samplesPerNextRender = Math.ceil(Math.max(1000, Math.min(500000, samplesToRender * targetMillis / elapsedMillis)));
			sampleIndex = stopSample;
			const completionRate = sampleIndex / totalSampleLength;
			yield completionRate;

			if (this.canceled) return;
		}
	}
}

async function _synthesize(sampleRate) {
	const _enableIntro = false;
	const _enableOutro = false;

	const _repeatCount = "1";

	const renderer = new SongRenderer();
	for await (const completionRate of renderer.generate(editor.doc.song, sampleRate, _enableIntro, _enableOutro, _repeatCount)) {
		renderer.canceled = this._canceled;
		if (this._canceled) break;
	}

	return {recordedSamplesL: renderer.outputSamplesL, recordedSamplesR: renderer.outputSamplesR};
}

async function _exportToWav() {
	const sampleRate = 48000; // Use professional video editing standard sample rate for .wav file export.
	const {recordedSamplesL, recordedSamplesR} = await _synthesize(sampleRate);
	if (this._canceled) return;
	const sampleFrames = recordedSamplesL.length;
	
	const wavChannelCount = 2;
	const bytesPerSample = 2;
	const bitsPerSample = 8 * bytesPerSample;
	const sampleCount = wavChannelCount * sampleFrames;
	
	const totalFileSize = 44 + sampleCount * bytesPerSample;
	
	let index = 0;
	const arrayBuffer = new ArrayBuffer(totalFileSize);
	const data = new DataView(arrayBuffer);
	data.setUint32(index, 0x52494646, false); index += 4;
	data.setUint32(index, 36 + sampleCount * bytesPerSample, true); index += 4; // size of remaining file
	data.setUint32(index, 0x57415645, false); index += 4;
	data.setUint32(index, 0x666D7420, false); index += 4;
	data.setUint32(index, 0x00000010, true); index += 4; // size of following header
	data.setUint16(index, 0x0001, true); index += 2; // not compressed
	data.setUint16(index, wavChannelCount, true); index += 2; // channel count
	data.setUint32(index, sampleRate, true); index += 4; // sample rate
	data.setUint32(index, sampleRate * bytesPerSample * wavChannelCount, true); index += 4; // bytes per second
	data.setUint16(index, bytesPerSample * wavChannelCount, true); index += 2; // block align
	data.setUint16(index, bitsPerSample, true); index += 2; // bits per sample
	data.setUint32(index, 0x64617461, false); index += 4;
	data.setUint32(index, sampleCount * bytesPerSample, true); index += 4;
	
	if (bytesPerSample > 1) {
		// usually samples are signed. 
		const range = (1 << (bitsPerSample - 1)) - 1;
		for (let i = 0; i < sampleFrames; i++) {
			let valL = Math.floor(Math.max(-1, Math.min(1, recordedSamplesL[i])) * range);
			let valR = Math.floor(Math.max(-1, Math.min(1, recordedSamplesR[i])) * range);
			if (bytesPerSample == 2) {
				data.setInt16(index, valL, true); index += 2;
				data.setInt16(index, valR, true); index += 2;
			} else if (bytesPerSample == 4) {
				data.setInt32(index, valL, true); index += 4;
				data.setInt32(index, valR, true); index += 4;
			} else {
				throw new Error("unsupported sample size");
			}
		}
	} else {
		// 8 bit samples are a special case: they are unsigned.
		for (let i = 0; i < sampleFrames; i++) {
			let valL = Math.floor(Math.max(-1, Math.min(1, recordedSamplesL[i])) * 127 + 128);
			let valR = Math.floor(Math.max(-1, Math.min(1, recordedSamplesR[i])) * 127 + 128);
			data.setUint8(index, valL > 255 ? 255 : (valL < 0 ? 0 : valL)); index++;
			data.setUint8(index, valR > 255 ? 255 : (valR < 0 ? 0 : valR)); index++;
		}
	}
	
	const blob = new Blob([arrayBuffer], {type: "audio/wav"});

	return saveAsURL(blob);
}

function saveAsFile(blob, name) {
	const anchor = document.createElement("a");
	if (anchor.download != undefined) {
		const url = URL.createObjectURL(blob);
		setTimeout(function() { URL.revokeObjectURL(url); }, 60000);
		anchor.href = url;
		anchor.download = name;
		// Chrome bug regression: We need to delay dispatching the click
		// event. Seems to be related to going back in the browser history.
		// https://bugs.chromium.org/p/chromium/issues/detail?id=825100
		setTimeout(function() { anchor.dispatchEvent(new MouseEvent("click")); }, 0);
	} else {
		const url = URL.createObjectURL(blob);
		setTimeout(function() { URL.revokeObjectURL(url); }, 60000);
		if (!window.open(url, "_blank")) window.location.href = url;
	}
}

function saveAsURL(blob) {
	const url = URL.createObjectURL(blob);
	setTimeout(function() { URL.revokeObjectURL(url); }, 60000);

	return url
}

function getSongAsBase64() {
	return editor.doc.song.toBase64String();
}



let editor;

function browserHasRequiredFeatures() {
	"use strict";
	if (window.AudioContext == undefined && window.webkitAudioContext == undefined) {
		return false;
	}

	try {
		eval("class T {}");
		eval("const a = () => 0");
		eval("for (const a of []);");
	} catch (error) {
		return true;
	}
	
	return true;
}

if (browserHasRequiredFeatures()) {
	// Go ahead and load js beepbox editor interface:
	var fileref = document.createElement("script");
	fileref.setAttribute("type", "text/javascript");
	fileref.addEventListener("load", function(event) {
		editor = new beepbox.SongEditor(document.getElementById("beepboxEditorContainer"));
	});
	fileref.setAttribute("src", "beepbox_editor.js");
	document.head.appendChild(fileref);
} else {
	document.getElementById("beepboxEditorContainer").innerHTML = "Sorry, BeepBox doesn\"t support your browser.";
}

// If the page was loaded with an old song version that old versions of BeepBox support,
// update the links to the old versions so that they"ll open the song.
if (/^#[1-6]/.test(location.hash)) {
	document.getElementById("linkTo2_3").href += location.hash;
}
if (/^#[1-8]/.test(location.hash)) {
	document.getElementById("linkTo3_0").href += location.hash;
}
